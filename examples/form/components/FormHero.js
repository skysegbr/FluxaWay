import { h, useTheme } from "/dist/fluxaway.js";
import { ThemeToggle } from "/dist/fluxaway-components-theme.js";

export function FormHero() {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/assets/brand/fluxaway-symbol-inverse.svg" : "/assets/brand/fluxaway-symbol.svg";

  return h(
    "header",
    { className: "form-hero" },
    h("div", { className: "form-hero-topbar" }, h(ThemeToggle, null)),
    h(
      "span",
      { className: "form-logo" },
      h("img", { src: logoSrc, alt: "FluxaWay" }),
    ),
    h("p", { className: "form-kicker" }, "Forms"),
    h("h1", null, "Validated contact flow"),
    h(
      "p",
      null,
      "FluxaWay form with no build step — controlled fields, per-field errors, loading on submit and serialized output.",
    ),
  );
}
