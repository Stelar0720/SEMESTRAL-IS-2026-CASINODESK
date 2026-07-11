using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public sealed class RteService : IRteService
{
    private readonly ICasinoDeskRepository _repository;
    private readonly IAuditLogger _auditLogger;

    public RteService(ICasinoDeskRepository repository, IAuditLogger auditLogger)
    {
        _repository = repository;
        _auditLogger = auditLogger;
    }

    public IReadOnlyCollection<RteRecord> GetAll() => _repository.Rtes;

    public RteRecord Create(RteCreateRequest request, string actor)
    {
        if (request.TotalAmount <= 0)
            throw new ArgumentException("El monto total debe ser mayor que cero.");
        if (string.IsNullOrWhiteSpace(request.OriginOfFunds))
            throw new ArgumentException("El origen de fondos es obligatorio.");

        var rte = new RteRecord
        {
            ClientHash = request.ClientHash,
            TotalAmount = request.TotalAmount,
            OriginOfFunds = request.OriginOfFunds,
            SignedByClient = request.SignedByClient,
            ApprovedByOfficer = false,
            Folio = BuildFolio(),
            Status = request.SignedByClient ? "PENDIENTE_APROBACION" : "PENDIENTE_FIRMA",
            SignedAt = request.SignedByClient ? DateTimeOffset.UtcNow : null,
            TransactionIds = request.TransactionIds
        };
        _repository.AddRte(rte);
        _auditLogger.Log(actor, "RTE creado", rte.Id.ToString());
        return rte;
    }

    public void Sign(Guid id, string actor)
    {
        var rte = _repository.Rtes.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("RTE no encontrado.");
        if (rte.Status == "ENVIADO") throw new InvalidOperationException("El RTE ya fue enviado.");
        if (rte.SignedByClient) throw new InvalidOperationException("La firma del cliente ya fue registrada.");
        rte.SignedByClient = true;
        rte.SignedAt = DateTimeOffset.UtcNow;
        rte.Status = "PENDIENTE_APROBACION";
        _repository.UpdateRte(rte);
        _auditLogger.Log(actor, "Firma de cliente registrada en RTE", id.ToString());
    }

    public void Approve(Guid id, string actor)
    {
        var rte = _repository.Rtes.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("RTE no encontrado.");
        if (!rte.SignedByClient) throw new InvalidOperationException("El RTE requiere firma del cliente antes de aprobarse.");
        if (rte.ApprovedByOfficer) throw new InvalidOperationException("El RTE ya fue aprobado.");
        rte.ApprovedByOfficer = true;
        rte.ApprovedAt = DateTimeOffset.UtcNow;
        rte.ApprovedBy = actor;
        rte.Status = "APROBADO";
        _repository.UpdateRte(rte);
        _auditLogger.Log(actor, "RTE aprobado", id.ToString());
    }

    public RteRecord Submit(Guid id, string actor)
    {
        var rte = _repository.Rtes.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("RTE no encontrado.");
        if (!rte.ApprovedByOfficer) throw new InvalidOperationException("El RTE debe estar aprobado antes del envio.");
        if (rte.Status == "ENVIADO") throw new InvalidOperationException("El RTE ya fue enviado.");
        rte.Status = "ENVIADO";
        rte.SentAt = DateTimeOffset.UtcNow;
        rte.SubmissionReference = $"UAF-DEMO-RTE-{DateTime.UtcNow:yyyyMMdd}-{rte.Id.ToString("N")[..8].ToUpperInvariant()}";
        _repository.UpdateRte(rte);
        foreach (var transaction in _repository.Transactions.Where(item => rte.TransactionIds.Contains(item.Id)))
        {
            if (transaction.Status == TransactionStatus.PendienteRte)
            {
                transaction.Status = TransactionStatus.Completada;
                _repository.UpdateTransaction(transaction);
            }
        }
        _auditLogger.Log(actor, "RTE enviado a UAF simulada", rte.SubmissionReference);
        return rte;
    }

    private static string BuildFolio() => $"RTE-{DateTime.UtcNow:yyyy}-{DateTime.UtcNow:MMddHHmmssfff}";
}
