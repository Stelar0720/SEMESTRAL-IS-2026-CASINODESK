import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it("renders green state with class badge-green", () => {
    const { container } = render(<RiskBadge risk="VERDE" />);
    expect(screen.getByText("VERDE")).toBeDefined();
    expect(container.querySelector(".badge-green")).toBeTruthy();
  });

  it("renders yellow state with class badge-yellow", () => {
    const { container } = render(<RiskBadge risk="AMARILLO" />);
    expect(screen.getByText("AMARILLO")).toBeDefined();
    expect(container.querySelector(".badge-yellow")).toBeTruthy();
  });

  it("renders red state with class badge-red", () => {
    const { container } = render(<RiskBadge risk="ROJO" />);
    expect(screen.getByText("ROJO")).toBeDefined();
    expect(container.querySelector(".badge-red")).toBeTruthy();
  });

  it("renders correct dot class for each risk level", () => {
    const { container: greenContainer } = render(<RiskBadge risk="VERDE" />);
    expect(greenContainer.querySelector(".risk-green")).toBeTruthy();

    const { container: yellowContainer } = render(<RiskBadge risk="AMARILLO" />);
    expect(yellowContainer.querySelector(".risk-yellow")).toBeTruthy();

    const { container: redContainer } = render(<RiskBadge risk="ROJO" />);
    expect(redContainer.querySelector(".risk-red")).toBeTruthy();
  });
});
