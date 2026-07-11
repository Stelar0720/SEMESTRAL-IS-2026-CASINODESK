using CasinoDesk.Api.Domain;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("transactions")]
[Authorize]
public sealed class TransactionsController : ControllerBase
{
    private readonly ICasinoDeskRepository _repository;

    public TransactionsController(ICasinoDeskRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public ActionResult<object> GetAll() => Ok(_repository.Transactions);
}
