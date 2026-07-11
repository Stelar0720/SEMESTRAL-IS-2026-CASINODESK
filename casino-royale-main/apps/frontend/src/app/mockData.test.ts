import { describe, it, expect } from "vitest";
import {
  mockUsers,
  initialTransactions,
  initialAlerts,
  initialRtes,
  initialRos,
  initialAudit
} from "./mockData";

describe("mockData", () => {
  it("provides 4 mock users with all active roles", () => {
    expect(mockUsers).toHaveLength(4);
    const roles = mockUsers.map((u) => u.role);
    expect(roles).toContain("Cajero");
    expect(roles).toContain("Oficial");
    expect(roles).toContain("Supervisor");
    expect(roles).toContain("Administrador");
  });

  it("provides initial transactions", () => {
    expect(initialTransactions.length).toBeGreaterThan(0);
    expect(initialTransactions[0].id).toBeDefined();
    expect(initialTransactions[0].type).toBe("BUY_IN");
  });

  it("provides initial alerts", () => {
    expect(initialAlerts.length).toBeGreaterThan(0);
    expect(initialAlerts[0].type).toBeDefined();
  });

  it("provides initial RTE records", () => {
    expect(initialRtes).toHaveLength(1);
    expect(initialRtes[0].id).toBe("rte-001");
  });

  it("provides initial ROS records", () => {
    expect(initialRos).toHaveLength(1);
    expect(initialRos[0].status).toBe("ENVIADO");
  });

  it("provides initial audit events", () => {
    expect(initialAudit).toHaveLength(2);
  });
});
