using CasinoDesk.Api.Domain;
using System.ComponentModel.DataAnnotations;

namespace CasinoDesk.Api.Contracts;

public sealed record LoginRequest(
    [Required] string Username,
    [Required] string Password);

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    string FullName,
    Role Role,
    string Station
);
public sealed record RefreshTokenRequest([Required] string RefreshToken);
