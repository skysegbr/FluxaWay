import { h, useTheme } from "/dist/fluxaway.js";
import { ThemeToggle } from "/dist/fluxaway-components-theme.js";

export function BasicTopbar() {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/assets/brand/fluxaway-symbol-inverse.svg" : "/assets/brand/fluxaway-symbol.svg";

  return h(
    "header",
    { className: "basic-topbar" },
    h(
      "span",
      { className: "basic-topbar-brand" },
      h("img", { src: logoSrc, alt: "", width: 24, height: 24 }),
      "FluxaWay",
    ),
    h(ThemeToggle, null),
  );
}
