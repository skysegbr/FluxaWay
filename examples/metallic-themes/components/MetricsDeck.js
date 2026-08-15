import { h } from "/dist/fluxaway.js";
import { Card } from "/dist/fluxaway-components-core.js";
import { METRICS } from "../data.js";

export function MetricsDeck() {
  return h(
    "section",
    { className: "mt-metrics", ariaLabel: "System metrics" },
    METRICS.map((metric, index) =>
      h(
        Card,
        { key: metric.label, className: `mt-metric mt-metric-${index + 1}` },
        h("span", { className: "mt-metric-code", ariaHidden: "true" }, metric.code),
        h("span", { className: "mt-metric-label" }, metric.label),
        h("strong", { className: "mt-metric-value" }, metric.value),
        h("span", { className: `mt-metric-delta ${metric.delta.startsWith("-") ? "is-down" : ""}` }, metric.delta),
      ),
    ),
  );
}
