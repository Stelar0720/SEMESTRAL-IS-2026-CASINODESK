import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfilePage } from "./ProfilePage";
import { useAppStore } from "../../app/store";

describe("ProfilePage", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: {
        id: "u-1",
        fullName: "Test User",
        initials: "TU",
        role: "Administrador",
        station: "HQ"
      },
      backendAvailable: false,
      transactions: [],
      alerts: [],
      uiPreferences: { themeMode: "light", accentColor: "#d4af37" }
    });
  });

  it("renders user profile", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Test User")).toBeDefined();
    expect(screen.getByText("Administrador · HQ")).toBeDefined();
  });

  it("renders theme toggle buttons", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Claro")).toBeDefined();
    expect(screen.getByText("Oscuro")).toBeDefined();
  });

  it("changes theme mode when clicking Oscuro", () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Oscuro"));
    const state = useAppStore.getState();
    expect(state.uiPreferences.themeMode).toBe("dark");
  });

  it("changes theme mode when clicking Claro", () => {
    useAppStore.setState({ uiPreferences: { themeMode: "dark", accentColor: "#d4af37" } });
    render(<ProfilePage />);
    fireEvent.click(screen.getByText("Claro"));
    const state = useAppStore.getState();
    expect(state.uiPreferences.themeMode).toBe("light");
  });

  it("renders permission list", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Buy-in:")).toBeDefined();
    expect(screen.getByText("Cash-out:")).toBeDefined();
    expect(screen.getByText("Alerta manual:")).toBeDefined();
  });

  it("shows operational permissions restricted for admin", () => {
    render(<ProfilePage />);
    const restricted = screen.getAllByText("Restringido");
    expect(restricted.length).toBeGreaterThanOrEqual(2);
  });

  it("shows Modo demo when backend is not available", () => {
    render(<ProfilePage />);
    expect(screen.getByText("Modo demo")).toBeDefined();
  });

  it("shows Si when backend is available", () => {
    useAppStore.setState({ backendAvailable: true });
    render(<ProfilePage />);
    expect(screen.getByText("Si")).toBeDefined();
  });
});
