import { h } from "/dist/fluxaway.js";
import { Button, Card } from "/dist/fluxaway-components-core.js";
import { BUTTON_EFFECTS } from "../data.js";

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
      BUTTON_EFFECTS.map((effect, index) =>
        h(
          Card,
          { key: effect.id, className: "mt-button-effect" },
          h(
            "div",
            { className: "mt-button-preview" },
            h(
              Button,
              {
                variant: "outline",
                className: `mt-fx-button mt-fx-${effect.id} ${effect.id === "reflection" ? "mt-button-flow" : ""}`,
              },
              h(
                "span",
                {
                  className: `mt-fx-label ${effect.id === "reflection" ? "mt-button-flow-label" : ""}`,
                },
                effect.label,
              ),
            ),
          ),
          h("span", { className: "mt-button-effect-index" }, String(index + 1).padStart(2, "0")),
          h("h3", null, effect.name),
          h("p", null, effect.description),
        ),
      ),
    ),
  );
}
