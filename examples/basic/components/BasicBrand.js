import { h, useTheme } from "/dist/fluxaway.js";

export function BasicBrand() {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/assets/brand/fluxaway-symbol-inverse.svg" : "/assets/brand/fluxaway-symbol.svg";

  return h(
    "div",
    { className: "m-brand basic-brand" },
    h(
      "span",
      { className: "m-brand-mark basic-brand-mark" },
      h("img", { src: logoSrc, alt: "", width: 64, height: 64 }),
    ),
    h("p", { className: "m-eyebrow" }, "FluxaWay"),
  );
}
