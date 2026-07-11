using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("auth")]
[EnableRateLimiting("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
        => Ok(_authService.Login(request));

    [HttpPost("refresh")]
    public ActionResult<AuthResponse> Refresh([FromBody] RefreshTokenRequest request)
        => Ok(_authService.Refresh(request.RefreshToken));

    [HttpPost("logout")]
    public ActionResult Logout([FromBody] RefreshTokenRequest request)
    {
        _authService.Logout(request.RefreshToken);
        return NoContent();
    }
}
