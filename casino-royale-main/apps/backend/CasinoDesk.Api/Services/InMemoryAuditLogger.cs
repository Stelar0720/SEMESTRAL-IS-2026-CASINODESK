namespace CasinoDesk.Api.Services;

public sealed class InMemoryAuditLogger : IAuditLogger
{
    private readonly ICasinoDeskRepository _repository;

    public InMemoryAuditLogger(ICasinoDeskRepository repository)
    {
        _repository = repository;
    }

    public void Log(string actor, string @event, string result)
    {
        _repository.AddAudit(new CasinoDesk.Api.Domain.AuditEntry
        {
            Actor = actor,
            Event = @event,
            Result = result,
            CreatedAt = DateTimeOffset.UtcNow
        });
    }
}
