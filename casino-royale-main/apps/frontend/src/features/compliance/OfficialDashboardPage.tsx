import { Activity, FileWarning, ScrollText, ShieldAlert } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildClientCaseSummaries, useAppStore } from "../../app/store";
import { roleCapabilities } from "../../app/roles";
import { RiskBadge } from "../../components/RiskBadge";
import { useEffect, useState } from "react";
import { getComplianceSummary, getIntegrationStatus, openComplianceReport, type IntegrationStatus } from "../../app/api";

export function OfficialDashboardPage() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [reportSummary, setReportSummary] = useState<{ sentRte: number; sentRos: number; blockedTransactions: number } | null>(null);
  const alerts = useAppStore((state) => state.alerts);
  const rtes = useAppStore((state) => state.rtes);
  const ros = useAppStore((state) => state.ros);
  const transactions = useAppStore((state) => state.transactions);
  const approveRte = useAppStore((state) => state.approveRte);
  const submitRte = useAppStore((state) => state.submitRte);
  const submitRos = useAppStore((state) => state.submitRos);
  const session = useAppStore((state) => state.session);
  const canReviewRte = session ? roleCapabilities[session.role].canReviewRte : false;
  const clientCases = buildClientCaseSummaries(transactions, alerts).sort((a, b) => b.riskScore - a.riskScore);

  useEffect(() => {
    Promise.all([getIntegrationStatus(), getComplianceSummary()])
      .then(([status, summary]) => {
        setIntegrations(status);
        setReportSummary(summary);
      })
      .catch(() => {
        setIntegrations([]);
        setReportSummary(null);
      });
  }, []);

  const activityData = [
    { hour: "12:00", alerts: 1, transactions: 3 },
    { hour: "13:00", alerts: 3, transactions: 5 },
    { hour: "14:00", alerts: 2, transactions: 6 },
    { hour: "15:00", alerts: alerts.filter((item) => item.status !== "CERRADA").length, transactions: transactions.length }
  ];

  return (
    <div className="section-stack">
      <section className="role-hero role-hero--official">
        <div>
          <span className="eyebrow">Panel privado del oficial</span>
          <h1>Alertas, PEP, RTE y ROS fuera de la vista del cliente</h1>
          <p>
            Esta consola concentra aprobaciones, cierres justificados, narrativa ROS y los casos que el sistema AML o la sala te
            escalan.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Alertas abiertas</span>
            <ShieldAlert size={18} />
          </div>
          <div className="stat-value">{alerts.filter((item) => item.status !== "CERRADA").length}</div>
          <p className="muted">Priorizadas por AML rojo, PEP, timeout y fraccionamiento.</p>
        </article>

        <article className="stat-card panel">
          <div className="stat-header">
            <span>RTE pendientes</span>
            <FileWarning size={18} />
          </div>
          <div className="stat-value">{rtes.filter((item) => !item.approvedByOfficer).length}</div>
          <p className="muted">Ningun RTE debe transmitirse sin esta aprobación.</p>
        </article>

        <article className="stat-card panel">
          <div className="stat-header">
            <span>ROS generados</span>
            <ScrollText size={18} />
          </div>
          <div className="stat-value">{ros.length}</div>
          <p className="muted">Reporte confidencial con narrativa documentada e invisible al cliente.</p>
        </article>

        <article className="stat-card panel">
          <div className="stat-header">
            <span>Salud de integraciones</span>
            <Activity size={18} />
          </div>
          <div className="stat-value">{integrations.length ? `${integrations.filter((item) => item.status === "OPERATIVA").length}/${integrations.length}` : "--"}</div>
          <p className="muted">{integrations.filter((item) => item.simulated).length} fuentes simuladas, identificadas como demo.</p>
        </article>
      </section>

      <section className="two-column">
        <article className="panel table-card">
          <div className="section-heading">
            <h2>Actividad de riesgo</h2>
            <p>Ventanas de carga, alertas y casos que ameritan revisión inmediata.</p>
          </div>
          <div style={{ width: "100%", height: 280, marginTop: 18 }}>
            <ResponsiveContainer>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="alertGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.12)" />
                <XAxis dataKey="hour" stroke="#a89b77" />
                <YAxis stroke="#a89b77" />
                <Tooltip />
                <Area type="monotone" dataKey="alerts" stroke="#d4af37" fill="url(#alertGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel table-card">
          <div className="section-heading">
            <h2>Bandeja RTE</h2>
            <p>Validación previa al envío regulatorio.</p>
          </div>

          <div className="list" style={{ marginTop: 18 }}>
            {rtes.map((item) => (
              <div className="list-item" key={item.id}>
                <div className="toolbar">
                  <strong>{item.folio ?? item.id}</strong>
                  <span className="mono">${item.totalAmount.toLocaleString("en-US")}</span>
                </div>
                <p className="muted mono">{item.clientHash}</p>
                <p>{item.originOfFunds}</p>
                <div className="toolbar">
                  <button className="button button-secondary" onClick={() => openComplianceReport(`/reports/rte/${item.id}`, "html", item.folio ?? item.id)} type="button">Vista imprimible</button>
                  <button className="button button-secondary" onClick={() => openComplianceReport(`/reports/rte/${item.id}`, "csv", item.folio ?? item.id)} type="button">Exportar CSV</button>
                </div>
                {canReviewRte ? (
                  <div className="toolbar">
                    <button className="button button-primary" onClick={() => approveRte(item.id)} disabled={item.approvedByOfficer || !item.signedByClient}>
                      {!item.signedByClient ? "Pendiente de firma" : item.approvedByOfficer ? "Aprobado" : "Aprobar RTE"}
                    </button>
                    {item.approvedByOfficer && item.status !== "ENVIADO" ? <button className="button button-secondary" onClick={() => submitRte(item.id)} type="button">Enviar a UAF demo</button> : null}
                  </div>
                ) : (
                  <p className="muted">Consulta solamente. La aprobacion corresponde al oficial.</p>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel table-card">
        <div className="section-heading"><h2>Reportes ROS</h2><p>Borradores y envios confidenciales a la UAF simulada.</p></div>
        <div className="list" style={{ marginTop: 18 }}>
          {ros.map((item) => (
            <article className="list-item" key={item.id}>
              <div className="toolbar"><strong>{item.id}</strong><span className="badge badge--yellow">{item.status ?? "BORRADOR"}</span></div>
              <p>{item.narrative}</p>
              {item.submissionReference ? <p className="mono muted">Acuse: {item.submissionReference}</p> : null}
              <div className="toolbar">
                <button className="button button-secondary" onClick={() => openComplianceReport(`/reports/ros/${item.id}`, "html", `ROS-${item.id}`)} type="button">Vista imprimible</button>
                <button className="button button-secondary" onClick={() => openComplianceReport(`/reports/ros/${item.id}`, "csv", `ROS-${item.id}`)} type="button">Exportar CSV</button>
              </div>
              {item.status !== "ENVIADO" && canReviewRte ? <button className="button button-primary" onClick={() => submitRos(item.id)} type="button">Enviar ROS a UAF demo</button> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel table-card">
        <div className="section-heading"><h2>Integraciones y fuentes</h2><p>Cada fuente indica si es publica referencial o una simulacion academica.</p></div>
        <div className="tri-grid" style={{ marginTop: 18 }}>
          {integrations.map((item) => <article className="list-item" key={item.name}><div className="toolbar"><strong>{item.name}</strong><span className={item.simulated ? "badge badge--yellow" : "badge badge--green"}>{item.simulated ? "SIMULADA" : "PUBLICA"}</span></div><p>{item.detail}</p><p className="muted">Estado: {item.status}</p></article>)}
        </div>
        {reportSummary ? <p className="muted">Resumen 30 dias: {reportSummary.sentRte} RTE enviados · {reportSummary.sentRos} ROS enviados · {reportSummary.blockedTransactions} operaciones bloqueadas.</p> : null}
      </section>

      <section className="panel table-card">
        <div className="section-heading">
          <h2>Casos consolidados del cliente</h2>
          <p>Historial transaccional y alertas en una sola vista, como pide el PDF.</p>
        </div>
        <div className="tri-grid" style={{ marginTop: 18 }}>
          {clientCases.slice(0, 6).map((client) => (
            <article className="list-item" key={client.clientHash}>
              <div className="toolbar">
                <strong>{client.clientName}</strong>
                <RiskBadge risk={client.riskLevel} />
              </div>
              <p className="mono muted">{client.clientHash}</p>
              <p>Efectivo 24h: ${client.dailyCashTotal.toLocaleString("en-US")}</p>
              <p className="muted">{client.transactions.length} transacciones · {client.alerts.length} alertas</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
