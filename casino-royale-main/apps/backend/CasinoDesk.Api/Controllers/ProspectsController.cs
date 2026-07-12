using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("prospects")]
[Authorize]
public sealed class ProspectsController : ControllerBase
{
    private readonly IProspectRepository _repository;
    private readonly ICustomerIdentityHasher _hasher;
    private readonly IAuditLogger _auditLogger;

    public ProspectsController(IProspectRepository repository, ICustomerIdentityHasher hasher, IAuditLogger auditLogger)
    {
        _repository = repository;
        _hasher = hasher;
        _auditLogger = auditLogger;
    }

    [HttpGet]
    [Authorize(Policy = Policies.OfficerAccess)]
    public ActionResult<IReadOnlyCollection<ProspectRecord>> GetAll() => Ok(_repository.GetProspects());

    [HttpGet("{id:guid}")]
    [Authorize(Policy = Policies.OfficerAccess)]
    public ActionResult<object> Get(Guid id)
    {
        var prospect = _repository.GetProspect(id) ?? throw new KeyNotFoundException("Prospecto no encontrado.");
        return Ok(new { prospect, evidence = _repository.GetEvidence(id) });
    }

    [HttpPost]
    [Authorize(Policy = Policies.OperatorAccess)]
    public ActionResult<ProspectRecord> Upsert([FromBody] ProspectUpsertRequest request)
    {
        Validate(request);
        var record = new ProspectRecord
        {
            DocumentHash = _hasher.Hash(request.DocumentNumber),
            DocumentType = request.DocumentType.Trim().ToUpperInvariant(),
            DocumentNumberMasked = MaskDocument(request.DocumentNumber),
            IssuingCountry = Clean(request.IssuingCountry, "PANAMA"),
            DocumentIssuedAt = request.DocumentIssuedAt,
            DocumentExpiresAt = request.DocumentExpiresAt,
            FirstNames = request.FirstNames.Trim(),
            LastNames = request.LastNames.Trim(),
            BirthDate = request.BirthDate,
            BirthPlace = Clean(request.BirthPlace),
            Sex = Clean(request.Sex),
            Nationality = request.Nationality.Trim(),
            ResidenceCountry = request.ResidenceCountry.Trim(),
            Address = Clean(request.Address),
            Phone = Clean(request.Phone),
            Email = Clean(request.Email).ToLowerInvariant(),
            Occupation = Clean(request.Occupation),
            Employer = Clean(request.Employer),
            EconomicActivity = Clean(request.EconomicActivity),
            MonthlyIncomeRange = Clean(request.MonthlyIncomeRange),
            ExpectedGamingAmount = request.ExpectedGamingAmount,
            ExpectedGamingFrequency = Clean(request.ExpectedGamingFrequency),
            SourceOfFunds = Clean(request.SourceOfFunds),
            SourceOfWealth = Clean(request.SourceOfWealth),
            RelationshipPurpose = Clean(request.RelationshipPurpose),
            ActsOnOwnBehalf = request.ActsOnOwnBehalf ?? true,
            ThirdPartyDetails = Clean(request.ThirdPartyDetails),
            IsPep = request.IsPep,
            PepRelationship = Clean(request.PepRelationship),
            RiskLevel = request.RiskLevel,
            RiskScore = request.RiskScore,
            Status = Clean(request.Status, "PENDIENTE").ToUpperInvariant(),
            UpdatedAt = DateTimeOffset.UtcNow
        };
        var saved = _repository.UpsertProspect(record);
        _auditLogger.Log(User.Identity?.Name ?? "Sistema", "Expediente KYC guardado", $"Prospecto {saved.Id}; riesgo {saved.RiskLevel}");
        return Ok(saved);
    }

    [HttpPost("{id:guid}/evidence")]
    [Authorize(Policy = Policies.OperatorAccess)]
    public ActionResult<KycEvidenceRecord> AddEvidence(Guid id, [FromBody] KycEvidenceCreateRequest request)
    {
        var evidence = _repository.AddEvidence(new KycEvidenceRecord
        {
            ProspectId = id,
            EvidenceType = request.EvidenceType.Trim().ToUpperInvariant(),
            Source = request.Source.Trim(),
            Reference = Clean(request.Reference),
            Result = request.Result.Trim(),
            IsSimulated = request.IsSimulated,
            CapturedBy = User.Identity?.Name ?? "Sistema"
        });
        _auditLogger.Log(evidence.CapturedBy, "Evidencia KYC agregada", $"{evidence.EvidenceType} para prospecto {id}");
        return Ok(evidence);
    }

    private static void Validate(ProspectUpsertRequest request)
    {
        if (request.DocumentExpiresAt is DateOnly expiry && expiry < DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ArgumentException("El documento del prospecto esta vencido.");
        if (request.BirthDate is DateOnly birthDate && birthDate > DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-18)))
            throw new ArgumentException("El prospecto debe ser mayor de edad.");
        if (request.IsPep && string.IsNullOrWhiteSpace(request.PepRelationship))
            throw new ArgumentException("Debe documentar la relacion o condicion PEP.");
        if (request.ActsOnOwnBehalf == false && string.IsNullOrWhiteSpace(request.ThirdPartyDetails))
            throw new ArgumentException("Debe identificar al tercero o beneficiario final cuando el prospecto no actua por cuenta propia.");
        if (request.ExpectedGamingAmount < 0)
            throw new ArgumentException("El monto esperado no puede ser negativo.");
    }

    private static string MaskDocument(string documentNumber)
    {
        var normalized = documentNumber.Trim();
        if (normalized.Length <= 4) return normalized;
        return $"***{normalized[^4..]}";
    }

    private static string Clean(string? value, string fallback = "") => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
}
