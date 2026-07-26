import { h } from "/dist/fluxaway.js";
import { Card } from "/dist/fluxaway-components-core.js";

export function FormSummary({ values }) {
  return h(
    Card,
    { className: "form-card form-summary" },
    h("h2", null, "Serialized values"),
    h("pre", null, JSON.stringify(values, null, 2)),
  );
}
