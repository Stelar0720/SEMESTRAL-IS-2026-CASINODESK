import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistoryPage } from "./HistoryPage";
import { useAppStore } from "../../app/store";

describe("HistoryPage", () => {
  beforeEach(() => {
    useAppStore.setState({ transactions: [], audit: [] });
  });

  it("renders the page title", () => {
    render(<HistoryPage />);
    expect(screen.getByText("Trazabilidad y auditoria")).toBeDefined();
  });
});
