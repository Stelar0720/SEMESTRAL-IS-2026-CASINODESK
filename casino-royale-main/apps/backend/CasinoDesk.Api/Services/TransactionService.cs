using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public sealed class TransactionService : ITransactionService
{
    private readonly ICasinoDeskRepository _repository;
    private readonly ICustomerIdentityHasher _hasher;
    private readonly IRiskConsolidator _riskConsolidator;
    private readonly IStructuringDetector _structuringDetector;
    private readonly IAuditLogger _auditLogger;

    public TransactionService(
        ICasinoDeskRepository repository,
        ICustomerIdentityHasher hasher,
        IRiskConsolidator riskConsolidator,
        IStructuringDetector structuringDetector,
        IAuditLogger auditLogger)
    {
        _repository = repository;
        _hasher = hasher;
        _riskConsolidator = riskConsolidator;
        _structuringDetector = structuringDetector;
        _auditLogger = auditLogger;
    }

    public async Task<TransactionResponse> RegisterAsync(
        TransactionType type,
        TransactionRequest request,
        string actor,
        CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
            throw new ArgumentException("El monto debe ser mayor que cero.");
        if (string.IsNullOrWhiteSpace(request.ClientName) || string.IsNullOrWhiteSpace(request.DocumentNumber))
            throw new ArgumentException("El nombre y documento del cliente son obligatorios.");
        if (request.PaymentMethod == PaymentMethod.Efectivo && request.Amount >= 10000 && string.IsNullOrWhiteSpace(request.OriginOfFunds))
            throw new ArgumentException("El origen de fondos es obligatorio para operaciones en efectivo de 10,000 o más.");
        if (request.ChipsPlayedRatio is < 0 or > 1)
            throw new ArgumentException("La proporción de fichas jugadas debe estar entre 0 y 1.");

        var clientHash = _hasher.Hash(request.DocumentNumber);
        var requiresKyc = request.Amount >= 2000;
        var requiresRte = request.PaymentMethod == PaymentMethod.Efectivo && request.Amount >= 10000;
        var screening = requiresKyc
            ? await RunScreeningAsync(request.ClientName, request.DocumentNumber, cancellationToken)
            : new ScreeningResult(RiskLevel.Verde, false, false, Array.Empty<string>(), null);

        var status = screening.Level switch
        {
            RiskLevel.Rojo => TransactionStatus.Bloqueada,
            _ when requiresRte => TransactionStatus.PendienteRte,
            RiskLevel.Amarillo => TransactionStatus.PendienteRevision,
            _ => TransactionStatus.Completada
        };

        var record = new TransactionRecord
        {
            Type = type,
            ClientName = request.ClientName,
            ClientHash = clientHash,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            RiskLevel = screening.Level,
            Status = status,
            RequiresKyc = requiresKyc,
            RequiresRte = requiresRte,
            ChipsPlayedRatio = request.ChipsPlayedRatio
        };

        _repository.AddTransaction(record);

        var alertRaised = TryAddAlert(screening, type, request, clientHash);
        TryAddStructuringAlert(clientHash, request);
        TryAddRte(requiresRte, request, clientHash, record);

        _auditLogger.Log(actor, $"{type} registrado", $"Estado final {status}");

        return new TransactionResponse(
            record.Id,
            clientHash,
            screening.Level,
            status,
            requiresKyc,
            requiresRte,
            alertRaised,
            BuildStatusMessage(status, requiresRte));
    }

    public Task<ScreeningResult> ScreeningOnlyAsync(ScreeningRunRequest request, CancellationToken cancellationToken)
        => RunScreeningAsync(request.ClientName, request.DocumentNumber, cancellationToken);

    private Task<ScreeningResult> RunScreeningAsync(
        string clientName,
        string documentNumber,
        CancellationToken cancellationToken)
    {
        var documentHash = _hasher.Hash(documentNumber);
        if (_repository.IsDemoWatchlisted(documentHash))
        {
            return Task.FromResult(new ScreeningResult(
                RiskLevel.Rojo,
                false,
                false,
                new[]
                {
                    "Coincidencia exacta de documento en lista AML academica.",
                    "Validacion manual requerida por el Oficial de Cumplimiento.",
                    "Fuente simulada para demostracion universitaria; no corresponde a una lista gubernamental real."
                },
                null));
        }

        return _riskConsolidator.RunAsync(clientName, cancellationToken);
    }

    private bool TryAddAlert(ScreeningResult screening, TransactionType type, TransactionRequest request, string clientHash)
    {
        var added = false;

        if (screening.Level == RiskLevel.Rojo)
        {
            added = true;
            _repository.AddAlert(new AlertRecord
            {
                Type = AlertType.Aml,
                Title = "Transaccion bloqueada por screening",
                Description = string.Join(" ", screening.AmlMatches),
                RiskLevel = RiskLevel.Rojo,
                Severity = "CRITICA",
                ClientHash = clientHash,
                Amount = request.Amount
            });
        }

        if (screening.Level == RiskLevel.Amarillo)
        {
            added = true;
            _repository.AddAlert(new AlertRecord
            {
                Type = screening.TimedOut ? AlertType.Timeout : AlertType.Pep,
                Title = screening.TimedOut ? "Timeout precautorio AML" : "PEP requiere revision",
                Description = screening.TimedOut
                    ? "Proveedor externo no respondio tras el reintento."
                    : "Evaluar proporcionalidad del monto y origen de fondos.",
                RiskLevel = RiskLevel.Amarillo,
                Severity = "ALTA",
                ClientHash = clientHash,
                Amount = request.Amount
            });
        }

        if (type == TransactionType.CashOut && request.ChipsPlayedRatio is decimal ratio && ratio < 0.2m)
        {
            added = true;
            _repository.AddAlert(new AlertRecord
            {
                Type = AlertType.Comportamiento,
                Title = "Comportamiento anomalo",
                Description = "El cliente aposto menos del 20% de las fichas.",
                RiskLevel = RiskLevel.Amarillo,
                Severity = "ALTA",
                ClientHash = clientHash,
                Amount = request.Amount
            });
        }

        return added;
    }

    private void TryAddStructuringAlert(string clientHash, TransactionRequest request)
    {
        var structuring = _structuringDetector.Detect(clientHash, request.Amount, _repository.Transactions);
        if (structuring is not null)
        {
            _repository.AddAlert(structuring);
        }
    }

    private void TryAddRte(bool requiresRte, TransactionRequest request, string clientHash, TransactionRecord record)
    {
        if (requiresRte && !string.IsNullOrWhiteSpace(request.OriginOfFunds))
        {
            _repository.AddRte(new RteRecord
            {
                ClientHash = clientHash,
                TotalAmount = request.Amount,
                OriginOfFunds = request.OriginOfFunds,
                SignedByClient = request.SignedByClient,
                ApprovedByOfficer = false,
                Folio = $"RTE-{DateTime.UtcNow:yyyy}-{DateTime.UtcNow:MMddHHmmssfff}",
                Status = request.SignedByClient ? "PENDIENTE_APROBACION" : "PENDIENTE_FIRMA",
                SignedAt = request.SignedByClient ? DateTimeOffset.UtcNow : null,
                TransactionIds = new[] { record.Id }
            });
        }
    }

    private static string BuildStatusMessage(TransactionStatus status, bool requiresRte)
    {
        if (status == TransactionStatus.Bloqueada)
            return "Operacion bloqueada por screening AML.";
        if (requiresRte)
            return "Operacion registrada y enviada a flujo RTE.";
        return "Operacion registrada correctamente.";
    }
}
