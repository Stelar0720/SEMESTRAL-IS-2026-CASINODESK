using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("clients")]
[Authorize(Policy = Policies.OfficerAccess)]
public sealed class ClientsController : ControllerBase
{
    private readonly ICasinoDeskRepository _repository;

    public ClientsController(ICasinoDeskRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("{id}/session")]
    public ActionResult<object> Session(string id)
    {
        var transactions = _repository.Transactions.Where(item => item.ClientHash == id).ToArray();
        var alerts = _repository.Alerts.Where(item => item.ClientHash == id).ToArray();
        return Ok(new { clientHash = id, transactions, alerts });
    }
}
