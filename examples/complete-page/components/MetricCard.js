import { h } from "/dist/fluxaway.js";
import { Card, Chip } from "/dist/fluxaway-components-core.js";

export function MetricCard({ label, value, trend, active }) {
  return h(
    Card,
    { className: "metric-card" },
    h("p", { className: "workspace-kicker" }, label),
    h("strong", null, value),
    h(Chip, { active }, trend),
  );
}
