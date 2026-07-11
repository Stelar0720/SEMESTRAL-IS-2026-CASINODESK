import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OperatorDashboardPage } from "./OperatorDashboardPage";
import { useAppStore } from "../../app/store";
import type { Transaction, AlertItem } from "../../app/types";

vi.mock("../../components/AppShell", () => ({
  useAppChrome: () => ({ openModal: vi.fn(), closeModal: vi.fn() })
}));

describe("OperatorDashboardPage", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: {
        id: "u-1",
        fullName: "Test User",
        initials: "TU",
        role: "Cajero",
        station: "CAJA-01"
      },
      transactions: [],
      alerts: [],
      rtes: []
    });
  });

  it("renders the cashier dashboard title", () => {
    render(
      <MemoryRouter>
        <OperatorDashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Caja operativa con KYC condicional y RTE obligatorio")).toBeDefined();
  });

  it("displays transaction count", () => {
    const transactions: Transaction[] = [
      {
        id: "txn-1", type: "BUY_IN", clientDisplayName: "Test", clientHash: "abc",
        amount: 1000, paymentMethod: "EFECTIVO", risk: "VERDE", status: "COMPLETADA",
        createdAt: new Date().toISOString(), requiresKyc: false, requiresRte: false
      }
    ];
    useAppStore.setState({ transactions });
    render(
      <MemoryRouter>
        <OperatorDashboardPage />
      </MemoryRouter>
    );
    const stats = screen.getAllByText(/^\d+$/);
    expect(stats.length).toBeGreaterThan(0);
  });

  it("displays alert count", () => {
    const alerts: AlertItem[] = [
      {
        id: "alt-1", type: "AML", title: "Test alert", severity: "CRITICA",
        risk: "ROJO", createdAt: new Date().toISOString(), description: "Test",
        clientHash: "abc", amount: 5000, status: "ABIERTA"
      }
    ];
    useAppStore.setState({ alerts });
    render(
      <MemoryRouter>
        <OperatorDashboardPage />
      </MemoryRouter>
    );
    const stats = screen.getAllByText(/^\d+$/);
    expect(stats.length).toBeGreaterThan(0);
  });

  it("renders system AML status", () => {
    render(
      <MemoryRouter>
        <OperatorDashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Sistema AML activo")).toBeDefined();
  });

  it("renders action buttons", () => {
    render(
      <MemoryRouter>
        <OperatorDashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Buy-in")).toBeDefined();
    expect(screen.getByText("Cash-out")).toBeDefined();
  });
});
