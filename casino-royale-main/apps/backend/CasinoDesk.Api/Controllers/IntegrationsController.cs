using CasinoDesk.Api.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("integrations")]
[Authorize(Policy = Policies.OfficerAccess)]
public sealed class IntegrationsController : ControllerBase
{
    [HttpGet("status")]
    public ActionResult<object> GetStatus() => Ok(new[]
    {
        Source("ONU - Lista consolidada", "PUBLICA_REFERENCIAL", false, "Lista publica disponible para futura sincronizacion."),
        Source("OFAC SDN", "PUBLICA_REFERENCIAL", false, "Lista publica disponible para futura sincronizacion."),
        Source("PEP Panama", "SIMULADA", true, "Catalogo SQLite con personas ficticias para flujo academico."),
        Source("Interpol", "SIMULADA", true, "Sin acceso institucional; respuestas locales controladas."),
        Source("Tribunal Electoral", "SIMULADA", true, "Verificacion documental ficticia para demostracion."),
        Source("UAF en Linea", "SIMULADA", true, "Genera acuses locales RTE/ROS sin transmitir datos reales.")
    });

    private static object Source(string name, string mode, bool simulated, string detail) => new
    {
        name, mode, simulated, status = "OPERATIVA", detail, checkedAt = DateTimeOffset.UtcNow
    };
}
