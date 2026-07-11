import { useEffect } from "react";
import { useAppStore } from "./store";

export function ThemeInitializer() {
  const uiPreferences = useAppStore((state) => state.uiPreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = uiPreferences.themeMode;
    root.style.setProperty("--accent-gold", uiPreferences.accentColor);

    const hex = uiPreferences.accentColor.replace("#", "");
    const normalized = hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
    const red = Number.parseInt(normalized.slice(0, 2), 16) || 212;
    const green = Number.parseInt(normalized.slice(2, 4), 16) || 175;
    const blue = Number.parseInt(normalized.slice(4, 6), 16) || 55;

    root.style.setProperty("--accent-rgb", `${red}, ${green}, ${blue}`);
    root.style.setProperty("--accent-gold-dim", `rgba(${red}, ${green}, ${blue}, 0.14)`);
  }, [uiPreferences]);

  return null;
}
