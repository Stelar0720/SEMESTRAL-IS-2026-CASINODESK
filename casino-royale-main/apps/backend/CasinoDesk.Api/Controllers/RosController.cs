using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("ros")]
[Authorize(Policy = Policies.RosAccess)]
public sealed class RosController : ControllerBase
{
    private readonly IRosService _rosService;

    public RosController(IRosService rosService)
    {
        _rosService = rosService;
    }

    [HttpGet]
    public ActionResult<object> GetAll() => Ok(_rosService.GetAll());

    [HttpPost]
    [Authorize(Policy = Policies.RosCreate)]
    public ActionResult<object> Create([FromBody] RosCreateRequest request)
        => Ok(_rosService.Create(request, User.Identity?.Name ?? "Oficial"));

    [HttpPost("{id:guid}/submit")]
    [Authorize(Policy = Policies.RosCreate)]
    public ActionResult<object> Submit(Guid id)
        => Ok(_rosService.Submit(id, User.Identity?.Name ?? "Oficial"));
}
