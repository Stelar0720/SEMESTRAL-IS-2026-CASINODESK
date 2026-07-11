import { useMemo, useState } from "react";
import { roleCapabilities } from "../../app/roles";
import { useAppStore } from "../../app/store";

import { RiskBadge } from "../../components/RiskBadge";

const filters = ["Todas", "Criticas", "PEP", "Fraccionamiento", "Manuales"] as const;

export function AlertsPage() {
  const alerts = useAppStore((state) => state.alerts);
  const resolveAlert = useAppStore((state) => state.resolveAlert);
  const createRos = useAppStore((state) => state.createRos);
  const session = useAppStore((state) => state.session);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("Todas");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(alerts[0]?.id ?? null);
  const [narrative, setNarrative] = useState("");
  const [closureJustification, setClosureJustification] = useState(
    "Analisis completado sin elementos suficientes para ROS. Se mantiene trazabilidad documental."
  );
  const [actionMessage, setActionMessage] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setActionBusy(true);
    setActionMessage("");
    try {
      await action();
      setActionMessage(successMessage);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "No fue posible completar la accion.");
    } finally {
      setActionBusy(false);
    }
  };

  const canCreateRos = session ? roleCapabilities[session.role].canCreateRos : false;
  const canResolveAlert = session?.role === "Oficial";

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (activeFilter === "Criticas") return alert.severity === "CRITICA";
      if (activeFilter === "PEP") return alert.type === "PEP";
      if (activeFilter === "Fraccionamiento") return alert.type === "FRACCIONAMIENTO";
      if (activeFilter === "Manuales") return alert.source === "MANUAL";
      return true;
    });
  }, [activeFilter, alerts]);

  const selectedAlert = filteredAlerts.find((item) => item.id === selectedAlertId) ?? filteredAlerts[0] ?? null;

  return (
    <div className="section-stack">
      <section className="panel table-card">
        <div className="section-heading">
          <h2>Bandeja privada de alertas</h2>
          <p>Lista filtrable, detalle consolidado y acciones discretas de cierre o ROS.</p>
        </div>

        <div className="filter-row" style={{ marginTop: 18 }}>
          {filters.map((filter) => (
            <button
              key={filter}
              className={`chip ${activeFilter === filter ? "chip--active" : ""}`}
              onClick={() => setActiveFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid--sidebar" style={{ marginTop: 18 }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Riesgo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={selectedAlert?.id === alert.id ? "table__row--selected" : ""}
                    onClick={() => setSelectedAlertId(alert.id)}
                  >
                    <td>{alert.type}</td>
                    <td className="mono">{alert.clientHash}</td>
                    <td>${alert.amount.toLocaleString("en-US")}</td>
                    <td>
                      <RiskBadge risk={alert.risk} />
                    </td>
                    <td>{alert.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Detalle del caso</h3>
            </div>

            {selectedAlert ? (
              <div className="section-stack">
                <div className="receipt">
                  <div className="receipt__row">
                    <span>Alerta</span>
                    <span>{selectedAlert.title}</span>
                  </div>
                  <div className="receipt__row">
                    <span>Hash cliente</span>
                    <span className="mono">{selectedAlert.clientHash}</span>
                  </div>
                  <div className="receipt__row">
                    <span>Origen</span>
                    <span>{selectedAlert.source ?? "AUTOMATICA"}</span>
                  </div>
                  <div className="receipt__row">
                    <span>Asignada a</span>
                    <span>{selectedAlert.assignedRole ?? "Oficial"}</span>
                  </div>
                </div>

                <article className="list-item">
                  <strong>Cronologia</strong>
                  <p className="muted">{new Date(selectedAlert.createdAt).toLocaleString("es-PA")}</p>
                  <p>{selectedAlert.description}</p>
                  {selectedAlert.resolutionNote ? <p className="muted">Cierre: {selectedAlert.resolutionNote}</p> : null}
                </article>

                {canResolveAlert ? <><div className="field">
                  <label htmlFor="alert-justification">Justificacion de cierre sin ROS</label>
                  <textarea id="alert-justification" value={closureJustification} onChange={(event) => setClosureJustification(event.target.value)} />
                </div>
                <button
                  className="button button-secondary"
                  disabled={actionBusy || closureJustification.trim().length < 10}
                  onClick={() => runAction(() => resolveAlert(selectedAlert.id, closureJustification), "Alerta cerrada y auditada correctamente.")}
                  type="button"
                >
                  Cerrar alerta con justificacion
                </button></> : null}

                <div className="field">
                  <label htmlFor="alert-narrative">Narrativa ROS</label>
                  <textarea
                    id="alert-narrative"
                    value={narrative}
                    onChange={(event) => setNarrative(event.target.value)}
                    placeholder="Describe el patron detectado, el origen del riesgo y el criterio de reporte."
                  />
                </div>
                <button
                  className="button button-primary"
                  disabled={!canCreateRos || actionBusy}
                  onClick={() =>
                    runAction(() => createRos(
                      selectedAlert.id,
                      narrative || `ROS confidencial basado en ${selectedAlert.type} y session precargada del cliente.`
                    ), "Borrador ROS creado correctamente.")
                  }
                  type="button"
                >
                  {canCreateRos ? "Crear ROS confidencial" : "Solo el oficial puede emitir ROS"}
                </button>
                {actionMessage ? <p className="form-hint" role="status" aria-live="polite">{actionMessage}</p> : null}
              </div>
            ) : (
              <p className="muted">No hay alertas para el filtro seleccionado.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
