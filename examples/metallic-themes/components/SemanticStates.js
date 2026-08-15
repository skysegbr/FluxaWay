import { h } from "/dist/fluxaway.js";
import { Alert, Badge, Button, Card } from "/dist/fluxaway-components-core.js";
import { TextField } from "/dist/fluxaway-components-forms.js";

export function SemanticStates({ alerts, buttons, statuses }) {
  return h(
    "section",
    { className: "mt-semantic-states", ariaLabelledby: "mt-semantic-title" },
    h(
      "div",
      { className: "mt-semantic-heading" },
      h(
        "div",
        null,
        h("p", null, "SYSTEM LANGUAGE / SEMANTIC STATES"),
        h("h2", { id: "mt-semantic-title" }, "Material meets meaning."),
      ),
      h(
        "p",
        { className: "mt-semantic-intro" },
        "The active metal defines identity and interaction. Universal state colors keep every action and message immediately understandable.",
      ),
    ),
    h(
      Card,
      { className: "mt-semantic-panel mt-semantic-buttons" },
      h(
        "div",
        { className: "mt-semantic-panel-heading" },
        h("span", null, "01 / ACTION HIERARCHY"),
        h("h3", null, "One material, five levels of intent."),
        h("p", null, "Brand color leads normal actions. Danger leaves the material palette and keeps its semantic red."),
      ),
      h(
        "div",
        { className: "mt-semantic-button-row" },
        buttons.map((button) =>
          h(
            Button,
            {
              key: button.id,
              variant: button.variant,
              className: "mt-semantic-button",
            },
            button.label,
          ),
        ),
      ),
    ),
    h(
      "div",
      { className: "mt-semantic-grid" },
      h(
        Card,
        { className: "mt-semantic-panel mt-semantic-alert-panel" },
        h(
          "div",
          { className: "mt-semantic-panel-heading" },
          h("span", null, "02 / FEEDBACK"),
          h("h3", null, "State colors stay recognizable."),
          h("p", null, "A metallic hairline connects the alerts to the active theme without changing their meaning."),
        ),
        h(
          "div",
          { className: "mt-semantic-alert-grid" },
          alerts.map((alert) =>
            h(
              Alert,
              {
                key: alert.id,
                variant: alert.variant,
                className: "mt-semantic-alert",
                role: alert.variant === "danger" ? "alert" : "status",
              },
              h("strong", null, alert.title),
              h("span", null, alert.message),
            ),
          ),
        ),
      ),
      h(
        Card,
        { className: "mt-semantic-panel mt-semantic-validation" },
        h(
          "div",
          { className: "mt-semantic-panel-heading" },
          h("span", null, "03 / STATUS + VALIDATION"),
          h("h3", null, "Small signals remain explicit."),
          h("p", null, "Badges and fields use semantic tokens because these colors communicate system state, not decoration."),
        ),
        h(
          "div",
          { className: "mt-semantic-statuses", ariaLabel: "System statuses" },
          statuses.map((status) =>
            h(
              Badge,
              {
                key: status.id,
                className: `mt-semantic-badge mt-semantic-badge-${status.tone}`,
              },
              h("span", { ariaHidden: "true" }),
              status.label,
            ),
          ),
        ),
        h(TextField, {
          id: "mt-endpoint",
          className: "mt-semantic-field",
          label: "Deployment endpoint",
          value: "edge://relay-07",
          error: "Integrity signature does not match the approved build.",
          readOnly: true,
        }),
        h(
          "div",
          { className: "mt-semantic-rule" },
          h("span", { ariaHidden: "true" }, "◆"),
          h("p", null, h("strong", null, "Design rule"), " Material identifies. Color communicates state."),
        ),
      ),
    ),
  );
}
