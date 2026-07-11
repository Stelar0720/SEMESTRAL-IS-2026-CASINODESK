import type {
  AlertItem,
  AuditEvent,
  RteRecord,
  RosRecord,
  Transaction,
  UserSession
} from "./types";

export const mockUsers: UserSession[] = [
  { id: "u-1", fullName: "Jose Ramos", initials: "JR", role: "Cajero", station: "CAJA-01" },
  { id: "u-3", fullName: "Norberto Solis", initials: "NS", role: "Oficial", station: "COMPLIANCE" },
  { id: "u-4", fullName: "Adrian Gomez", initials: "AG", role: "Supervisor", station: "MESA-02" },
  { id: "u-5", fullName: "Admin CasinoDesk", initials: "AC", role: "Administrador", station: "HQ" }
];

export const initialTransactions: Transaction[] = [
  {
    id: "txn-1001",
    type: "BUY_IN",
    clientDisplayName: "Luis Espinosa",
    clientHash: "a91c...f0e3",
    amount: 2500,
    paymentMethod: "EFECTIVO",
    risk: "VERDE",
    status: "COMPLETADA",
    createdAt: "2026-05-26T14:48:00-05:00",
    requiresKyc: true,
    requiresRte: false,
    nationality: "Panameña",
    residenceCountry: "Panamá",
    originOfFunds: "Actividad comercial declarada.",
    sourceChannel: "CAJA",
    documentCaptureMode: "QR"
  },
  {
    id: "txn-1002",
    type: "BUY_IN",
    clientDisplayName: "Rene Mendoza",
    clientHash: "3c98...a5d1",
    amount: 6000,
    paymentMethod: "EFECTIVO",
    risk: "AMARILLO",
    status: "PENDIENTE_REVISION",
    createdAt: "2026-05-26T14:31:00-05:00",
    requiresKyc: true,
    requiresRte: false,
    nationality: "Panameña",
    residenceCountry: "Panamá",
    originOfFunds: "Ingresos por actividad política y empresarial.",
    sourceChannel: "MESA",
    documentCaptureMode: "MANUAL"
  },
  {
    id: "txn-1003",
    type: "CASH_OUT",
    clientDisplayName: "Maria Saavedra",
    clientHash: "7d4e...91ba",
    amount: 11000,
    paymentMethod: "EFECTIVO",
    risk: "VERDE",
    status: "PENDIENTE_RTE",
    createdAt: "2026-05-26T14:14:00-05:00",
    requiresKyc: true,
    requiresRte: true,
    chipsPlayedRatio: 0.18,
    nationality: "Colombiana",
    residenceCountry: "Colombia",
    originOfFunds: "Retiro de caja personal y ganancias de juego.",
    sourceChannel: "CAJA",
    documentCaptureMode: "QR"
  }
];

export const initialAlerts: AlertItem[] = [
  {
    id: "alt-001",
    type: "AML",
    title: "Coincidencia OFAC",
    severity: "CRITICA",
    risk: "ROJO",
    createdAt: "2026-05-26T13:48:00-05:00",
    description: "Coincidencia directa con lista OFAC SDN. Transaccion bloqueada.",
    clientHash: "fcb7...ccb7",
    amount: 3000,
    status: "ABIERTA",
    source: "AUTOMATICA",
    createdBy: "Sistema AML",
    assignedRole: "Oficial"
  },
  {
    id: "alt-002",
    type: "PEP",
    title: "PEP requiere proporcionalidad",
    severity: "ALTA",
    risk: "AMARILLO",
    createdAt: "2026-05-26T13:22:00-05:00",
    description: "Perfil PEP detectado. Se requiere justificar el origen de fondos.",
    clientHash: "7d4e...91ba",
    amount: 8000,
    status: "EN_REVISION",
    source: "AUTOMATICA",
    createdBy: "Sistema AML",
    assignedRole: "Oficial"
  },
  {
    id: "alt-003",
    type: "FRACCIONAMIENTO",
    title: "Patron de structuring",
    severity: "CRITICA",
    risk: "AMARILLO",
    createdAt: "2026-05-26T13:06:00-05:00",
    description: "4 transacciones menores a 2,000 en 24 horas entre caja y mesa.",
    clientHash: "b88e...2741",
    amount: 7400,
    status: "ABIERTA",
    source: "AUTOMATICA",
    createdBy: "Sistema AML",
    assignedRole: "Supervisor"
  }
];

export const initialRtes: RteRecord[] = [
  {
    id: "rte-001",
    clientHash: "7d4e...91ba",
    totalAmount: 11000,
    originOfFunds: "Actividad comercial y retiro de caja personal.",
    signedByClient: true,
    approvedByOfficer: false,
    transactionIds: ["txn-1003"],
    folio: "RTE-2026-0001",
    createdAt: "2026-05-26T14:16:00-05:00",
    status: "PENDIENTE"
  }
];

export const initialRos: RosRecord[] = [
  {
    id: "ros-001",
    alertId: "alt-003",
    narrative: "Cliente presenta patron de fraccionamiento consistente con structuring.",
    signedBy: "Norberto Solis",
    createdAt: "2026-05-25T15:20:00-05:00",
    status: "ENVIADO"
  }
];

export const initialAudit: AuditEvent[] = [
  {
    id: "aud-001",
    actor: "Sistema AML",
    event: "Timeout precautorio AML",
    result: "Marcado AMARILLO y notificado al oficial",
    createdAt: "2026-05-26T12:58:00-05:00"
  },
  {
    id: "aud-002",
    actor: "Jose Ramos",
    event: "Registro de buy-in",
    result: "KYC completado y semaforo VERDE",
    createdAt: "2026-05-26T12:48:00-05:00"
  }
];
