import { h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { ThemeToggle } from "/dist/fluxaway-components-theme.js";

export function ThemeHeader({ themes, activeThemeId, onThemeChange }) {
  return h(
    "header",
    { className: "mt-header" },
    h(
      "div",
      { className: "m-container mt-header-inner" },
      h(
        "a",
        { className: "mt-brand", href: "../", ariaLabel: "Back to FluxaWay examples" },
        h(
          "span",
          { className: "mt-brand-mark" },
          h("img", { src: "/assets/brand/fluxaway-symbol-inverse.svg", alt: "" }),
        ),
        h(
          "span",
          { className: "mt-brand-copy" },
          h("strong", null, "FluxaWay"),
          h("small", null, "METALLIC SYSTEMS / STUDY 01"),
        ),
      ),
      h(
        "div",
        { className: "mt-theme-tools" },
        h(
          "div",
          { className: "mt-theme-picker", role: "group", ariaLabel: "Metallic theme direction" },
          themes.map((theme) =>
            h(
              Button,
              {
                key: theme.id,
                variant: theme.id === activeThemeId ? "contained" : "text",
                className: "mt-theme-button",
                ariaPressed: String(theme.id === activeThemeId),
                onClick: () => onThemeChange(theme.id),
              },
              theme.shortName,
            ),
          ),
        ),
        h(ThemeToggle, { className: "mt-mode-toggle" }),
      ),
    ),
  );
}
