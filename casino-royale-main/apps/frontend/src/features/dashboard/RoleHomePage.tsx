import { Navigate } from "react-router-dom";
import { getRoleHome } from "../../app/roles";
import { useAppStore } from "../../app/store";
import { OperatorDashboardPage } from "./OperatorDashboardPage";

export function RoleHomePage() {
  const session = useAppStore((state) => state.session);

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (session.role === "Cajero") {
    return <OperatorDashboardPage />;
  }

  return <Navigate to={getRoleHome(session.role)} replace />;
}
