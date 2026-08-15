import { h } from "/dist/fluxaway.js";
import { BUTTON_EFFECTS, Button, Card } from "/dist/fluxaway-components-core.js";
import { BUTTON_EFFECT_DETAILS } from "../data.js";

export function ButtonLab() {
  return h(
    "section",
    { className: "mt-button-lab", ariaLabelledby: "mt-button-lab-title" },
    h(
      "div",
      { className: "mt-button-lab-heading" },
      h("div", null,
        h("p", null, "INTERACTION MATERIALS / 09"),
        h("h2", { id: "mt-button-lab-title" }, "Buttons with a FluxaWay signature."),
      ),
      h(
        "p",
        { className: "mt-button-lab-intro" },
        "Nine motion studies built from the same frame, metal, signal, and flow vocabulary.",
      ),
    ),
    h(
      "div",
      { className: "mt-button-lab-grid" },
      BUTTON_EFFECTS.map((effect, index) => {
        const details = BUTTON_EFFECT_DETAILS[effect];
        return h(
          Card,
          { key: effect, className: "mt-button-effect" },
          h(
            "div",
            { className: "mt-button-preview" },
            h(
              Button,
              {
                variant: "outline",
                effect,
              },
              details.label,
            ),
          ),
          h("span", { className: "mt-button-effect-index" }, String(index + 1).padStart(2, "0")),
          h("h3", null, details.name),
          h("p", null, details.description),
        );
      }),
    ),
  );
}
