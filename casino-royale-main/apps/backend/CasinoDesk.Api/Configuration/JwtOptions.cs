namespace CasinoDesk.Api.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "CasinoDesk";
    public string Audience { get; init; } = "CasinoDesk.Client";
    public string SigningKey { get; init; } = string.Empty;
}
