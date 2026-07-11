namespace CasinoDesk.Api.Domain;

public sealed record User(
    Guid Id,
    string Username,
    string FullName,
    Role Role,
    string Station,
    string PasswordHash,
    string PasswordSalt
);

public sealed record ScreeningResult(
    RiskLevel Level,
    bool RequiresReview,
    bool TimedOut,
    IReadOnlyCollection<string> AmlMatches,
    string? PepMatch
);

public sealed class TransactionRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public TransactionType Type { get; init; }
    public string ClientName { get; init; } = string.Empty;
    public string ClientHash { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public PaymentMethod PaymentMethod { get; init; }
    public RiskLevel RiskLevel { get; init; }
    public TransactionStatus Status { get; set; }
    public bool RequiresKyc { get; init; }
    public bool RequiresRte { get; init; }
    public decimal? ChipsPlayedRatio { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class AlertRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public AlertType Type { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public RiskLevel RiskLevel { get; init; }
    public string Severity { get; init; } = "ALTA";
    public string ClientHash { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Status { get; set; } = "ABIERTA";
    public string ResolutionNote { get; set; } = string.Empty;
    public string ReviewedBy { get; set; } = string.Empty;
    public DateTimeOffset? ClosedAt { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class RteRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string ClientHash { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public string OriginOfFunds { get; init; } = string.Empty;
    public bool SignedByClient { get; set; }
    public bool ApprovedByOfficer { get; set; }
    public string Folio { get; init; } = string.Empty;
    public string Status { get; set; } = "PENDIENTE_FIRMA";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? SignedAt { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public string ApprovedBy { get; set; } = string.Empty;
    public DateTimeOffset? SentAt { get; set; }
    public string SubmissionReference { get; set; } = string.Empty;
    public IReadOnlyCollection<Guid> TransactionIds { get; init; } = Array.Empty<Guid>();
}

public sealed class RosRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AlertId { get; init; }
    public string Narrative { get; init; } = string.Empty;
    public string SignedBy { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public string Status { get; set; } = "BORRADOR";
    public DateTimeOffset? SentAt { get; set; }
    public string SubmissionReference { get; set; } = string.Empty;
}

public sealed class AuditEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Actor { get; init; } = string.Empty;
    public string Event { get; init; } = string.Empty;
    public string Result { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class ProspectRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string DocumentHash { get; init; } = string.Empty;
    public string DocumentType { get; set; } = "CEDULA";
    public string DocumentNumberMasked { get; set; } = string.Empty;
    public string IssuingCountry { get; set; } = "PANAMA";
    public DateOnly? DocumentIssuedAt { get; set; }
    public DateOnly? DocumentExpiresAt { get; set; }
    public string FirstNames { get; set; } = string.Empty;
    public string LastNames { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public string BirthPlace { get; set; } = string.Empty;
    public string Sex { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public string ResidenceCountry { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Occupation { get; set; } = string.Empty;
    public string Employer { get; set; } = string.Empty;
    public string EconomicActivity { get; set; } = string.Empty;
    public string MonthlyIncomeRange { get; set; } = string.Empty;
    public decimal ExpectedGamingAmount { get; set; }
    public string ExpectedGamingFrequency { get; set; } = string.Empty;
    public string SourceOfFunds { get; set; } = string.Empty;
    public string RelationshipPurpose { get; set; } = string.Empty;
    public bool IsPep { get; set; }
    public string PepRelationship { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; } = RiskLevel.Verde;
    public int RiskScore { get; set; }
    public string Status { get; set; } = "PENDIENTE";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class KycEvidenceRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProspectId { get; init; }
    public string EvidenceType { get; init; } = string.Empty;
    public string Source { get; init; } = string.Empty;
    public string Reference { get; init; } = string.Empty;
    public string Result { get; init; } = string.Empty;
    public bool IsSimulated { get; init; }
    public string CapturedBy { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
