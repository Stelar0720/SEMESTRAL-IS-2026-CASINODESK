using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("transactions")]
[Authorize]
public sealed class TransactionRegistrationController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionRegistrationController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpPost("buy-in")]
    [Authorize(Policy = Policies.OperatorAccess)]
    public async Task<ActionResult<TransactionResponse>> BuyIn([FromBody] TransactionRequest request, CancellationToken cancellationToken)
        => Ok(await _transactionService.RegisterAsync(TransactionType.BuyIn, request, User.Identity?.Name ?? "Sistema", cancellationToken));

    [HttpPost("cash-out")]
    [Authorize(Policy = Policies.OperatorAccess)]
    public async Task<ActionResult<TransactionResponse>> CashOut([FromBody] TransactionRequest request, CancellationToken cancellationToken)
        => Ok(await _transactionService.RegisterAsync(TransactionType.CashOut, request, User.Identity?.Name ?? "Sistema", cancellationToken));
}
