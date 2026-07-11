import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RoleHomePage } from "./RoleHomePage";
import { useAppStore } from "../../app/store";

vi.mock("../../components/AppShell", () => ({
  useAppChrome: () => ({ openModal: vi.fn(), closeModal: vi.fn() })
}));

describe("RoleHomePage", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: null,
      transactions: [],
      alerts: [],
      rtes: []
    });
  });

  it("redirects to auth when no session", () => {
    const { container } = render(
      <MemoryRouter>
        <RoleHomePage />
      </MemoryRouter>
    );
    expect(screen.queryByText("Caja operativa")).toBeNull();
  });

  it("renders OperatorDashboardPage for Cajero", () => {
    useAppStore.setState({
      session: {
        id: "u-1", fullName: "Test", initials: "T",
        role: "Cajero", station: "CAJA-01"
      }
    });
    render(
      <MemoryRouter>
        <RoleHomePage />
      </MemoryRouter>
    );
    expect(screen.getByText("Caja operativa con KYC condicional y RTE obligatorio")).toBeDefined();
  });
});
