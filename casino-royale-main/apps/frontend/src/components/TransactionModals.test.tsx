import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BuyInModal, CashOutModal, ManualAlertModal, ReceiptModal } from "./TransactionModals";
import { useAppStore } from "../app/store";

describe("ModalShell", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <BuyInModal isOpen={false} onClose={() => {}} onSuccess={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("BuyInModal", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: {
        id: "u-1", fullName: "Test", initials: "T",
        role: "Cajero", station: "CAJA-01"
      },
      transactions: [],
      alerts: [],
      rtes: [],
      audit: []
    });
  });

  it("renders when open", () => {
    render(<BuyInModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/Buy-in — Compra de fichas/)).toBeDefined();
  });

  it("shows step 1 initially", () => {
    render(<BuyInModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText("1. Umbral y canal operativo")).toBeDefined();
  });

  it("renders amount input", () => {
    render(<BuyInModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    const amountInput = screen.getByDisplayValue("2500");
    expect(amountInput).toBeDefined();
  });

  it("renders close button", () => {
    render(<BuyInModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />);
    const closeButton = screen.getByText("×");
    expect(closeButton).toBeDefined();
  });
});

describe("CashOutModal", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: {
        id: "u-1", fullName: "Test", initials: "T",
        role: "Cajero", station: "CAJA-01"
      },
      transactions: [],
      alerts: [],
      rtes: [],
      audit: []
    });
  });

  it("renders when open", () => {
    render(<CashOutModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Cash-out/)).toBeDefined();
  });

  it("shows ticket verification section", () => {
    render(<CashOutModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Cash-out.*Canje de tickets/)).toBeDefined();
  });
});

describe("ManualAlertModal", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: {
        id: "u-1", fullName: "Test", initials: "T",
        role: "Cajero", station: "CAJA-01"
      },
      alerts: [],
      audit: []
    });
  });

  it("renders when open", () => {
    render(<ManualAlertModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Alerta discreta/)).toBeDefined();
  });
});

describe("ReceiptModal", () => {
  it("renders when open", () => {
    render(<ReceiptModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText("Comprobante")).toBeDefined();
  });
});
