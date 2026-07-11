import { Activity, ShieldCheck, UserCog, Wallet } from "lucide-react";
import { buildClientCaseSummaries, useAppStore } from "../../app/store";

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

export function AdminOverviewPage() {
  const transactions = useAppStore((state) => state.transactions);
  const alerts = useAppStore((state) => state.alerts);
  const rtes = useAppStore((state) => state.rtes);
  const ros = useAppStore((state) => state.ros);
  const highRiskCases = buildClientCaseSummaries(transactions, alerts).filter((item) => item.riskScore >= 70);

  return (
    <div className="section-stack">
      <section className="role-hero role-hero--admin">
        <div>
          <span className="eyebrow">Administrador · soporte técnico</span>
          <h1>Soporte, configuración y observabilidad</h1>
          <p>
            Acceso de consulta para diagnosticar el sistema y administrar su configuración, sin ejecutar operaciones ni aprobar
            decisiones de otros roles.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Volumen total</span>
            <Wallet size={18} />
          </div>
          <div className="stat-value">{formatCurrency(transactions.reduce((sum, item) => sum + item.amount, 0))}</div>
          <p className="muted">Datos visibles para soporte y diagnóstico, sin capacidad operativa.</p>
        </article>
        <article className="stat-card panel">
          <div className="stat-header">
            <span>RTE / ROS</span>
            <ShieldCheck size={18} />
          </div>
          <div className="stat-value">{rtes.length} / {ros.length}</div>
          <p className="muted">Consulta de estado; aprobación y emisión reservadas al oficial.</p>
        </article>
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Separación RBAC</span>
            <UserCog size={18} />
          </div>
          <div className="stat-value">Activa</div>
          <p className="muted">Cada rol aterriza en un workspace distinto y con módulos restringidos.</p>
        </article>
        <article className="stat-card panel">
          <div className="stat-header">
            <span>Casos de alto riesgo</span>
            <Activity size={18} />
          </div>
          <div className="stat-value">{highRiskCases.length}</div>
          <p className="muted">Clientes que ya ameritan seguimiento prioritario.</p>
        </article>
      </section>
    </div>
  );
}
