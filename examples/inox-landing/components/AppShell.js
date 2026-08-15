import { h } from "/dist/fluxaway.js";

export function AppShell({ children }) {
  return h(
    "div",
    { className: "il-page" },
    children,
    h(
      "footer",
      { className: "il-footer" },
      h("span", { className: "il-footer-mark", ariaHidden: "true" }, "FW"),
      h("p", null, "FluxaWay / Inox Protocol"),
      h("p", null, "Browser-native material study · 2026"),
    ),
  );
}
