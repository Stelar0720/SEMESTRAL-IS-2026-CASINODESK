using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Contracts;

public sealed record TransactionRequest(
    [Required, MinLength(3)] 
    string ClientName,
    [Required, MinLength(4)]
    string DocumentNumber,
    [property: JsonRequired][Range(typeof(decimal), "0.01", "999999999")] decimal Amount,
    [property: JsonRequired] PaymentMethod PaymentMethod,
    string? OriginOfFunds,
    string? Justification,
    decimal? ChipsPlayedRatio,
    bool SignedByClient = false
);

public sealed record TransactionResponse(
    Guid TransactionId,
    string ClientHash,
    RiskLevel RiskLevel,
    TransactionStatus Status,
    [property: JsonRequired] bool RequiresKyc,
    [property: JsonRequired] bool RequiresRte,
    [property: JsonRequired] bool AlertRaised,
    string Message
);

public sealed record ScreeningRunRequest(
    [Required, MinLength(3)]
    string ClientName,
    [Required, MinLength(4)]
    string DocumentNumber,
    [property: JsonRequired][Range(typeof(decimal), "0.01", "999999999")] decimal Amount
);
