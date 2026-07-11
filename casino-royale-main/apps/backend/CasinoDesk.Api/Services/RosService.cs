using CasinoDesk.Api.Contracts;
using CasinoDesk.Api.Domain;

namespace CasinoDesk.Api.Services;

public sealed class RosService : IRosService
{
    private readonly ICasinoDeskRepository _repository;
    private readonly IAuditLogger _auditLogger;

    public RosService(ICasinoDeskRepository repository, IAuditLogger auditLogger)
    {
        _repository = repository;
        _auditLogger = auditLogger;
    }

    public IReadOnlyCollection<RosRecord> GetAll() => _repository.Ros;

    public RosRecord Create(RosCreateRequest request, string actor)
    {
        if (string.IsNullOrWhiteSpace(request.Narrative) || request.Narrative.Trim().Length < 20)
            throw new ArgumentException("La narrativa del ROS debe tener al menos 20 caracteres.");
        var alert = _repository.Alerts.FirstOrDefault(item => item.Id == request.AlertId)
            ?? throw new KeyNotFoundException("Alerta no encontrada.");
        if (_repository.Ros.Any(item => item.AlertId == request.AlertId))
            throw new InvalidOperationException("Ya existe un ROS para esta alerta.");

        var ros = new RosRecord
        {
            AlertId = request.AlertId,
            Narrative = request.Narrative,
            SignedBy = actor
        };
        _repository.AddRos(ros);
        if (alert.Status == "ABIERTA")
            _repository.UpdateAlert(alert.Id, "EN_REVISION", "ROS en preparacion", actor);
        _auditLogger.Log(actor, "Borrador ROS creado", ros.Id.ToString());
        return ros;
    }

    public RosRecord Submit(Guid id, string actor)
    {
        var ros = _repository.Ros.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("ROS no encontrado.");
        if (ros.Status == "ENVIADO") throw new InvalidOperationException("El ROS ya fue enviado.");
        ros.Status = "ENVIADO";
        ros.SentAt = DateTimeOffset.UtcNow;
        ros.SubmissionReference = $"UAF-DEMO-ROS-{DateTime.UtcNow:yyyyMMdd}-{ros.Id.ToString("N")[..8].ToUpperInvariant()}";
        _repository.UpdateRos(ros);
        _repository.UpdateAlert(ros.AlertId, "CERRADA", $"ROS enviado: {ros.SubmissionReference}", actor);
        _auditLogger.Log(actor, "ROS enviado a UAF simulada", ros.SubmissionReference);
        return ros;
    }
}
