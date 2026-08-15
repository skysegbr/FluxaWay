import { h } from "/dist/fluxaway.js";
import { Card } from "/dist/fluxaway-components-core.js";

export function ThemeBrief({ theme }) {
  return h(
    Card,
    { className: "mt-brief" },
    h(
      "div",
      { className: "mt-brief-copy" },
      h("p", null, "THEME DNA / LIVE TOKENS"),
      h("h2", null, `${theme.shortName} is more than an accent color.`),
      h(
        "ul",
        null,
        theme.principles.map((principle, index) =>
          h("li", { key: principle }, h("span", null, `0${index + 1}`), principle),
        ),
      ),
    ),
    h(
      "div",
      { className: "mt-swatches", ariaLabel: `${theme.shortName} palette` },
      theme.swatches.map((swatch) =>
        h(
          "div",
          { key: swatch.name, className: "mt-swatch" },
          h("span", { className: "mt-swatch-color", style: { backgroundColor: swatch.value } }),
          h("strong", null, swatch.name),
          h("code", null, swatch.value),
        ),
      ),
    ),
  );
}
