import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SupervisorDashboardPage } from "./SupervisorDashboardPage";
import { useAppStore } from "../../app/store";

vi.mock("../../components/AppShell", () => ({
  useAppChrome: () => ({ openModal: vi.fn(), closeModal: vi.fn() })
}));

describe("SupervisorDashboardPage", () => {
  beforeEach(() => {
    useAppStore.setState({
      transactions: [],
      alerts: []
    });
  });

  it("renders the supervisor dashboard", () => {
    render(<SupervisorDashboardPage />);
    expect(screen.getByText("Vigilancia de sala y escalamiento interno")).toBeDefined();
    expect(screen.getByText("Buy-in en mesa")).toBeDefined();
  });
});
