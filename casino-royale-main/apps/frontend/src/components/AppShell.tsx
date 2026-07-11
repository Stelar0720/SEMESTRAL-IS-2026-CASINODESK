import {
  Bell, BriefcaseBusiness, CircleAlert, CircleDollarSign, Clock3, CreditCard,
  FileWarning, House, LayoutDashboard, LogOut, ShieldAlert, ShieldPlus, UserRound
} from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { getRoleBadge, getRoleHome, roleCapabilities } from "../app/roles";
import { useAppStore } from "../app/store";
import { BuyInModal, CashOutModal, ManualAlertModal, ReceiptModal } from "./TransactionModals";
import type { Role } from "../app/types";

type ModalType = "buyin" | "cashout" | "receipt" | "manual-alert" | null;

type AppChromeContextType = {
  openModal: (modal: Exclude<ModalType, null>) => void;
  closeModal: () => void;
};

type NavItem = {
  to?: string;
  label: string;
  icon: typeof LayoutDashboard;
  action?: ModalType;
};

const AppChromeContext = createContext<AppChromeContextType | null>(null);

function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const interval = globalThis.setInterval(() => {
      setTime(new Date().toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);

    return () => globalThis.clearInterval(interval);
  }, []);

  return time;
}

function SidebarLink({ to, label, icon: Icon }: { readonly to: string; readonly label: string; readonly icon: typeof LayoutDashboard }) {
  return (
    <NavLink to={to} end={to === "/"} className={({ isActive }) => `sidebar__item ${isActive ? "active" : ""}`}>
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

function SidebarAction({
  label,
  icon: Icon,
  onClick
}: {
  readonly label: string;
  readonly icon: typeof LayoutDashboard;
  readonly onClick: () => void;
}) {
  return (
    <button className="sidebar__item sidebar__item--button" onClick={onClick} type="button">
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

const homeLabels: Record<Role, string> = {
  Supervisor: "Monitoreo de sala",
  Administrador: "Soporte tecnico",
  Oficial: "Panel privado",
  Cajero: "Inicio de caja"
};

const homeIcons: Record<Role, typeof ShieldAlert> = {
  Oficial: ShieldAlert,
  Cajero: CircleAlert,
  Supervisor: CircleAlert,
  Administrador: CircleAlert
};

function buildBuyInLabel(role: Role): string {
  return role === "Supervisor" ? "Buy-in en mesa" : "Buy-in";
}

function buildNavigation(role: Role) {
  const capabilities = roleCapabilities[role];

  const operation: NavItem[] = [
    {
      to: getRoleHome(role),
      label: homeLabels[role],
      icon: homeIcons[role]
    }
  ];

  if (capabilities.canBuyIn) {
    operation.push({ label: buildBuyInLabel(role), icon: CircleDollarSign, action: "buyin" });
  }
  if (capabilities.canCashOut) {
    operation.push({ label: "Cash-out", icon: CreditCard, action: "cashout" });
  }
  if (capabilities.canRaiseManualAlert) {
    operation.push({ label: "Alerta discreta", icon: ShieldPlus, action: "manual-alert" });
  }

  const management: NavItem[] = [{ to: "/profile", label: "Mi perfil", icon: UserRound }];
  management.push({ to: "/session", label: "Sesion del cliente", icon: UserRound });
  management.push({ to: "/history", label: "Trazabilidad", icon: Clock3 });

  const compliance: NavItem[] = [];
  if (capabilities.canAccessPrivateCompliance) {
    compliance.push(
      { to: "/official", label: "Dashboard oficial", icon: ShieldAlert },
      { to: "/alerts", label: "Alertas y ROS", icon: Bell }
    );
  }
  if (role === "Administrador") {
    compliance.push({ to: "/admin", label: "Soporte y configuracion", icon: BriefcaseBusiness });
  }
  if (capabilities.canReviewRte) {
    compliance.push({ to: "/official", label: "Bandeja RTE", icon: FileWarning });
  }

  return { operation, management, compliance };
}

export function AppShell() {
  const navigate = useNavigate();
  const session = useAppStore((state) => state.session);
  const logout = useAppStore((state) => state.logout);
  const hydrate = useAppStore((state) => state.hydrate);
  const backendAvailable = useAppStore((state) => state.backendAvailable);
  const uiPreferences = useAppStore((state) => state.uiPreferences);
  const clock = useClock();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        if (session && roleCapabilities[session.role].canBuyIn) {
          setActiveModal("buyin");
        }
      }

      if (event.key === "F2") {
        event.preventDefault();
        if (session && roleCapabilities[session.role].canCashOut) {
          setActiveModal("cashout");
        }
      }

      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [session]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = uiPreferences.themeMode;
    root.style.setProperty("--accent-gold", uiPreferences.accentColor);

    const hex = uiPreferences.accentColor.replace("#", "");
    const normalized = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
    const red = Number.parseInt(normalized.slice(0, 2), 16) || 212;
    const green = Number.parseInt(normalized.slice(2, 4), 16) || 175;
    const blue = Number.parseInt(normalized.slice(4, 6), 16) || 55;

    root.style.setProperty("--accent-rgb", `${red}, ${green}, ${blue}`);
    root.style.setProperty("--accent-gold-dim", `rgba(${red}, ${green}, ${blue}, 0.14)`);
  }, [uiPreferences]);

  const contextValue = useMemo<AppChromeContextType>(
    () => ({
      openModal: (modal) => setActiveModal(modal),
      closeModal: () => setActiveModal(null)
    }),
    []
  );

  if (!session) {
    return null;
  }

  const capabilities = roleCapabilities[session.role];
  const navigation = buildNavigation(session.role);

  return (
    <AppChromeContext.Provider value={contextValue}>
      <div id="mainApp" className={`app-shell app-shell--${session.role.toLowerCase()}`}>
        <header className="header">
          <div className="header__logo">
            <div className="header__logo-icon">
              <House size={24} />
            </div>
            <div>
              <span className="header__logo-text">CasinoDesk</span>
              <div className="header__private-note">{getRoleBadge(session.role)}</div>
            </div>
          </div>

          <div className="header__spacer" />

          <div className="header__info">
            <div className="header__box-selector">
              <House size={16} />
              <span>{session.station}</span>
            </div>

            <NavLink to="/profile" className="header__user header__user--link">
              <div className="header__user-avatar">{session.initials}</div>
              <div className="header__user-info">
                <span className="header__user-name">{session.fullName}</span>
                <span className="header__user-role">{session.role}</span>
              </div>
            </NavLink>

            <div className="header__clock" id="clock">
              {clock}
            </div>

            <div className="header__shortcuts">
              {capabilities.canBuyIn ? (
                <button className="btn btn--shortcut" onClick={() => setActiveModal("buyin")} type="button">
                  F1 Buy-in
                </button>
              ) : null}
              {capabilities.canCashOut ? (
                <button className="btn btn--shortcut" onClick={() => setActiveModal("cashout")} type="button">
                  F2 Cash-out
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <nav className="sidebar">
          <ul className="sidebar__nav">
            <li className="sidebar__section">
              <span className="sidebar__section-title">Operacion</span>
              {navigation.operation.map((item) =>
                item.to ? (
                  <SidebarLink key={item.label} to={item.to} label={item.label} icon={item.icon} />
                ) : (
                  <SidebarAction key={item.label} label={item.label} icon={item.icon} onClick={() => setActiveModal(item.action ?? null)} />
                )
              )}
            </li>

            <li className="sidebar__section">
              <span className="sidebar__section-title">Gestion</span>
              {navigation.management.map((item) => (
                <SidebarLink key={item.label} to={item.to!} label={item.label} icon={item.icon} />
              ))}
            </li>

            {navigation.compliance.length ? (
              <li className="sidebar__section">
                <span className="sidebar__section-title">Cumplimiento</span>
                {navigation.compliance.map((item) => (
                  <SidebarLink key={item.label} to={item.to!} label={item.label} icon={item.icon} />
                ))}
              </li>
            ) : null}
          </ul>

          <div className="sidebar__bottom">
            <button
              className="btn btn--ghost btn--logout"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
              type="button"
            >
              <LogOut size={16} />
              Cerrar sesion
            </button>
          </div>
        </nav>

        <main className="main-content">
          {!backendAvailable ? (
            <div className="connection-banner" role="status">
              API desconectada: estás en modo local. Las operaciones realizadas ahora no persistirán al recargar.
            </div>
          ) : null}
          <Outlet context={contextValue} />
        </main>

        <BuyInModal
          isOpen={activeModal === "buyin"}
          onClose={() => setActiveModal(null)}
          onSuccess={() => setActiveModal("receipt")}
        />
        <CashOutModal isOpen={activeModal === "cashout"} onClose={() => setActiveModal(null)} />
        <ManualAlertModal isOpen={activeModal === "manual-alert"} onClose={() => setActiveModal(null)} />
        <ReceiptModal isOpen={activeModal === "receipt"} onClose={() => setActiveModal(null)} />
      </div>
    </AppChromeContext.Provider>
  );
}

export function useAppChrome() {
  const chromeContext = useContext(AppChromeContext);
  const outletContext = useOutletContext<AppChromeContextType | null>();
  const context = chromeContext ?? outletContext;
  if (!context) throw new Error("useAppChrome must be used within AppShell");
  return context;
}
