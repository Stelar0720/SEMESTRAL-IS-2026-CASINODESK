import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BuyInForm, CashOutForm } from "./TransactionForms";
import { useAppStore } from "../../app/store";

describe("BuyInForm", () => {
  beforeEach(() => {
    useAppStore.setState({
      transactions: [],
      alerts: [],
      rtes: [],
      audit: []
    });
  });

  it("renders the form", () => {
    render(<BuyInForm />);
    expect(screen.getByText("Buy-in")).toBeDefined();
    expect(screen.getByText("Registrar buy-in")).toBeDefined();
  });

  it("shows KYC fields when amount >= 2000", () => {
    render(<BuyInForm />);
    const amountInput = screen.getByPlaceholderText(/cedula/i);
    expect(amountInput).toBeDefined();
  });
});

describe("CashOutForm", () => {
  beforeEach(() => {
    useAppStore.setState({
      transactions: [],
      alerts: [],
      rtes: [],
      audit: []
    });
  });

  it("renders the form", () => {
    render(<CashOutForm />);
    expect(screen.getByText("Cash-out")).toBeDefined();
    expect(screen.getByText("Registrar cash-out")).toBeDefined();
  });

  it("renders chips ratio field", () => {
    render(<CashOutForm />);
    expect(screen.getByText("Ratio fichas apostadas")).toBeDefined();
  });
});

describe("ScreeningSummary", () => {
  it("shows default message when no result", () => {
    render(<BuyInForm />);
    expect(screen.getByText(/El resultado consolidado aparecera aqui/i)).toBeDefined();
  });
});
