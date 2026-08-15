/*!
 * FluxaWay Metallic — experimental material selector.
 * Load fluxaway-metallic.css alongside fluxaway-ui.css, select the
 * "metallic" design with useDesign(), then use this hook to change finish.
 */
import { useEffect, useState } from "./fluxaway.js";

export const METAL_THEMES = Object.freeze([
  "aurum",
  "cobalt",
  "cobalt-aurum",
  "inox",
  "bronze",
  "ferrum",
  "black-inox",
]);

export function useMetalTheme() {
  const getResolved = () => {
    try {
      const stored = localStorage.getItem("fluxaway-metal-theme");
      if (METAL_THEMES.includes(stored)) return stored;
    } catch {}
    return "aurum";
  };

  const [metalTheme, setMetalThemeState] = useState(getResolved);

  useEffect(() => {
    document.documentElement.setAttribute("data-metal-theme", metalTheme);
    try { localStorage.setItem("fluxaway-metal-theme", metalTheme); } catch {}
  }, [metalTheme]);

  useEffect(() => {
    const handler = (event) => {
      if (METAL_THEMES.includes(event.detail)) setMetalThemeState(event.detail);
    };
    window.addEventListener("fluxaway:metalthemechange", handler);
    return () => window.removeEventListener("fluxaway:metalthemechange", handler);
  }, []);

  const setMetalTheme = (next) => {
    if (!METAL_THEMES.includes(next)) return;
    setMetalThemeState(next);
    window.dispatchEvent(new CustomEvent("fluxaway:metalthemechange", { detail: next }));
  };

  return { metalTheme, metalThemes: METAL_THEMES, setMetalTheme };
}
