using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CasinoDesk.Api.Services;

public sealed class AuthService : IAuthService
{
    private readonly ConcurrentDictionary<string, (Guid UserId, DateTimeOffset ExpiresAt)> _refreshTokens = new();
    private readonly ICasinoDeskRepository _repository;
    private readonly JwtOptions _options;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditLogger _auditLogger;

    public AuthService(ICasinoDeskRepository repository, IOptions<JwtOptions> options, IPasswordHasher passwordHasher, IAuditLogger auditLogger)
    {
        _repository = repository;
        _options = options.Value;
        _passwordHasher = passwordHasher;
        _auditLogger = auditLogger;
    }

    public AuthResponse Login(LoginRequest request)
    {
        var user = _repository.Users.FirstOrDefault(item =>
            string.Equals(item.Username, request.Username, StringComparison.OrdinalIgnoreCase));
        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash, user.PasswordSalt))
            throw new UnauthorizedAccessException("Usuario o contrasena incorrectos.");
        _auditLogger.Log(user.FullName, "Inicio de sesion", $"Acceso autorizado para {user.Role}.");
        return IssueTokens(user);
    }

    public AuthResponse Refresh(string refreshToken)
    {
        if (!_refreshTokens.TryRemove(refreshToken, out var session) || session.ExpiresAt <= DateTimeOffset.UtcNow)
            throw new UnauthorizedAccessException("Refresh token invalido o expirado.");
        var user = _repository.Users.FirstOrDefault(item => item.Id == session.UserId)
            ?? throw new UnauthorizedAccessException("Usuario de sesion no encontrado.");
        _auditLogger.Log(user.FullName, "Sesion renovada", "Refresh token rotado.");
        return IssueTokens(user);
    }

    public void Logout(string refreshToken) => _refreshTokens.TryRemove(refreshToken, out _);

    private AuthResponse IssueTokens(User user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("station", user.Station)
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _options.Issuer, audience: _options.Audience, claims: claims,
            expires: DateTime.UtcNow.AddMinutes(30), signingCredentials: credentials);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        _refreshTokens[refreshToken] = (user.Id, DateTimeOffset.UtcNow.AddHours(8));
        return new AuthResponse(new JwtSecurityTokenHandler().WriteToken(token), refreshToken, user.FullName, user.Role, user.Station);
    }
}
