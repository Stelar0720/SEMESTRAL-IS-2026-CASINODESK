export type Role = "Cajero" | "Oficial" | "Supervisor" | "Administrador";

export type RiskLevel = "VERDE" | "AMARILLO" | "ROJO";

export type AlertType =
  | "PEP"
  | "AML"
  | "FRACCIONAMIENTO"
  | "COMPORTAMIENTO"
  | "MANUAL"
  | "TIMEOUT";

export interface UserSession {
  id: string;
  fullName: string;
  initials: string;
  role: Role;
  station: string;
  accessToken?: string;
}

export interface RoleCapability {
  canBuyIn: boolean;
  canCashOut: boolean;
  canRunKyc: boolean;
  canRaiseManualAlert: boolean;
  canApprovePep: boolean;
  canReviewRte: boolean;
  canCreateRos: boolean;
  canAccessPrivateCompliance: boolean;
}

export interface ScreeningResult {
  level: RiskLevel;
  amlMatches: string[];
  pepMatch?: string;
  requiresReview: boolean;
  timeout: boolean;
}

export interface Transaction {
  id: string;
  type: "BUY_IN" | "CASH_OUT";
  clientDisplayName: string;
  clientHash: string;
  amount: number;
  paymentMethod: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CHEQUE";
  risk: RiskLevel;
  status: "COMPLETADA" | "BLOQUEADA" | "PENDIENTE_RTE" | "PENDIENTE_REVISION";
  createdAt: string;
  chipsPlayedRatio?: number;
  requiresKyc: boolean;
  requiresRte: boolean;
  nationality?: string;
  residenceCountry?: string;
  originOfFunds?: string;
  sourceChannel?: "CAJA" | "MESA";
  documentCaptureMode?: "QR" | "MANUAL";
}

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  severity: "ALTA" | "MEDIA" | "CRITICA";
  risk: RiskLevel;
  createdAt: string;
  description: string;
  clientHash: string;
  amount: number;
  status: "ABIERTA" | "EN_REVISION" | "CERRADA";
  source?: "AUTOMATICA" | "MANUAL";
  createdBy?: string;
  assignedRole?: Role | "Sistema AML";
  resolutionNote?: string;
  relatedTransactionIds?: string[];
}

export interface RteRecord {
  id: string;
  clientHash: string;
  totalAmount: number;
  originOfFunds: string;
  signedByClient: boolean;
  approvedByOfficer: boolean;
  transactionIds: string[];
  folio?: string;
  createdAt?: string;
  status?: "PENDIENTE_FIRMA" | "PENDIENTE" | "PENDIENTE_APROBACION" | "APROBADO" | "ENVIADO";
  signedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  sentAt?: string;
  submissionReference?: string;
}

export interface RosRecord {
  id: string;
  alertId: string;
  narrative: string;
  signedBy: string;
  createdAt: string;
  status?: "BORRADOR" | "ENVIADO";
  sentAt?: string;
  submissionReference?: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  event: string;
  result: string;
  createdAt: string;
}

export interface ClientCaseSummary {
  clientHash: string;
  clientName: string;
  dailyCashTotal: number;
  weeklyCashTotal: number;
  transactions: Transaction[];
  alerts: AlertItem[];
  riskScore: number;
  riskLevel: RiskLevel;
}
