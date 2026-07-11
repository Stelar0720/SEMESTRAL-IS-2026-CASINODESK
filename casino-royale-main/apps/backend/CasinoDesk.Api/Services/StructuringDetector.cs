using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public sealed class StructuringDetector : IStructuringDetector
{
    public AlertRecord? Detect(string clientHash, decimal currentAmount, IReadOnlyCollection<TransactionRecord> transactions)
    {
        if (currentAmount >= 2000)
        {
            return null;
        }

        var cutoff = DateTimeOffset.UtcNow.AddHours(-24);
        var count = transactions.Count(item => item.ClientHash == clientHash && item.Amount < 2000 && item.CreatedAt >= cutoff);

        if (count >= 2)
        {
            return new AlertRecord
            {
                Type = AlertType.Fraccionamiento,
                Title = "Patron de fraccionamiento detectado",
                Description = "Tres o mas transacciones bajo umbral en 24 horas.",
                RiskLevel = RiskLevel.Amarillo,
                Severity = "CRITICA",
                ClientHash = clientHash,
                Amount = currentAmount
            };
        }

        return null;
    }
}
