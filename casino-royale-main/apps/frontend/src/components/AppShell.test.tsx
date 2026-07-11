import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { useAppStore } from "../app/store";

describe("AppShell", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: {
        id: "u-1", fullName: "Test User", initials: "TU",
        role: "Cajero", station: "CAJA-01"
      },
      uiPreferences: { themeMode: "light", accentColor: "#d4af37" },
      transactions: [],
      alerts: [],
      rtes: [],
      ros: [],
      audit: []
    });
  });

  it("renders the app shell with header", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByText("CasinoDesk")).toBeDefined();
  });

  it("displays user info in header", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByText("Test User")).toBeDefined();
    expect(screen.getByText("Cajero")).toBeDefined();
  });

  it("renders navigation sidebar", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByText("Operacion")).toBeDefined();
    expect(screen.getByText("Gestion")).toBeDefined();
  });

  it("shows Buy-in shortcut button for Cajero", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByText("F1 Buy-in")).toBeDefined();
  });

  it("shows Cash-out shortcut button for Cajero", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByText("F2 Cash-out")).toBeDefined();
  });

  it("renders logout button", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByText("Cerrar sesion")).toBeDefined();
  });

  it("returns null when no session", () => {
    useAppStore.setState({ session: null });
    const { container } = render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows compliance section for Oficial", () => {
    useAppStore.setState({
      session: {
        id: "u-2", fullName: "Oficial Test", initials: "OT",
        role: "Oficial", station: "COMPLIANCE"
      }
    });
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    expect(screen.getByText("Cumplimiento")).toBeDefined();
  });
});
