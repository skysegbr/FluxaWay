import { h } from "/dist/fluxaway.js";
import { Badge, Button } from "/dist/fluxaway-components-core.js";

export function CommandHero({ theme }) {
  return h(
    "section",
    { className: "mt-hero", ariaLabelledby: "mt-hero-title" },
    h("div", { className: "mt-hero-glow", ariaHidden: "true" }),
    h(
      "div",
      { className: "mt-hero-copy" },
      h(Badge, { className: "mt-hero-badge" }, `DIRECTION / ${theme.label.toUpperCase()}`),
      h("p", { className: "mt-eyebrow" }, theme.eyebrow),
      h("h1", { id: "mt-hero-title" }, theme.title),
      h("p", { className: "mt-hero-lead" }, theme.description),
      h(
        "div",
        { className: "mt-hero-actions" },
        h(Button, { variant: "contained" }, theme.action),
        h(Button, { variant: "outline" }, theme.secondaryAction),
        h(
          Button,
          { variant: "outline", className: "mt-button-flow" },
          h("span", { className: "mt-button-flow-label" }, theme.flowAction),
        ),
      ),
    ),
    h(
      "div",
      { className: "mt-specimen", ariaLabel: `${theme.label} visual specimen` },
      h("span", { className: "mt-specimen-index" }, "FX / 01"),
      h("div", { className: "mt-specimen-orbit", ariaHidden: "true" },
        h("span", { className: "mt-orbit-core" }, theme.specimen),
        h("span", { className: "mt-orbit-dot mt-orbit-dot-one" }),
        h("span", { className: "mt-orbit-dot mt-orbit-dot-two" }),
      ),
      h(
        "div",
        { className: "mt-specimen-readout" },
        h("span", null, "MATERIAL"),
        h("strong", null, theme.material),
        h("span", null, "STATUS / CALIBRATED"),
      ),
    ),
  );
}
