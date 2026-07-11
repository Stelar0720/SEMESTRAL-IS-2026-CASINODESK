import type {
  AlertItem,
  AuditEvent,
  AlertType,
  RiskLevel,
  Role,
  RosRecord,
  RteRecord,
  ScreeningResult,
  Transaction
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TOKEN_KEY = "casinodesk.accessToken";
const REFRESH_TOKEN_KEY = "casinodesk.refreshToken";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  fullName: string;
  role: Role;
  station: string;
};

type BackendTransaction = {
  id: string;
  type: "BuyIn" | "CashOut";
  clientName: string;
  clientHash: string;
  amount: number;
  paymentMethod: "Efectivo" | "Tarjeta" | "Transferencia" | "Cheque";
  riskLevel: "Verde" | "Amarillo" | "Rojo";
  status: "Completada" | "Bloqueada" | "PendienteRte" | "PendienteRevision";
  requiresKyc: boolean;
  requiresRte: boolean;
  chipsPlayedRatio?: number | null;
  createdAt: string;
};

type BackendAlert = {
  id: string;
  type: "Pep" | "Aml" | "Fraccionamiento" | "Comportamiento" | "Manual" | "Timeout";
  title: string;
  description: string;
  riskLevel: "Verde" | "Amarillo" | "Rojo";
  severity: "ALTA" | "MEDIA" | "CRITICA";
  clientHash: string;
  amount: number;
  status: "ABIERTA" | "EN_REVISION" | "CERRADA";
  createdAt: string;
};

type BackendScreening = {
  level: "Verde" | "Amarillo" | "Rojo";
  requiresReview: boolean;
  timedOut: boolean;
  amlMatches: string[];
  pepMatch?: string | null;
};

const riskLevelMap: Record<string, RiskLevel> = {
  Verde: "VERDE",
  Amarillo: "AMARILLO",
  Rojo: "ROJO"
};

function toRiskLevel(value: "Verde" | "Amarillo" | "Rojo"): RiskLevel {
  return riskLevelMap[value];
}

const paymentMethodMap: Record<string, Transaction["paymentMethod"]> = {
  Efectivo: "EFECTIVO",
  Tarjeta: "TARJETA",
  Transferencia: "TRANSFERENCIA",
  Cheque: "CHEQUE"
};

function mapPaymentMethod(value: string): Transaction["paymentMethod"] {
  return paymentMethodMap[value] ?? "EFECTIVO";
}

const transactionStatusMap: Record<string, Transaction["status"]> = {
  Completada: "COMPLETADA",
  Bloqueada: "BLOQUEADA",
  PendienteRte: "PENDIENTE_RTE",
  PendienteRevision: "PENDIENTE_REVISION"
};

function mapTransactionStatus(value: string): Transaction["status"] {
  return transactionStatusMap[value] ?? "COMPLETADA";
}

function toAlertType(value: BackendAlert["type"]): AlertType {
  switch (value) {
    case "Pep":
      return "PEP";
    case "Aml":
      return "AML";
    case "Fraccionamiento":
      return "FRACCIONAMIENTO";
    case "Comportamiento":
      return "COMPORTAMIENTO";
    case "Manual":
      return "MANUAL";
    case "Timeout":
      return "TIMEOUT";
  }
}

function mapTransaction(item: BackendTransaction): Transaction {
  return {
    id: item.id,
    type: item.type === "BuyIn" ? "BUY_IN" : "CASH_OUT",
    clientDisplayName: item.clientName,
    clientHash: item.clientHash,
    amount: item.amount,
    paymentMethod: mapPaymentMethod(item.paymentMethod),
    risk: toRiskLevel(item.riskLevel),
    status: mapTransactionStatus(item.status),
    createdAt: item.createdAt,
    chipsPlayedRatio: item.chipsPlayedRatio ?? undefined,
    requiresKyc: item.requiresKyc,
    requiresRte: item.requiresRte
  };
}

function mapAlert(item: BackendAlert): AlertItem {
  return {
    id: item.id,
    type: toAlertType(item.type),
    title: item.title,
    severity: item.severity,
    risk: toRiskLevel(item.riskLevel),
    createdAt: item.createdAt,
    description: item.description,
    clientHash: item.clientHash,
    amount: item.amount,
    status: item.status
  };
}

function mapScreening(item: BackendScreening): ScreeningResult {
  return {
    level: toRiskLevel(item.level),
    amlMatches: item.amlMatches,
    pepMatch: item.pepMatch ?? undefined,
    requiresReview: item.requiresReview,
    timeout: item.timedOut
  };
}

type LoginPayload = {
  username: string;
  password: string;
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const problem = JSON.parse(text) as { detail?: string; title?: string };
      throw new ApiError(problem.detail || problem.title || `HTTP ${response.status}`, response.status);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ApiError(text || `HTTP ${response.status}`, response.status);
      }
      throw error;
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function login(payload: LoginPayload) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function logoutRequest() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return;
  await request<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export async function getTransactions() {
  const data = await request<BackendTransaction[]>("/transactions");
  return data.map(mapTransaction);
}

export async function createBuyIn(payload: unknown) {
  return request("/transactions/buy-in", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createCashOut(payload: unknown) {
  return request("/transactions/cash-out", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function runScreening(payload: unknown) {
  const data = await request<BackendScreening>("/screening/run", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return mapScreening(data);
}

export async function addDemoWatchlist(documentNumber: string) {
  return request<{ maskedHash: string; message: string }>("/screening/demo-watchlist", {
    method: "POST",
    body: JSON.stringify({ documentNumber })
  });
}

export async function getAlerts() {
  const data = await request<BackendAlert[]>("/alerts");
  return data.map(mapAlert);
}

export async function patchAlert(id: string, status: string, resolutionNote?: string) {
  return request(`/alerts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, resolutionNote })
  });
}

export async function createManualAlertRequest(payload: {
  title: string;
  description: string;
  clientHash?: string;
  amount?: number;
}) {
  const data = await request<BackendAlert>("/alerts/manual", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return mapAlert(data);
}

export async function getRtes() {
  return request<RteRecord[]>("/rte");
}

export async function approveRteRequest(id: string) {
  return request(`/rte/${id}/approve`, {
    method: "PATCH"
  });
}

export async function submitRteRequest(id: string) {
  return request<RteRecord>(`/rte/${id}/submit`, { method: "POST" });
}

export async function getRos() {
  return request<RosRecord[]>("/ros");
}

export async function createRosRequest(alertId: string, narrative: string) {
  return request<RosRecord>("/ros", {
    method: "POST",
    body: JSON.stringify({ alertId, narrative })
  });
}

export async function submitRosRequest(id: string) {
  return request<RosRecord>(`/ros/${id}/submit`, { method: "POST" });
}

export async function getAudit() {
  return request<AuditEvent[]>("/audit");
}

export type ProspectPayload = {
  documentNumber: string;
  documentType: string;
  issuingCountry: string;
  documentIssuedAt?: string;
  documentExpiresAt?: string;
  firstNames: string;
  lastNames: string;
  birthDate?: string;
  birthPlace?: string;
  sex?: string;
  nationality: string;
  residenceCountry: string;
  address?: string;
  phone?: string;
  email?: string;
  occupation?: string;
  employer?: string;
  economicActivity?: string;
  monthlyIncomeRange?: string;
  expectedGamingAmount: number;
  expectedGamingFrequency?: string;
  sourceOfFunds?: string;
  relationshipPurpose?: string;
  isPep: boolean;
  pepRelationship?: string;
  riskLevel: "Verde" | "Amarillo" | "Rojo";
  riskScore: number;
  status: string;
};

export type SavedProspect = ProspectPayload & {
  id: string;
  documentHash: string;
  documentNumberMasked: string;
};

export async function saveProspect(payload: ProspectPayload) {
  return request<SavedProspect>("/prospects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function addProspectEvidence(prospectId: string, payload: {
  evidenceType: string;
  source: string;
  reference?: string;
  result: string;
  isSimulated: boolean;
}) {
  return request(`/prospects/${prospectId}/evidence`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type IntegrationStatus = {
  name: string;
  mode: string;
  simulated: boolean;
  status: string;
  detail: string;
  checkedAt: string;
};

export async function getIntegrationStatus() {
  return request<IntegrationStatus[]>("/integrations/status");
}

export async function getComplianceSummary() {
  return request<{
    prospects: number;
    transactions: number;
    totalAmount: number;
    blockedTransactions: number;
    openAlerts: number;
    criticalAlerts: number;
    pendingRte: number;
    sentRte: number;
    draftRos: number;
    sentRos: number;
  }>("/reports/summary");
}

export async function openComplianceReport(path: string, format: "html" | "csv", fileName: string) {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}${path.includes("?") ? "&" : "?"}format=${format}`, { headers });
  if (!response.ok) throw new Error(`No fue posible generar el reporte (HTTP ${response.status}).`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  if (format === "html") {
    globalThis.open(url, "_blank", "noopener,noreferrer");
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${fileName}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
