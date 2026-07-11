import { BellRing, CircleDollarSign, Eye, ShieldPlus } from "lucide-react";
import { buildClientCaseSummaries, useAppStore } from "../../app/store";
import { useAppChrome } from "../../components/AppShell";

export function SupervisorDashboardPage() {
  const { openModal } = useAppChrome();
  const alerts = useAppStore((state) => state.alerts);
  const transactions = useAppStore((state) => state.transactions);
  const clientCases = buildClientCaseSummaries(transactions, alerts).sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);
  const manualAlerts = alerts.filter((item) => item.source === "MANUAL").length;

  return (
    <div className="section-stack">
      <section className="role-hero role-hero--supervisor">
        <div>
          <span className="eyebrow">Supervisor de mesas · monitoreo discreto</span>
          <h1>Vigilancia de sala y escalamiento interno</h1>
          <p>
            Tu función es observar comportamiento sospechoso, levantar alertas manuales y escalar casos al oficial. No apruebas
            PEP ni emites ROS finales.
          </p>
        </div>
      </section>

      <section className="action-buttons">
        <button className="action-btn" onClick={() => openModal("buyin")} type="button">
          <CircleDollarSign size={28} />
          <span>
            <strong className="action-btn__title">Buy-in en mesa</strong>
            <span className="action-btn__shortcut">Captura KYC y screening del prospecto</span>
          </span>
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Alertas abiertas</span>
            <BellRing size={18} />
          </div>
          <div className="stat-value">{alerts.filter((item) => item.status !== "CERRADA").length}</div>
          <p className="muted">Incluye comportamiento, structuring y alertas discretas de sala.</p>
        </article>
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Alertas manuales</span>
            <ShieldPlus size={18} />
          </div>
          <div className="stat-value">{manualAlerts}</div>
          <p className="muted">Se registran sin mostrar ninguna señal al cliente.</p>
        </article>
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Casos visibles</span>
            <Eye size={18} />
          </div>
          <div className="stat-value">{clientCases.length}</div>
          <p className="muted">Prioridad por score interno y coincidencias AML/CFT.</p>
        </article>
      </section>

      <section className="panel table-card">
        <div className="section-heading">
          <h2>Casos que debes observar</h2>
          <p>Vista de sala para spotting de patrones antes de escalar al oficial.</p>
        </div>

        <div className="tri-grid" style={{ marginTop: 18 }}>
          {clientCases.map((client) => (
            <article className="list-item" key={client.clientHash}>
              <div className="toolbar">
                <strong>{client.clientName}</strong>
                <span className="badge badge--yellow">Score {Math.round(client.riskScore)}</span>
              </div>
              <p className="mono muted">{client.clientHash}</p>
              <p>Efectivo 24h: ${client.dailyCashTotal.toLocaleString("en-US")}</p>
              <p className="muted">{client.alerts.length} alertas asociadas · {client.transactions.length} movimientos</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
