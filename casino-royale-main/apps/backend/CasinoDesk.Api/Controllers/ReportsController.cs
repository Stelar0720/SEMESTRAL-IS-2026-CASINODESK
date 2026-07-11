using System.Net;
using System.Text;
using CasinoDesk.Api.Configuration;
using CasinoDesk.Api.Domain;
using CasinoDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasinoDesk.Api.Controllers;

[ApiController]
[Route("reports")]
[Authorize(Policy = Policies.OfficerAccess)]
public sealed class ReportsController : ControllerBase
{
    private readonly ICasinoDeskRepository _repository;
    private readonly IProspectRepository _prospects;

    public ReportsController(ICasinoDeskRepository repository, IProspectRepository prospects)
    {
        _repository = repository;
        _prospects = prospects;
    }

    [HttpGet("summary")]
    public ActionResult<object> Summary([FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to)
    {
        var start = from ?? DateTimeOffset.UtcNow.AddDays(-30);
        var end = to ?? DateTimeOffset.UtcNow;
        var transactions = _repository.Transactions.Where(item => item.CreatedAt >= start && item.CreatedAt <= end).ToArray();
        var alerts = _repository.Alerts.Where(item => item.CreatedAt >= start && item.CreatedAt <= end).ToArray();
        return Ok(new
        {
            generatedAt = DateTimeOffset.UtcNow,
            period = new { from = start, to = end },
            prospects = _prospects.GetProspects().Count,
            transactions = transactions.Length,
            totalAmount = transactions.Sum(item => item.Amount),
            blockedTransactions = transactions.Count(item => item.Status == TransactionStatus.Bloqueada),
            openAlerts = alerts.Count(item => item.Status != "CERRADA"),
            criticalAlerts = alerts.Count(item => item.Severity == "CRITICA"),
            pendingRte = _repository.Rtes.Count(item => item.Status != "ENVIADO"),
            sentRte = _repository.Rtes.Count(item => item.Status == "ENVIADO"),
            draftRos = _repository.Ros.Count(item => item.Status == "BORRADOR"),
            sentRos = _repository.Ros.Count(item => item.Status == "ENVIADO"),
            riskDistribution = _prospects.GetProspects().GroupBy(item => item.RiskLevel.ToString())
                .ToDictionary(group => group.Key, group => group.Count())
        });
    }

    [HttpGet("prospects/{id:guid}")]
    public IActionResult Prospect(Guid id, [FromQuery] string format = "html")
    {
        var prospect = _prospects.GetProspect(id) ?? throw new KeyNotFoundException("Prospecto no encontrado.");
        var evidence = _prospects.GetEvidence(id);
        var transactions = _repository.Transactions.Where(item => item.ClientHash == prospect.DocumentHash).ToArray();
        var alerts = _repository.Alerts.Where(item => item.ClientHash == prospect.DocumentHash).ToArray();
        var fields = new List<(string, string)>
        {
            ("Reporte", "Expediente de debida diligencia"), ("Prospecto", $"{prospect.FirstNames} {prospect.LastNames}"),
            ("Documento", prospect.DocumentNumberMasked), ("Tipo de documento", prospect.DocumentType),
            ("Nacionalidad", prospect.Nationality), ("Residencia", prospect.ResidenceCountry),
            ("Nacimiento", prospect.BirthDate?.ToString("yyyy-MM-dd") ?? "No indicado"),
            ("Ocupacion", prospect.Occupation), ("Empleador", prospect.Employer),
            ("Actividad economica", prospect.EconomicActivity), ("Ingresos", prospect.MonthlyIncomeRange),
            ("Origen de fondos", prospect.SourceOfFunds), ("Condicion PEP", prospect.IsPep ? prospect.PepRelationship : "NO"),
            ("Riesgo", $"{prospect.RiskLevel} ({prospect.RiskScore}/100)"), ("Estado", prospect.Status),
            ("Transacciones relacionadas", transactions.Length.ToString()), ("Monto acumulado", transactions.Sum(item => item.Amount).ToString("0.00")),
            ("Alertas", alerts.Length.ToString()), ("Evidencias", evidence.Count.ToString()),
            ("Fuentes consultadas", string.Join("; ", evidence.Select(item => $"{item.Source} ({(item.IsSimulated ? "SIMULADA" : "REAL")})")))
        };
        return Render(format, $"KYC-{prospect.Id}", "Expediente KYC", fields);
    }

    [HttpGet("prospects/by-hash/{documentHash}")]
    public IActionResult ProspectByHash(string documentHash, [FromQuery] string format = "html")
    {
        var prospect = _prospects.FindProspectByDocumentHash(documentHash)
            ?? throw new KeyNotFoundException("Prospecto no encontrado.");
        return Prospect(prospect.Id, format);
    }

    [HttpGet("rte/{id:guid}")]
    public IActionResult Rte(Guid id, [FromQuery] string format = "html")
    {
        var rte = _repository.Rtes.FirstOrDefault(item => item.Id == id) ?? throw new KeyNotFoundException("RTE no encontrado.");
        var fields = new List<(string, string)>
        {
            ("Reporte", "Reporte de transaccion en efectivo"), ("Folio", rte.Folio),
            ("Cliente hash", rte.ClientHash), ("Monto total", rte.TotalAmount.ToString("0.00")),
            ("Origen de fondos", rte.OriginOfFunds), ("Firmado por cliente", rte.SignedByClient ? "SI" : "NO"),
            ("Fecha de firma", rte.SignedAt?.ToString("O") ?? "Pendiente"), ("Estado", rte.Status),
            ("Aprobado por", rte.ApprovedBy), ("Fecha de aprobacion", rte.ApprovedAt?.ToString("O") ?? "Pendiente"),
            ("Transacciones", string.Join("; ", rte.TransactionIds)), ("Fecha de envio", rte.SentAt?.ToString("O") ?? "Pendiente"),
            ("Acuse UAF demo", rte.SubmissionReference)
        };
        return Render(format, rte.Folio.Length > 0 ? rte.Folio : $"RTE-{id}", "Reporte RTE", fields);
    }

    [HttpGet("ros/{id:guid}")]
    public IActionResult Ros(Guid id, [FromQuery] string format = "html")
    {
        var ros = _repository.Ros.FirstOrDefault(item => item.Id == id) ?? throw new KeyNotFoundException("ROS no encontrado.");
        var alert = _repository.Alerts.FirstOrDefault(item => item.Id == ros.AlertId);
        var transactions = alert is null
            ? Array.Empty<TransactionRecord>()
            : _repository.Transactions.Where(item => item.ClientHash == alert.ClientHash).ToArray();
        var fields = new List<(string, string)>
        {
            ("Reporte", "Reporte de operacion sospechosa"), ("Identificador", ros.Id.ToString()),
            ("Alerta origen", alert?.Title ?? ros.AlertId.ToString()), ("Tipo de alerta", alert?.Type.ToString() ?? "No disponible"),
            ("Cliente hash", alert?.ClientHash ?? "No disponible"), ("Monto de alerta", alert?.Amount.ToString("0.00") ?? "0.00"),
            ("Cronologia", alert?.Description ?? "No disponible"),
            ("Transacciones relacionadas", string.Join("; ", transactions.Select(item => $"{item.CreatedAt:O} {item.Type} {item.Amount:0.00}"))),
            ("Narrativa", ros.Narrative), ("Firmado por", ros.SignedBy), ("Estado", ros.Status),
            ("Fecha de creacion", ros.CreatedAt.ToString("O")), ("Fecha de envio", ros.SentAt?.ToString("O") ?? "Pendiente"),
            ("Acuse UAF demo", ros.SubmissionReference)
        };
        return Render(format, $"ROS-{ros.Id}", "Reporte ROS confidencial", fields);
    }

    private IActionResult Render(string format, string fileName, string title, IReadOnlyCollection<(string Label, string Value)> fields)
    {
        if (string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            var csv = new StringBuilder("Campo,Valor\r\n");
            foreach (var field in fields) csv.Append(Csv(field.Label)).Append(',').Append(Csv(field.Value)).Append("\r\n");
            return File(Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray(), "text/csv", $"{fileName}.csv");
        }
        if (!string.Equals(format, "html", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Formato permitido: html o csv.");

        var rows = string.Join("", fields.Select(field => $"<tr><th>{WebUtility.HtmlEncode(field.Label)}</th><td>{WebUtility.HtmlEncode(field.Value)}</td></tr>"));
        var html = $$"""
            <!doctype html><html lang="es"><head><meta charset="utf-8"><title>{{WebUtility.HtmlEncode(title)}}</title>
            <style>body{font-family:Arial,sans-serif;margin:36px;color:#202124}h1{color:#8a6500}.notice{padding:12px;background:#fff4cc;border:1px solid #d4af37}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccc;padding:9px;text-align:left;vertical-align:top}th{width:30%;background:#f5f5f0}@media print{button{display:none} }</style></head>
            <body><h1>{{WebUtility.HtmlEncode(title)}}</h1><p class="notice">Documento generado por CasinoDesk. Integraciones gubernamentales y envio UAF simulados para demostracion academica.</p>
            <button onclick="window.print()">Imprimir / Guardar como PDF</button><table>{{rows}}</table><p>Generado: {{DateTimeOffset.UtcNow:O}}</p></body></html>
            """;
        return Content(html, "text/html", Encoding.UTF8);
    }

    private static string Csv(string value) => $"\"{value.Replace("\"", "\"\"")}\"";
}
