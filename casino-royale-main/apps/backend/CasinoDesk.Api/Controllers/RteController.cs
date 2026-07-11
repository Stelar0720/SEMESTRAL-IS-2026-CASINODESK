using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("rte")]
[Authorize]
public sealed class RteController : ControllerBase
{
    private readonly IRteService _rteService;

    public RteController(IRteService rteService)
    {
        _rteService = rteService;
    }

    [HttpGet]
    [Authorize(Policy = Policies.OfficerAccess)]
    public ActionResult<object> GetAll() => Ok(_rteService.GetAll());

    [HttpPost]
    [Authorize(Policy = Policies.OperatorAccess)]
    public ActionResult<object> Create([FromBody] RteCreateRequest request)
        => Ok(_rteService.Create(request, User.Identity?.Name ?? "Sistema"));

    [HttpPatch("{id:guid}/sign")]
    [Authorize(Policy = Policies.OperatorAccess)]
    public ActionResult Sign(Guid id, [FromBody] RteSignatureRequest request)
    {
        if (!request.SignedByClient) throw new ArgumentException("Debe confirmar la firma del cliente.");
        _rteService.Sign(id, User.Identity?.Name ?? "Operador");
        return NoContent();
    }

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = Policies.OfficerAction)]
    public ActionResult Approve(Guid id)
    {
        _rteService.Approve(id, User.Identity?.Name ?? "Oficial");
        return NoContent();
    }

    [HttpPost("{id:guid}/submit")]
    [Authorize(Policy = Policies.OfficerAction)]
    public ActionResult<object> Submit(Guid id)
        => Ok(_rteService.Submit(id, User.Identity?.Name ?? "Oficial"));
}
