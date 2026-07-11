import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionPage } from "./SessionPage";
import { useAppStore } from "../../app/store";

describe("SessionPage", () => {
  beforeEach(() => {
    useAppStore.setState({
      transactions: [],
      alerts: [],
      session: {
        id: "u-1", fullName: "Test", initials: "T",
        role: "Cajero", station: "CAJA-01"
      }
    });
  });

  it("renders the page title", () => {
    render(<SessionPage />);
    expect(screen.getByText("Sesion consolidada del cliente")).toBeDefined();
  });
});
