using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace CasinoDesk.Api.Contracts;

public sealed record AlertPatchRequest([Required] string Status, string? ResolutionNote);
public sealed record ManualAlertRequest(
    [Required, MinLength(5)] string Title,
    [Required, MinLength(10)] string Description,
    string? ClientHash,
    [Range(typeof(decimal), "0", "999999999")] decimal Amount);
public sealed record RteCreateRequest(
    [Required] string ClientHash,
    [property: JsonRequired][Range(typeof(decimal), "0.01", "999999999")] decimal TotalAmount,
    [Required, MinLength(5)] string OriginOfFunds,
    [property: JsonRequired] bool SignedByClient,
    IReadOnlyCollection<Guid> TransactionIds);
public sealed record RosCreateRequest(
    [property: JsonRequired] Guid AlertId,
    [Required, MinLength(20)] string Narrative);
public sealed record DemoWatchlistRequest(
    [Required, MinLength(4)] string DocumentNumber);
public sealed record RteSignatureRequest([property: JsonRequired] bool SignedByClient);
