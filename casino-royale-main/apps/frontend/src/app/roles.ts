import type { Role, RoleCapability } from "./types";

export const roleCapabilities: Record<Role, RoleCapability> = {
  Cajero: {
    canBuyIn: true,
    canCashOut: true,
    canRunKyc: true,
    canRaiseManualAlert: true,
    canApprovePep: false,
    canReviewRte: false,
    canCreateRos: false,
    canAccessPrivateCompliance: false
  },
  Oficial: {
    canBuyIn: false,
    canCashOut: false,
    canRunKyc: false,
    canRaiseManualAlert: false,
    canApprovePep: true,
    canReviewRte: true,
    canCreateRos: true,
    canAccessPrivateCompliance: true
  },
  Supervisor: {
    canBuyIn: true,
    canCashOut: false,
    canRunKyc: true,
    canRaiseManualAlert: true,
    canApprovePep: false,
    canReviewRte: false,
    canCreateRos: false,
    canAccessPrivateCompliance: true
  },
  Administrador: {
    canBuyIn: false,
    canCashOut: false,
    canRunKyc: false,
    canRaiseManualAlert: false,
    canApprovePep: false,
    canReviewRte: false,
    canCreateRos: false,
    canAccessPrivateCompliance: true
  }
};

export function getRoleHome(role: Role) {
  switch (role) {
    case "Oficial":
      return "/official";
    case "Supervisor":
      return "/supervisor";
    case "Administrador":
      return "/admin";
    default:
      return "/";
  }
}

export function getRoleBadge(role: Role) {
  switch (role) {
    case "Oficial":
      return "Panel privado";
    case "Supervisor":
      return "Monitoreo de sala";
    case "Administrador":
      return "Soporte y configuracion";
    default:
      return "Caja operativa";
  }
}
