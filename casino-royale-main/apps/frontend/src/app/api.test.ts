import { describe, it, expect, beforeEach, vi } from "vitest";
import { login, setToken, clearToken, getTransactions } from "./api";

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("setToken / clearToken", () => {
  it("stores token in localStorage", () => {
    setToken("test-token-123");
    expect(localStorage.getItem("casinodesk.accessToken")).toBe("test-token-123");
  });

  it("clears token from localStorage", () => {
    setToken("test-token-123");
    clearToken();
    expect(localStorage.getItem("casinodesk.accessToken")).toBeNull();
  });
});

describe("login", () => {
  it("sends POST request to /auth/login", async () => {
    const mockResponse = {
      accessToken: "jwt-token",
      refreshToken: "refresh-token",
      fullName: "Test User",
      role: "Cajero",
      station: "CAJA-01"
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await login({ username: "cajero", password: "demo" });
    expect(result.accessToken).toBe("jwt-token");
    expect(result.role).toBe("Cajero");
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "cajero", password: "demo" })
      })
    );
  });

  it("throws on failed login", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized")
    });

    await expect(login({ username: "wrong", password: "wrong" })).rejects.toThrow();
  });
});

describe("getTransactions", () => {
  it("returns mapped transactions", async () => {
    const mockBackendTransactions = [
      {
        id: "txn-1",
        type: "BuyIn",
        clientName: "Juan Perez",
        clientHash: "abc123",
        amount: 2500,
        paymentMethod: "Efectivo",
        riskLevel: "Verde",
        status: "Completada",
        requiresKyc: true,
        requiresRte: false,
        chipsPlayedRatio: null,
        createdAt: "2026-01-01T00:00:00Z"
      }
    ];

    setToken("valid-token");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBackendTransactions)
    });

    const transactions = await getTransactions();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe("BUY_IN");
    expect(transactions[0].status).toBe("COMPLETADA");
    expect(transactions[0].paymentMethod).toBe("EFECTIVO");
  });
});
