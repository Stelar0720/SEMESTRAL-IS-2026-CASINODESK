namespace CasinoDesk.Api.Services;

public sealed class MockAmlScreeningProvider : IScreeningProvider
{
    private static readonly string[] OfacMatch = ["OFAC SDN List"];

    public Task<IReadOnlyCollection<string>> CheckAsync(string normalizedClientName, CancellationToken cancellationToken)
    {
        if (normalizedClientName.Contains("OFAC") || normalizedClientName.Contains("SANCIONADO"))
        {
            return Task.FromResult<IReadOnlyCollection<string>>(OfacMatch);
        }

        if (normalizedClientName.Contains("TIMEOUT"))
        {
            return Task.Delay(TimeSpan.FromSeconds(5), cancellationToken)
                .ContinueWith<IReadOnlyCollection<string>>(_ => [], cancellationToken);
        }

        return Task.FromResult<IReadOnlyCollection<string>>([]);
    }
}

public sealed class MockPepProvider : IPepProvider
{
    public Task<string?> CheckAsync(string normalizedClientName, CancellationToken cancellationToken)
    {
        if (normalizedClientName.Contains("PEP") || normalizedClientName.Contains("ALCALDE"))
        {
            return Task.FromResult<string?>("Perfil PEP detectado");
        }

        return Task.FromResult<string?>(null);
    }
}
