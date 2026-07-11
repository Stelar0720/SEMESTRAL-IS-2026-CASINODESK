using CasinoDesk.Api.Domain;
using System.ComponentModel.DataAnnotations;

namespace CasinoDesk.Api.Contracts;

public sealed record ProspectUpsertRequest(
    [Required, MinLength(4)] string DocumentNumber,
    [Required] string DocumentType,
    string? IssuingCountry,
    DateOnly? DocumentIssuedAt,
    DateOnly? DocumentExpiresAt,
    [Required, MinLength(2)] string FirstNames,
    [Required, MinLength(2)] string LastNames,
    DateOnly? BirthDate,
    string? BirthPlace,
    string? Sex,
    [Required] string Nationality,
    [Required] string ResidenceCountry,
    string? Address,
    string? Phone,
    [EmailAddress] string? Email,
    string? Occupation,
    string? Employer,
    string? EconomicActivity,
    string? MonthlyIncomeRange,
    decimal ExpectedGamingAmount,
    string? ExpectedGamingFrequency,
    string? SourceOfFunds,
    string? RelationshipPurpose,
    bool IsPep,
    string? PepRelationship,
    RiskLevel RiskLevel,
    [Range(0, 100)] int RiskScore,
    string? Status);

public sealed record KycEvidenceCreateRequest(
    [Required] string EvidenceType,
    [Required] string Source,
    string? Reference,
    [Required] string Result,
    bool IsSimulated);
