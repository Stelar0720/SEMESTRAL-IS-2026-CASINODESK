import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore, buildClientCaseSummaries } from "./store";
import type { AlertItem, Transaction } from "./types";

describe("detectRisk", () => {
  it("returns ROJO for OFAC match", async () => {
    const store = useAppStore.getState();
    const result = await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "JUAN OFAC SANCIONADO",
      documentNumber: "8-000-0001",
      amount: 1000,
      paymentMethod: "EFECTIVO"
    });
    expect(result.level).toBe("ROJO");
    expect(result.amlMatches).toContain("OFAC SDN List");
    expect(result.requiresReview).toBe(false);
  });

  it("returns ROJO for SANCIONADO match", async () => {
    const store = useAppStore.getState();
    const result = await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "Pedro SANCIONADO Perez",
      documentNumber: "8-000-0002",
      amount: 500,
      paymentMethod: "TARJETA"
    });
    expect(result.level).toBe("ROJO");
  });

  it("returns AMARILLO with timeout for TIMEOUT name", async () => {
    const store = useAppStore.getState();
    const result = await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "Maria TIMEOUT Lopez",
      documentNumber: "8-000-0003",
      amount: 1000,
      paymentMethod: "EFECTIVO"
    });
    expect(result.level).toBe("AMARILLO");
    expect(result.timeout).toBe(true);
    expect(result.requiresReview).toBe(true);
  });

  it("returns AMARILLO for PEP match", async () => {
    const store = useAppStore.getState();
    const result = await store.submitTransaction({
      type: "CASH_OUT",
      clientDisplayName: "Carlos PEP Rodriguez",
      documentNumber: "8-000-0004",
      amount: 3000,
      paymentMethod: "EFECTIVO",
      chipsPlayedRatio: 0.5
    });
    expect(result.level).toBe("AMARILLO");
    expect(result.pepMatch).toBeDefined();
    expect(result.requiresReview).toBe(true);
  });

  it("returns AMARILLO for ALCALDE match", async () => {
    const store = useAppStore.getState();
    const result = await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "Alcalde Municipal",
      documentNumber: "8-000-0005",
      amount: 500,
      paymentMethod: "EFECTIVO"
    });
    expect(result.level).toBe("AMARILLO");
  });

  it("returns AMARILLO for amount >= 8000", async () => {
    const store = useAppStore.getState();
    const result = await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "Ricardo Mille",
      documentNumber: "8-000-0006",
      amount: 8500,
      paymentMethod: "EFECTIVO"
    });
    expect(result.level).toBe("AMARILLO");
  });

  it("returns AMARILLO for high risk country residence", async () => {
    const store = useAppStore.getState();
    const result = await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "Iraní Nacional",
      documentNumber: "8-000-0007",
      amount: 1000,
      paymentMethod: "EFECTIVO",
      residenceCountry: "IRAN"
    });
    expect(result.level).toBe("AMARILLO");
  });

  it("returns VERDE for clean client", async () => {
    const store = useAppStore.getState();
    const result = await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "Cliente Normal",
      documentNumber: "8-000-0008",
      amount: 500,
      paymentMethod: "EFECTIVO"
    });
    expect(result.level).toBe("VERDE");
    expect(result.amlMatches).toHaveLength(0);
    expect(result.requiresReview).toBe(false);
  });
});

describe("submitTransaction", () => {
  beforeEach(() => {
    useAppStore.setState({
      transactions: [],
      alerts: [],
      rtes: [],
      ros: [],
      audit: []
    });
  });

  it("blocks transaction with ROJO risk", async () => {
    const store = useAppStore.getState();
    await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "OFAC Bloqueado",
      documentNumber: "8-000-0010",
      amount: 500,
      paymentMethod: "EFECTIVO"
    });
    const state = useAppStore.getState();
    const txn = state.transactions[0];
    expect(txn.status).toBe("BLOQUEADA");
    expect(txn.risk).toBe("ROJO");
  });

  it("sets PENDIENTE_RTE for cash >= 10000", async () => {
    const store = useAppStore.getState();
    await store.submitTransaction({
      type: "CASH_OUT",
      clientDisplayName: "Cliente RTE",
      documentNumber: "8-000-0011",
      amount: 12000,
      paymentMethod: "EFECTIVO",
      chipsPlayedRatio: 0.5,
      originOfFunds: "Venta de propiedad"
    });
    const state = useAppStore.getState();
    const txn = state.transactions[0];
    expect(txn.requiresRte).toBe(true);
    expect(txn.status).toBe("PENDIENTE_RTE");
  });

  it("sets PENDIENTE_REVISION for AMARILLO risk", async () => {
    const store = useAppStore.getState();
    await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "PEP Cliente",
      documentNumber: "8-000-0012",
      amount: 5000,
      paymentMethod: "TARJETA"
    });
    const state = useAppStore.getState();
    const txn = state.transactions[0];
    expect(txn.status).toBe("PENDIENTE_REVISION");
  });

  it("creates AML alert for ROJO transactions", async () => {
    const store = useAppStore.getState();
    await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "OFAC Test",
      documentNumber: "8-000-0013",
      amount: 1000,
      paymentMethod: "EFECTIVO"
    });
    const state = useAppStore.getState();
    const amlAlert = state.alerts.find((a) => a.type === "AML");
    expect(amlAlert).toBeDefined();
    expect(amlAlert!.severity).toBe("CRITICA");
  });

  it("creates COMPORTAMIENTO alert when chipsPlayedRatio < 0.2", async () => {
    const store = useAppStore.getState();
    await store.submitTransaction({
      type: "CASH_OUT",
      clientDisplayName: "Low Play",
      documentNumber: "8-000-0014",
      amount: 3000,
      paymentMethod: "TARJETA",
      chipsPlayedRatio: 0.1
    });
    const state = useAppStore.getState();
    const behaviorAlert = state.alerts.find((a) => a.type === "COMPORTAMIENTO");
    expect(behaviorAlert).toBeDefined();
  });

  it("requires KYC for amount >= 2000", async () => {
    const store = useAppStore.getState();
    await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "KYC Test",
      documentNumber: "8-000-0015",
      amount: 2000,
      paymentMethod: "EFECTIVO"
    });
    const state = useAppStore.getState();
    expect(state.transactions[0].requiresKyc).toBe(true);
  });

  it("creates audit log entry on transaction", async () => {
    const store = useAppStore.getState();
    await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "Audit Test",
      documentNumber: "8-000-0016",
      amount: 500,
      paymentMethod: "EFECTIVO"
    });
    const state = useAppStore.getState();
    expect(state.audit.length).toBeGreaterThan(0);
    expect(state.audit[0].actor).toBe("Sistema");
  });

  it("increments transactions array", async () => {
    const store = useAppStore.getState();
    const prevCount = store.transactions.length;
    await store.submitTransaction({
      type: "BUY_IN",
      clientDisplayName: "Increment Test",
      documentNumber: "8-000-0017",
      amount: 500,
      paymentMethod: "EFECTIVO"
    });
    const state = useAppStore.getState();
    expect(state.transactions.length).toBe(prevCount + 1);
  });
});

describe("loginAs", () => {
  it("does not create a fake session when the backend is unavailable", async () => {
    useAppStore.setState({ session: null, backendAvailable: false });
    const store = useAppStore.getState();
    await expect(store.loginAs("Cajero")).rejects.toThrow();
    const state = useAppStore.getState();
    expect(state.session).toBeNull();
    expect(state.backendAvailable).toBe(false);
  });
});

describe("logout", () => {
  it("clears session on logout", () => {
    useAppStore.setState({
      session: {
        id: "u-1",
        fullName: "Test User",
        initials: "TU",
        role: "Administrador",
        station: "HQ"
      }
    });
    const store = useAppStore.getState();
    store.logout();
    const state = useAppStore.getState();
    expect(state.session).toBeNull();
    expect(state.backendAvailable).toBe(false);
  });
});

describe("approveRte", () => {
  it("approves RTE record", () => {
    useAppStore.setState({
      rtes: [{
        id: "rte-test-1",
        clientHash: "abc123",
        totalAmount: 11000,
        originOfFunds: "Business",
        signedByClient: true,
        approvedByOfficer: false,
        transactionIds: ["txn-1"]
      }],
      audit: []
    });
    const store = useAppStore.getState();
    store.approveRte("rte-test-1");
    const state = useAppStore.getState();
    const rte = state.rtes.find((r) => r.id === "rte-test-1");
    expect(rte!.approvedByOfficer).toBe(true);
    expect(rte!.status).toBe("APROBADO");
  });
});

describe("resolveAlert", () => {
  it("closes an alert", () => {
    const alertId = "alt-test-1";
    useAppStore.setState({
      alerts: [{
        id: alertId,
        type: "PEP",
        title: "Test alert",
        severity: "ALTA",
        risk: "AMARILLO",
        createdAt: new Date().toISOString(),
        description: "Test description",
        clientHash: "abc123",
        amount: 5000,
        status: "ABIERTA"
      }],
      audit: []
    });
    const store = useAppStore.getState();
    store.resolveAlert(alertId, "Justificacion de prueba");
    const state = useAppStore.getState();
    const alert = state.alerts.find((a) => a.id === alertId);
    expect(alert!.status).toBe("CERRADA");
    expect(alert!.resolutionNote).toBe("Justificacion de prueba");
  });
});

describe("createRos", () => {
  it("creates a ROS record", () => {
    useAppStore.setState({
      ros: [],
      audit: []
    });
    const store = useAppStore.getState();
    store.createRos("alt-001", "Narrativa de prueba");
    const state = useAppStore.getState();
    expect(state.ros.length).toBe(1);
    expect(state.ros[0].alertId).toBe("alt-001");
    expect(state.ros[0].narrative).toBe("Narrativa de prueba");
    expect(state.ros[0].status).toBe("ENVIADO");
  });
});

describe("createManualAlert", () => {
  it("creates a manual alert", () => {
    useAppStore.setState({
      alerts: [],
      audit: []
    });
    const store = useAppStore.getState();
    store.createManualAlert({
      title: "Alerta manual test",
      description: "Descripcion de prueba",
      clientHash: "hash-abc",
      amount: 5000
    });
    const state = useAppStore.getState();
    const manualAlert = state.alerts.find((a) => a.type === "MANUAL");
    expect(manualAlert).toBeDefined();
    expect(manualAlert!.title).toBe("Alerta manual test");
    expect(manualAlert!.status).toBe("ABIERTA");
    expect(manualAlert!.source).toBe("MANUAL");
  });
});

describe("setThemeMode / setAccentColor", () => {
  it("updates theme mode", () => {
    const store = useAppStore.getState();
    store.setThemeMode("dark");
    const state = useAppStore.getState();
    expect(state.uiPreferences.themeMode).toBe("dark");
  });

  it("updates accent color", () => {
    const store = useAppStore.getState();
    store.setAccentColor("#ff0000");
    const state = useAppStore.getState();
    expect(state.uiPreferences.accentColor).toBe("#ff0000");
  });
});

describe("buildClientCaseSummaries", () => {
  it("builds summaries from transactions and alerts", () => {
    const transactions: Transaction[] = [
      {
        id: "txn-1",
        type: "BUY_IN",
        clientDisplayName: "Cliente Uno",
        clientHash: "hash-1",
        amount: 5000,
        paymentMethod: "EFECTIVO",
        risk: "VERDE",
        status: "COMPLETADA",
        createdAt: new Date().toISOString(),
        requiresKyc: true,
        requiresRte: false
      }
    ];

    const alerts: AlertItem[] = [
      {
        id: "alt-1",
        type: "PEP",
        title: "PEP alert",
        severity: "ALTA",
        risk: "AMARILLO",
        createdAt: new Date().toISOString(),
        description: "Test",
        clientHash: "hash-1",
        amount: 5000,
        status: "ABIERTA"
      }
    ];

    const summaries = buildClientCaseSummaries(transactions, alerts);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].clientHash).toBe("hash-1");
    expect(summaries[0].clientName).toBe("Cliente Uno");
    expect(summaries[0].transactions).toHaveLength(1);
    expect(summaries[0].alerts).toHaveLength(1);
  });

  it("handles empty data", () => {
    const summaries = buildClientCaseSummaries([], []);
    expect(summaries).toHaveLength(0);
  });

  it("handles transactions without matching hash in alerts", () => {
    const transactions: Transaction[] = [
      {
        id: "txn-2",
        type: "CASH_OUT",
        clientDisplayName: "Cliente Dos",
        clientHash: "hash-2",
        amount: 1000,
        paymentMethod: "EFECTIVO",
        risk: "VERDE",
        status: "COMPLETADA",
        createdAt: new Date().toISOString(),
        requiresKyc: false,
        requiresRte: false
      }
    ];

    const summaries = buildClientCaseSummaries(transactions, []);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].riskLevel).toBe("VERDE");
  });
});
