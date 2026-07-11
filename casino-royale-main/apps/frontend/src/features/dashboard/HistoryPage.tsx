import { useAppStore } from "../../app/store";

export function HistoryPage() {
  const audit = useAppStore((state) => state.audit);

  return (
    <div className="section-stack">
      <section className="panel table-card">
        <div className="section-heading">
          <h2>Trazabilidad y auditoria</h2>
          <p>Actor, fecha, hora, accion y resultado en un log no modificable de referencia operacional.</p>
        </div>

        <div className="list" style={{ marginTop: 18 }}>
          {audit.map((item) => (
            <article className="list-item" key={item.id}>
              <div className="toolbar">
                <strong>{item.event}</strong>
                <span className="mono muted">
                  {new Date(item.createdAt).toLocaleString("es-PA", {
                    dateStyle: "short",
                    timeStyle: "short"
                  })}
                </span>
              </div>
              <p style={{ marginBottom: 4 }}>{item.result}</p>
              <p className="muted" style={{ marginBottom: 0 }}>
                Actor: {item.actor}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
