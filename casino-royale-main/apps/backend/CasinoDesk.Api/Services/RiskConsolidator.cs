using CasinoDesk.Api.Domain;
using System.Text;

namespace CasinoDesk.Api.Services;

public sealed class RiskConsolidator : IRiskConsolidator
{
    private readonly IScreeningProvider _screeningProvider;
    private readonly IPepProvider _pepProvider;

    public RiskConsolidator(IScreeningProvider screeningProvider, IPepProvider pepProvider)
    {
        _screeningProvider = screeningProvider;
        _pepProvider = pepProvider;
    }

    public async Task<ScreeningResult> RunAsync(string clientName, CancellationToken cancellationToken)
    {
        var normalized = Normalize(clientName);
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(3));

        try
        {
            var amlTask = _screeningProvider.CheckAsync(normalized, cts.Token);
            var pepTask = _pepProvider.CheckAsync(normalized, cts.Token);
            await Task.WhenAll(amlTask, pepTask);

            var amlMatches = amlTask.Result;
            var pepMatch = pepTask.Result;

            if (amlMatches.Count > 0)
            {
                return new ScreeningResult(RiskLevel.Rojo, false, false, amlMatches, pepMatch);
            }

            if (!string.IsNullOrWhiteSpace(pepMatch))
            {
                return new ScreeningResult(RiskLevel.Amarillo, true, false, amlMatches, pepMatch);
            }

            return new ScreeningResult(RiskLevel.Verde, false, false, amlMatches, pepMatch);
        }
        catch (OperationCanceledException)
        {
            return new ScreeningResult(RiskLevel.Amarillo, true, true, Array.Empty<string>(), null);
        }
    }

    private static string Normalize(string value)
        => value.Normalize(NormalizationForm.FormD)
            .Where(character => char.GetUnicodeCategory(character) != System.Globalization.UnicodeCategory.NonSpacingMark)
            .Aggregate(string.Empty, (current, character) => current + char.ToUpperInvariant(character));
}
