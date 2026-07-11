import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ThemeInitializer } from "./ThemeInitializer";
import { useAppStore } from "./store";

describe("ThemeInitializer", () => {
  beforeEach(() => {
    useAppStore.setState({
      uiPreferences: { themeMode: "light", accentColor: "#d4af37" }
    });
    document.documentElement.dataset.theme = "";
    document.documentElement.style.removeProperty("--accent-gold");
    document.documentElement.style.removeProperty("--accent-rgb");
    document.documentElement.style.removeProperty("--accent-gold-dim");
  });

  it("renders null without crashing", () => {
    const { container } = render(<ThemeInitializer />);
    expect(container.firstChild).toBeNull();
  });

  it("applies theme to documentElement", () => {
    render(<ThemeInitializer />);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("applies accent color CSS variables", () => {
    render(<ThemeInitializer />);
    expect(document.documentElement.style.getPropertyValue("--accent-gold")).toBe("#d4af37");
  });

  it("computes RGB from accent color", () => {
    render(<ThemeInitializer />);
    const rgb = document.documentElement.style.getPropertyValue("--accent-rgb");
    expect(rgb).toBe("212, 175, 55");
  });

  it("handles dark theme", () => {
    useAppStore.setState({
      uiPreferences: { themeMode: "dark", accentColor: "#0f9d8a" }
    });
    render(<ThemeInitializer />);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--accent-gold")).toBe("#0f9d8a");
  });

  it("handles 3-digit hex color", () => {
    useAppStore.setState({
      uiPreferences: { themeMode: "light", accentColor: "#fff" }
    });
    render(<ThemeInitializer />);
    const rgb = document.documentElement.style.getPropertyValue("--accent-rgb");
    expect(rgb).toBe("255, 255, 255");
  });
});
