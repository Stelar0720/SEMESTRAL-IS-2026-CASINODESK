import { roleCapabilities } from "../../app/roles";
import { useAppStore } from "../../app/store";

const accentPresets = ["#d4af37", "#0f9d8a", "#cc5f2f", "#2f6fed", "#b24bb7", "#111827"];

export function ProfilePage() {
  const session = useAppStore((state) => state.session);
  const backendAvailable = useAppStore((state) => state.backendAvailable);
  const transactions = useAppStore((state) => state.transactions);
  const alerts = useAppStore((state) => state.alerts);
  const uiPreferences = useAppStore((state) => state.uiPreferences);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setAccentColor = useAppStore((state) => state.setAccentColor);

  if (!session) return null;

  const capabilities = roleCapabilities[session.role];

  return (
    <div className="grid grid--sidebar">
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Mi perfil</h3>
        </div>

        <div className="profile-card">
          <div className="profile-card__avatar">{session.initials}</div>
          <div>
            <h2>{session.fullName}</h2>
            <p className="text-secondary">
              {session.role} · {session.station}
            </p>
          </div>
        </div>

        <div className="receipt">
          <div className="receipt__row">
            <span>Rol activo</span>
            <span>{session.role}</span>
          </div>
          <div className="receipt__row">
            <span>Estacion</span>
            <span>{session.station}</span>
          </div>
          <div className="receipt__row">
            <span>API conectada</span>
            <span className={backendAvailable ? "text-success" : "text-warning"}>{backendAvailable ? "Si" : "Modo demo"}</span>
          </div>
          <div className="receipt__row">
            <span>Token</span>
            <span className="font-mono">{session.accessToken ? "JWT activo" : "No disponible"}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="alert-panel mb-xl">
          <div className="alert-panel__title">Resumen de actividad</div>
          <ul className="alert-panel__list">
            <li className="alert-panel__item">
              <div className="alert-panel__content">
                <div className="alert-panel__type">Transacciones visibles</div>
                <div className="alert-panel__detail">{transactions.length} movimientos cargados en la sesión actual.</div>
              </div>
            </li>
            <li className="alert-panel__item">
              <div className="alert-panel__content">
                <div className="alert-panel__type">Alertas visibles</div>
                <div className="alert-panel__detail">{alerts.length} eventos AML o de monitoreo asociados a tu vista.</div>
              </div>
            </li>
          </ul>
        </div>

        <div className="card mb-xl">
          <div className="card__header">
            <h3 className="card__title">Apariencia</h3>
          </div>
          <div className="section-stack">
            <div className="field">
              <label htmlFor="theme-appearance">Tema de la aplicación</label>
              <div className="theme-toggle">
                <button
                  className={`chip ${uiPreferences.themeMode === "light" ? "chip--active" : ""}`}
                  onClick={() => setThemeMode("light")}
                  type="button"
                >
                  Claro
                </button>
                <button
                  className={`chip ${uiPreferences.themeMode === "dark" ? "chip--active" : ""}`}
                  onClick={() => setThemeMode("dark")}
                  type="button"
                >
                  Oscuro
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="accent-appearance">Color de acento</label>
              <div className="accent-presets">
                {accentPresets.map((color) => (
                  <button
                    key={color}
                    aria-label={`Usar color ${color}`}
                    className={`accent-swatch ${uiPreferences.accentColor.toLowerCase() === color.toLowerCase() ? "accent-swatch--active" : ""}`}
                    onClick={() => setAccentColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
              <div className="theme-custom-row">
                <input
                  aria-label="Seleccionar color personalizado"
                  className="color-picker"
                  onChange={(event) => setAccentColor(event.target.value)}
                  type="color"
                  value={uiPreferences.accentColor}
                />
                <input
                  className="form-input"
                  onChange={(event) => setAccentColor(event.target.value)}
                  value={uiPreferences.accentColor}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Permisos del rol</h3>
          </div>
          <div className="list">
            <article className="list-item"><strong>Buy-in:</strong> {capabilities.canBuyIn ? "Permitido" : "Restringido"}</article>
            <article className="list-item"><strong>Cash-out:</strong> {capabilities.canCashOut ? "Permitido" : "Restringido"}</article>
            <article className="list-item"><strong>Alerta manual:</strong> {capabilities.canRaiseManualAlert ? "Permitida" : "Restringida"}</article>
            <article className="list-item"><strong>RTE / ROS:</strong> {capabilities.canReviewRte || capabilities.canCreateRos ? "Panel privado habilitado" : "No autorizado"}</article>
          </div>
        </div>
      </div>
    </div>
  );
}
