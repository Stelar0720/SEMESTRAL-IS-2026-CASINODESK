import type { ReactElement } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { AlertsPage } from "../features/compliance/AlertsPage";
import { OfficialDashboardPage } from "../features/compliance/OfficialDashboardPage";
import { AdminOverviewPage } from "../features/dashboard/AdminOverviewPage";
import { HistoryPage } from "../features/dashboard/HistoryPage";
import { OperatorDashboardPage } from "../features/dashboard/OperatorDashboardPage";
import { ProfilePage } from "../features/dashboard/ProfilePage";
import { RoleHomePage } from "../features/dashboard/RoleHomePage";
import { SessionPage } from "../features/dashboard/SessionPage";
import { SupervisorDashboardPage } from "../features/dashboard/SupervisorDashboardPage";
import { useAppStore } from "./store";
import { getRoleHome } from "./roles";
import type { Role } from "./types";

function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: Role[] }) {
  const session = useAppStore((state) => state.session);
  if (!session) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(session.role)) {
    return <Navigate to={getRoleHome(session.role)} replace />;
  }
  return children;
}

const protectedPage = (element: ReactElement, roles?: Role[]) => (
  <ProtectedRoute roles={roles}>{element}</ProtectedRoute>
);

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RoleHomePage /> },
      { path: "cashier", element: protectedPage(<OperatorDashboardPage />, ["Cajero"]) },
      { path: "supervisor", element: protectedPage(<SupervisorDashboardPage />, ["Supervisor"]) },
      { path: "admin", element: protectedPage(<AdminOverviewPage />, ["Administrador"]) },
      { path: "session", element: protectedPage(<SessionPage />, ["Cajero", "Oficial", "Supervisor", "Administrador"]) },
      { path: "history", element: <HistoryPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "alerts", element: protectedPage(<AlertsPage />, ["Oficial", "Administrador"]) },
      { path: "official", element: protectedPage(<OfficialDashboardPage />, ["Oficial", "Supervisor", "Administrador"]) }
    ]
  }
]);
