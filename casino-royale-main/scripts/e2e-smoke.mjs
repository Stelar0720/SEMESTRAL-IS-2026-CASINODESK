const frontendUrl = process.env.FRONTEND_URL ?? "http://127.0.0.1:8080";
const apiUrl = process.env.API_URL ?? "http://127.0.0.1:5067";

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method ?? "GET"} ${path}: HTTP ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function login(username) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "demo" })
  });
}

function authenticated(token, method = "GET", body) {
  return {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  };
}

const frontend = await fetch(frontendUrl);
if (!frontend.ok || !(await frontend.text()).includes("CasinoDesk")) throw new Error("Frontend no disponible.");

const supervisor = await login("supervisor");
const officer = await login("oficial");
const suffix = Date.now().toString().slice(-4);
const documentNumber = `8-799-${suffix}`;

const prospect = await request("/prospects", authenticated(supervisor.accessToken, "POST", {
  documentNumber, documentType: "CEDULA", issuingCountry: "PANAMA",
  documentIssuedAt: "2024-01-01", documentExpiresAt: "2034-01-01",
  firstNames: "E2E", lastNames: "Automatizado", birthDate: "1991-01-01",
  birthPlace: "Panama", sex: "X", nationality: "Panamena", residenceCountry: "Panama",
  address: "Direccion de prueba", phone: "6000-9999", email: "e2e@example.test",
  occupation: "Pruebas", employer: "CasinoDesk", economicActivity: "Tecnologia",
  monthlyIncomeRange: "2000-5000", expectedGamingAmount: 2500,
  expectedGamingFrequency: "Ocasional", sourceOfFunds: "Salario",
  relationshipPurpose: "Prueba automatizada", isPep: false, pepRelationship: "",
  riskLevel: "Verde", riskScore: 10, status: "APROBADO"
}));

await request(`/prospects/${prospect.id}/evidence`, authenticated(supervisor.accessToken, "POST", {
  evidenceType: "DOCUMENTO_IDENTIDAD", source: "E2E_SIMULADO",
  reference: `E2E-${suffix}`, result: "Evidencia automatizada valida", isSimulated: true
}));

const transaction = await request("/transactions/buy-in", authenticated(supervisor.accessToken, "POST", {
  clientName: "E2E Automatizado", documentNumber, amount: 2500,
  paymentMethod: "Efectivo", originOfFunds: "Salario", justification: "Perfil proporcional",
  chipsPlayedRatio: null, signedByClient: false
}));

const caseFile = await request(`/prospects/${prospect.id}`, authenticated(officer.accessToken));
const summary = await request("/reports/summary", authenticated(officer.accessToken));
if (caseFile.evidence.length !== 1) throw new Error("La evidencia KYC no quedo relacionada.");
if (transaction.status !== "Completada") throw new Error(`Estado transaccional inesperado: ${transaction.status}`);
if (summary.prospects < 1) throw new Error("El resumen de cumplimiento no refleja prospectos.");

console.log(`E2E OK: frontend, login, KYC ${prospect.id}, evidencia, buy-in ${transaction.transactionId} y reporte.`);
