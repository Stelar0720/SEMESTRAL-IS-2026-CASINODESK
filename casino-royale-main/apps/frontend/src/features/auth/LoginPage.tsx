import { ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoleHome } from "../../app/roles";
import { useAppStore } from "../../app/store";

const demoUsers = ["cajero", "supervisor", "oficial", "admin"];

export function LoginPage() {
  const navigate = useNavigate();
  const loginWithCredentials = useAppStore((state) => state.loginWithCredentials);
  const [username, setUsername] = useState("cajero");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const session = await loginWithCredentials(username, password);
      navigate(getRoleHome(session.role));
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No fue posible iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="sidebar-brand" style={{ marginBottom: 22 }}>
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="brand-title">CasinoDesk v3</p>
            <p className="brand-subtitle">AML/CFT, KYC condicional, RTE, ROS y trazabilidad regulatoria</p>
          </div>
        </div>

        <div className="section-stack">
          <div className="panel" style={{ padding: 18 }}>
            <div className="section-heading">
              <h2>Inicio de sesión</h2>
              <p>Para la demostración, todas las cuentas usan la contraseña <strong>demo</strong>.</p>
            </div>

            <form className="form-grid" style={{ marginTop: 16 }} onSubmit={submit}>
              <label className="form-field">
                <span>Usuario</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label className="form-field">
                <span>Contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error ? <div className="status-banner status-banner--error" role="alert">{error}</div> : null}
              <button className="btn btn--primary" type="submit" disabled={submitting}>
                {submitting ? "Validando..." : "Ingresar"}
              </button>
            </form>

            <div className="section-heading" style={{ marginTop: 22 }}>
              <p>Accesos rápidos para la exposición:</p>
            </div>
            <div className="login-role-grid" style={{ marginTop: 10 }}>
              {demoUsers.map((user) => (
                <button
                  key={user}
                  className="role-login-card"
                  onClick={() => {
                    setUsername(user);
                    setPassword("demo");
                    setError("");
                  }}
                  type="button"
                >
                  <strong>{user}</strong>
                  <span>Contraseña: demo</span>
                </button>
              ))}
            </div>
          </div>

          <p className="footer-note">
            La API valida credenciales y aplica permisos diferentes para caja, mesa, cumplimiento y administración.
          </p>
        </div>
      </div>
    </div>
  );
}
