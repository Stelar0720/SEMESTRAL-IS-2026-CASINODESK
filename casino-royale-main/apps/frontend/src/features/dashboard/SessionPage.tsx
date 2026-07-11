import { roleCapabilities } from "../../app/roles";
import { buildClientCaseSummaries, useAppStore } from "../../app/store";
import { RiskBadge } from "../../components/RiskBadge";
import { openComplianceReport } from "../../app/api";

export function SessionPage() {
  const transactions = useAppStore((state) => state.transactions);
  const alerts = useAppStore((state) => state.alerts);
  const session = useAppStore((state) => state.session);
  const groupedByClient = buildClientCaseSummaries(transactions, alerts).sort((a, b) => b.riskScore - a.riskScore);
  const canSeePrivate = session ? roleCapabilities[session.role].canAccessPrivateCompliance : false;

  return (
    <div className="section-stack">
      <section className="panel table-card">
        <div className="section-heading">
          <h2>Sesion consolidada del cliente</h2>
          <p>
            {canSeePrivate
              ? "Vista unificada de transacciones, alertas y score de riesgo para investigacion."
              : "Vista operativa de acumulados y expediente para seguimiento de caja o mesa."}
          </p>
        </div>

        <div className="tri-grid" style={{ marginTop: 18 }}>
          {groupedByClient.map((client) => (
            <article key={client.clientHash} className="list-item">
              <div className="toolbar">
                <strong>{client.clientName}</strong>
                <RiskBadge risk={client.riskLevel} />
              </div>
              <p className="mono muted">{client.clientHash}</p>
              <p>Efectivo 24h: ${client.dailyCashTotal.toLocaleString("en-US")}</p>
              <p>Efectivo 7d: ${client.weeklyCashTotal.toLocaleString("en-US")}</p>
              <p className="muted">{client.transactions.length} transacciones vinculadas</p>
              {canSeePrivate ? <p className="muted">{client.alerts.length} alertas · score {Math.round(client.riskScore)}</p> : null}
              {canSeePrivate ? <div className="toolbar">
                <button className="button button-secondary" onClick={() => openComplianceReport(`/reports/prospects/by-hash/${client.clientHash}`, "html", `KYC-${client.clientHash}`)} type="button">Expediente imprimible</button>
                <button className="button button-secondary" onClick={() => openComplianceReport(`/reports/prospects/by-hash/${client.clientHash}`, "csv", `KYC-${client.clientHash}`)} type="button">Exportar CSV</button>
              </div> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
