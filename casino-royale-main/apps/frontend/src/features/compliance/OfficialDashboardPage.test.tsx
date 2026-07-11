import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfficialDashboardPage } from "./OfficialDashboardPage";
import { useAppStore } from "../../app/store";

describe("OfficialDashboardPage", () => {
  beforeEach(() => {
    useAppStore.setState({
      alerts: [],
      rtes: [],
      ros: [],
      transactions: []
    });
  });

  it("renders the official dashboard heading", () => {
    render(<OfficialDashboardPage />);
    expect(screen.getByText("Panel privado del oficial")).toBeDefined();
  });

  it("displays stat cards", () => {
    render(<OfficialDashboardPage />);
    expect(screen.getByText("Alertas abiertas")).toBeDefined();
    expect(screen.getByText("RTE pendientes")).toBeDefined();
    expect(screen.getByText("ROS generados")).toBeDefined();
    expect(screen.getByText("Salud de integraciones")).toBeDefined();
  });

  it("shows 0 alerts when none open", () => {
    render(<OfficialDashboardPage />);
    const zeroElements = screen.getAllByText("0");
    expect(zeroElements.length).toBeGreaterThanOrEqual(2);
  });

  it("renders RTE section", () => {
    render(<OfficialDashboardPage />);
    expect(screen.getByText("Bandeja RTE")).toBeDefined();
  });

  it("renders client cases section", () => {
    render(<OfficialDashboardPage />);
    expect(screen.getByText("Casos consolidados del cliente")).toBeDefined();
  });
});
