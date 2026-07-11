using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("screening")]
[Authorize]
public sealed class ScreeningController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ICustomerIdentityHasher _identityHasher;
    private readonly ICasinoDeskRepository _repository;
    private readonly IAuditLogger _auditLogger;

    public ScreeningController(
        ITransactionService transactionService,
        ICustomerIdentityHasher identityHasher,
        ICasinoDeskRepository repository,
        IAuditLogger auditLogger)
    {
        _transactionService = transactionService;
        _identityHasher = identityHasher;
        _repository = repository;
        _auditLogger = auditLogger;
    }

    [HttpPost("run")]
    [Authorize(Policy = Policies.OperatorAccess)]
    public async Task<ActionResult<object>> Run([FromBody] ScreeningRunRequest request, CancellationToken cancellationToken)
    {
        var result = await _transactionService.ScreeningOnlyAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("demo-watchlist")]
    [Authorize(Policy = Policies.AdminAccess)]
    public ActionResult<object> AddDemoWatchlist([FromBody] DemoWatchlistRequest request)
    {
        var hash = _identityHasher.Hash(request.DocumentNumber);
        _repository.AddDemoWatchlist(hash);
        _auditLogger.Log(
            User.Identity?.Name ?? "Sistema",
            "Documento agregado a lista de personas sospechosas",
            $"Hash {hash[..8]}... marcado para prueba.");

        return Ok(new
        {
            maskedHash = $"{hash[..8]}...{hash[^4..]}",
            message = "Documento marcado como persona sospechosa."
        });
    }
}
