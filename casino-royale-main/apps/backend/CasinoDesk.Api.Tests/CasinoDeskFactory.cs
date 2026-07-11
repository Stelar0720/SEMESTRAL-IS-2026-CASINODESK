using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace CasinoDesk.Api.Tests;

public sealed class CasinoDeskFactory : WebApplicationFactory<Program>
{
    public string DatabasePath { get; } = Path.Combine(Path.GetTempPath(), $"casinodesk-tests-{Guid.NewGuid():N}.db");

    public CasinoDeskFactory()
    {
        Environment.SetEnvironmentVariable("Jwt__SigningKey", "CasinoDesk-Integration-Tests-Signing-Key-At-Least-32-Characters");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Issuer"] = "CasinoDesk",
            ["Jwt:Audience"] = "CasinoDesk.Client",
            ["Jwt:SigningKey"] = "CasinoDesk-Integration-Tests-Signing-Key-At-Least-32-Characters",
            ["DatabaseFile"] = DatabasePath,
            ["EnableSwagger"] = "false",
            ["AllowedOrigins:0"] = "http://localhost"
        }));
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        Environment.SetEnvironmentVariable("Jwt__SigningKey", null);
        foreach (var suffix in new[] { "", "-wal", "-shm" })
        {
            var path = DatabasePath + suffix;
            if (File.Exists(path)) File.Delete(path);
        }
    }
}
