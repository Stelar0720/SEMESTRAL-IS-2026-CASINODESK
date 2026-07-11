using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("alerts")]
[Authorize]
public sealed class AlertsController : ControllerBase
{
    private readonly ICasinoDeskRepository _repository;
    private readonly IAuditLogger _auditLogger;

    public AlertsController(ICasinoDeskRepository repository, IAuditLogger auditLogger)
    {
        _repository = repository;
        _auditLogger = auditLogger;
    }

    [HttpGet]
    [Authorize(Policy = Policies.OfficerAccess)]
    public ActionResult<object> GetAll() => Ok(_repository.Alerts);

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = Policies.OfficerAction)]
    public ActionResult Patch(Guid id, [FromBody] AlertPatchRequest request)
    {
      if (request.Status is not ("ABIERTA" or "EN_REVISION" or "CERRADA"))
          throw new ArgumentException("Estado de alerta inválido.");
      if (request.Status == "CERRADA" && (request.ResolutionNote?.Trim().Length ?? 0) < 10)
          throw new ArgumentException("El cierre de una alerta requiere una justificacion de al menos 10 caracteres.");
      _repository.UpdateAlert(id, request.Status, request.ResolutionNote, User.Identity?.Name ?? "Oficial");
      _auditLogger.Log(User.Identity?.Name ?? "Oficial", $"Alerta {request.Status}", request.ResolutionNote ?? id.ToString());
      return NoContent();
    }

    [HttpPost("manual")]
    [Authorize(Policy = Policies.OperatorAccess)]
    public ActionResult<AlertRecord> CreateManual([FromBody] ManualAlertRequest request)
    {
        var alert = new AlertRecord
        {
            Type = AlertType.Manual,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            RiskLevel = RiskLevel.Amarillo,
            Severity = "ALTA",
            ClientHash = string.IsNullOrWhiteSpace(request.ClientHash) ? "sin-hash" : request.ClientHash.Trim(),
            Amount = request.Amount
        };
        _repository.AddAlert(alert);
        _auditLogger.Log(User.Identity?.Name ?? "Supervisor", "Alerta manual creada", alert.Title);
        return Ok(alert);
    }
}
