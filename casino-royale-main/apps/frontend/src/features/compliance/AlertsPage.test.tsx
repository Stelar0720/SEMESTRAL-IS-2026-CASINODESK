import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertsPage } from "./AlertsPage";
import { useAppStore } from "../../app/store";
import type { AlertItem } from "../../app/types";

const mockAlerts: AlertItem[] = [
  {
    id: "alt-1", type: "AML", title: "Coincidencia OFAC", severity: "CRITICA",
    risk: "ROJO", createdAt: new Date().toISOString(),
    description: "Test description", clientHash: "abc123",
    amount: 5000, status: "ABIERTA", source: "AUTOMATICA"
  },
  {
    id: "alt-2", type: "PEP", title: "PEP test", severity: "ALTA",
    risk: "AMARILLO", createdAt: new Date().toISOString(),
    description: "PEP description", clientHash: "def456",
    amount: 3000, status: "EN_REVISION", source: "AUTOMATICA"
  },
  {
    id: "alt-3", type: "MANUAL", title: "Manual alert", severity: "ALTA",
    risk: "AMARILLO", createdAt: new Date().toISOString(),
    description: "Manual description", clientHash: "ghi789",
    amount: 1000, status: "ABIERTA", source: "MANUAL"
  }
];

describe("AlertsPage", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: {
        id: "u-1", fullName: "Oficial Test", initials: "OT",
        role: "Oficial", station: "COMPLIANCE"
      },
      alerts: mockAlerts
    });
  });

  it("renders alert list", () => {
    render(<AlertsPage />);
    expect(screen.getByText("Bandeja privada de alertas")).toBeDefined();
    expect(screen.getByText("AML")).toBeDefined();
  });

  it("renders filter chips", () => {
    render(<AlertsPage />);
    expect(screen.getByText("Todas")).toBeDefined();
    expect(screen.getByText("Criticas")).toBeDefined();
    expect(screen.getAllByText("PEP").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Fraccionamiento")).toBeDefined();
    expect(screen.getByText("Manuales")).toBeDefined();
  });

  it("filters by Criticas", () => {
    render(<AlertsPage />);
    fireEvent.click(screen.getByText("Criticas"));
    expect(screen.getByText("AML")).toBeDefined();
    expect(screen.queryByText("PEP test")).toBeNull();
  });

  it("filters by PEP", () => {
    render(<AlertsPage />);
    fireEvent.click(screen.getAllByText("PEP")[0]);
    expect(screen.queryByText("AML")).toBeNull();
  });

  it("filters by Manuales", () => {
    render(<AlertsPage />);
    fireEvent.click(screen.getByText("Manuales"));
    expect(screen.getByText("Manual alert")).toBeDefined();
    expect(screen.queryByText("AML")).toBeNull();
  });

  it("shows detail of selected alert", () => {
    render(<AlertsPage />);
    expect(screen.getByText("Coincidencia OFAC")).toBeDefined();
    expect(screen.getByText("Test description")).toBeDefined();
  });

  it("shows ROS creation button for Oficial", () => {
    render(<AlertsPage />);
    expect(screen.getByText("Crear ROS confidencial")).toBeDefined();
  });

  it("shows alert close button with justification", () => {
    render(<AlertsPage />);
    expect(screen.getByText("Cerrar alerta con justificacion")).toBeDefined();
  });
});
