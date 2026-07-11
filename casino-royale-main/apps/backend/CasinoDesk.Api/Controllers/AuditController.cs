using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("audit")]
[Authorize(Policy = Policies.OfficerAccess)]
public sealed class AuditController : ControllerBase
{
    private readonly ICasinoDeskRepository _repository;

    public AuditController(ICasinoDeskRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public ActionResult<object> GetAll() => Ok(_repository.AuditTrail);
}
