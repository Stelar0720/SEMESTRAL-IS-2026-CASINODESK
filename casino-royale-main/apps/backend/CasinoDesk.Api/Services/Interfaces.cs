using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public interface IAuthService
{
    AuthResponse Login(LoginRequest request);
    AuthResponse Refresh(string refreshToken);
    void Logout(string refreshToken);
}

public interface IPasswordHasher
{
    (string Hash, string Salt) Hash(string password);
    bool Verify(string password, string hash, string salt);
}

public interface IAuditLogger
{
    void Log(string actor, string @event, string result);
}

public interface ICustomerIdentityHasher
{
    string Hash(string documentNumber);
}

public interface IScreeningProvider
{
    Task<IReadOnlyCollection<string>> CheckAsync(string normalizedClientName, CancellationToken cancellationToken);
}

public interface IPepProvider
{
    Task<string?> CheckAsync(string normalizedClientName, CancellationToken cancellationToken);
}

public interface IRiskConsolidator
{
    Task<ScreeningResult> RunAsync(string clientName, CancellationToken cancellationToken);
}

public interface IStructuringDetector
{
    AlertRecord? Detect(string clientHash, decimal currentAmount, IReadOnlyCollection<TransactionRecord> transactions);
}

public interface ICasinoDeskRepository
{
    IReadOnlyCollection<TransactionRecord> Transactions { get; }
    IReadOnlyCollection<AlertRecord> Alerts { get; }
    IReadOnlyCollection<RteRecord> Rtes { get; }
    IReadOnlyCollection<RosRecord> Ros { get; }
    IReadOnlyCollection<AuditEntry> AuditTrail { get; }
    IReadOnlyCollection<User> Users { get; }
    void AddTransaction(TransactionRecord record);
    void UpdateTransaction(TransactionRecord record);
    void AddAlert(AlertRecord alert);
    void AddAudit(AuditEntry auditEntry);
    void AddRte(RteRecord rte);
    void ApproveRte(Guid id);
    void UpdateRte(RteRecord rte);
    void UpdateAlert(Guid id, string status, string? resolutionNote = null, string? reviewedBy = null);
    void AddRos(RosRecord ros);
    void UpdateRos(RosRecord ros);
    bool IsDemoWatchlisted(string documentHash);
    void AddDemoWatchlist(string documentHash);
}

public interface IProspectRepository
{
    IReadOnlyCollection<ProspectRecord> GetProspects();
    ProspectRecord? GetProspect(Guid id);
    ProspectRecord? FindProspectByDocumentHash(string documentHash);
    ProspectRecord UpsertProspect(ProspectRecord prospect);
    IReadOnlyCollection<KycEvidenceRecord> GetEvidence(Guid prospectId);
    KycEvidenceRecord AddEvidence(KycEvidenceRecord evidence);
}

public interface ITransactionService
{
    Task<TransactionResponse> RegisterAsync(TransactionType type, TransactionRequest request, string actor, CancellationToken cancellationToken);
    Task<ScreeningResult> ScreeningOnlyAsync(ScreeningRunRequest request, CancellationToken cancellationToken);
}

public interface IRteService
{
    IReadOnlyCollection<RteRecord> GetAll();
    RteRecord Create(RteCreateRequest request, string actor);
    void Sign(Guid id, string actor);
    void Approve(Guid id, string actor);
    RteRecord Submit(Guid id, string actor);
}

public interface IRosService
{
    IReadOnlyCollection<RosRecord> GetAll();
    RosRecord Create(RosCreateRequest request, string actor);
    RosRecord Submit(Guid id, string actor);
}
