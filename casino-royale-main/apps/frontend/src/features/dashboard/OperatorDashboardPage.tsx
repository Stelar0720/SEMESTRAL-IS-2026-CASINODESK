import { CircleDollarSign, CreditCard, ShieldAlert, Users } from "lucide-react";
import { useAppStore } from "../../app/store";
import { useAppChrome } from "../../components/AppShell";
import { RiskBadge } from "../../components/RiskBadge";
import type { RiskLevel } from "../../app/types";

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

const indicatorClasses: Record<RiskLevel, string> = {
  ROJO: "alert-panel__indicator--red",
  AMARILLO: "alert-panel__indicator--yellow",
  VERDE: "alert-panel__indicator--green"
};

function indicatorClass(risk: RiskLevel): string {
  return indicatorClasses[risk];
}

const textClasses: Record<RiskLevel, string> = {
  ROJO: "alert-panel__type text-danger",
  AMARILLO: "alert-panel__type text-warning",
  VERDE: "alert-panel__type text-success"
};

function textClass(risk: RiskLevel): string {
  return textClasses[risk];
}

export function OperatorDashboardPage() {
  const { openModal } = useAppChrome();
  const transactions = useAppStore((state) => state.transactions);
  const alerts = useAppStore((state) => state.alerts);
  const rtes = useAppStore((state) => state.rtes);

  const totalAmount = transactions.reduce((sum, item) => sum + item.amount, 0);
  const uniqueClients = new Set(transactions.map((item) => item.clientHash)).size;
  const criticalAlerts = alerts.filter((item) => item.severity === "CRITICA").length;
  const openRtes = rtes.filter((item) => !item.approvedByOfficer).length;
  const currentClient = transactions[0];
  const clientTotal = currentClient
    ? transactions
        .filter((item) => item.clientHash === currentClient.clientHash && item.paymentMethod === "EFECTIVO")
        .reduce((sum, item) => sum + item.amount, 0)
    : 0;

  return (
    <div className="section-stack">
      <section className="role-hero role-hero--cashier">
        <div>
          <span className="eyebrow">Cajero · UC-01 / UC-02 / UC-04</span>
          <h1>Caja operativa con KYC condicional y RTE obligatorio</h1>
          <p>
            Desde caja puedes ejecutar buy-in y cash-out, activar KYC desde $2,000 y detener la operación hasta completar el RTE
            cuando el efectivo llegue a $10,000.
          </p>
        </div>
      </section>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__header">
            <div className="stat-card__icon">
              <CircleDollarSign size={20} />
            </div>
            <span className="stat-card__label">Efectivo en caja</span>
          </div>
          <div className="stat-card__value text-gold">{formatCurrency(totalAmount)}</div>
          <div className="stat-card__subtext">Volumen del turno para buy-in y canjes regulados.</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__header">
            <div className="stat-card__icon">
              <CreditCard size={20} />
            </div>
            <span className="stat-card__label">Transacciones</span>
          </div>
          <div className="stat-card__value">{transactions.length}</div>
          <div className="stat-card__subtext">
            {transactions.filter((item) => item.type === "BUY_IN").length} buy-in ·{" "}
            {transactions.filter((item) => item.type === "CASH_OUT").length} cash-out
          </div>
        </div>

        <div className="stat-card stat-card--alert">
          <div className="stat-card__header">
            <div className="stat-card__icon stat-card__icon--warning">
              <ShieldAlert size={20} />
            </div>
            <span className="stat-card__label">Alertas del turno</span>
          </div>
          <div className="stat-card__value text-warning">{criticalAlerts}</div>
          <div className="stat-card__subtext">PEP, OFAC, timeout, comportamiento y structuring.</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__header">
            <div className="stat-card__icon">
              <Users size={20} />
            </div>
            <span className="stat-card__label">Clientes unicos</span>
          </div>
          <div className="stat-card__value">{uniqueClients}</div>
          <div className="stat-card__subtext">{openRtes} con RTE o revision pendiente.</div>
        </div>
      </div>

      <div className="semaphore">
        <div className="semaphore__indicator semaphore__indicator--green" />
        <div className="semaphore__label">Sistema AML activo</div>
        <div className="semaphore__status">Consultas paralelas y monitor de fraccionamiento en linea</div>
        <div className="semaphore__chips">
          <span className="badge badge--green">OFAC OK</span>
          <span className="badge badge--green">PEP OK</span>
          <span className="badge badge--green">RBAC OK</span>
        </div>
      </div>

      <div className="action-buttons">
        <button className="action-btn" onClick={() => openModal("buyin")} type="button">
          <div className="action-btn__icon">
            <CircleDollarSign size={24} />
          </div>
          <div className="action-btn__title">Buy-in</div>
          <div className="action-btn__shortcut">Compra de fichas · F1</div>
        </button>

        <button className="action-btn" onClick={() => openModal("cashout")} type="button">
          <div className="action-btn__icon">
            <CreditCard size={24} />
          </div>
          <div className="action-btn__title">Cash-out</div>
          <div className="action-btn__shortcut">Canje de tickets · F2</div>
        </button>
      </div>

      <div className="grid grid--sidebar">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Ultimas transacciones del turno</h3>
            <button className="btn btn--ghost" type="button">
              Ver todas
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Semaforo</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.createdAt).toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{item.type === "BUY_IN" ? "Buy-in" : "Cash-out"}</td>
                    <td>
                      {item.clientDisplayName}
                      <div className="table__hash">{item.clientHash}</div>
                    </td>
                    <td className="table__monto">{formatCurrency(item.amount)}</td>
                    <td>
                      <RiskBadge risk={item.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="alert-panel mb-xl">
            <div className="alert-panel__title">Acumulador de efectivo por cliente</div>
            <div className="receipt">
              <div className="receipt__row">
                <span>Hash</span>
                <span className="font-mono">{currentClient?.clientHash ?? "Sin cliente"}</span>
              </div>
              <div className="receipt__row">
                <span>{currentClient?.clientDisplayName ?? "Sin actividad"}</span>
              </div>
              <div className="accumulator">
                <div className="accumulator__header">
                  <span>Acumulado diario</span>
                  <span className="font-mono text-warning">{formatCurrency(clientTotal)} / $10,000</span>
                </div>
                <div className="progress">
                  <div className="progress__bar" style={{ width: `${Math.min((clientTotal / 10000) * 100, 100)}%` }} />
                </div>
                <div className="form-hint">{formatCurrency(Math.max(10000 - clientTotal, 0))} restantes para activar RTE.</div>
              </div>
            </div>
          </div>

          <div className="alert-panel">
            <div className="alert-panel__title">Alertas recientes</div>
            <ul className="alert-panel__list">
              {alerts.slice(0, 4).map((alert) => (
                <li className="alert-panel__item" key={alert.id}>
                  <div className={`alert-panel__indicator ${indicatorClass(alert.risk)}`} />
                  <div className="alert-panel__content">
                    <div className={textClass(alert.risk)}>
                      {alert.title}
                    </div>
                    <div className="alert-panel__detail">
                      {alert.clientHash} · {formatCurrency(alert.amount)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
