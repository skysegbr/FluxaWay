import { h } from "/dist/fluxaway.js";
import { Card } from "/dist/fluxaway-components-core.js";
import { MetricCard, MetricRow, formatNumber } from "/dist/fluxaway-charts.js";

// A handful of headline numbers is a KPI ROW of stat tiles — not a grouped bar
// chart with one bar each. MetricRow is the auto-fitting track; each tile keeps
// the card surface it had before.
export function RecallMetrics({ total, byClassification, byStatus }) {
  const classCount = (label) => byClassification.find((c) => c.term === label)?.count ?? 0;
  const statusCount = (label) => byStatus.find((c) => c.term === label)?.count ?? 0;

  const metrics = [
    { label: "Matching recalls", value: total, tone: "" },
    { label: "Class I — most serious", value: classCount("Class I"), tone: "dr-metric-danger" },
    { label: "Class II — moderate", value: classCount("Class II"), tone: "dr-metric-warning" },
    { label: "Ongoing right now", value: statusCount("Ongoing"), tone: "" },
  ];

  return h(
    MetricRow,
    { min: 180 },
    metrics.map((m) =>
      h(
        Card,
        { key: m.label, className: `dr-metric ${m.tone}`.trim() },
        // countUp rides the motion ticker already loaded by the charts add-on.
        h(MetricCard, { label: m.label, value: m.value, format: formatNumber, countUp: true }),
      ),
    ),
  );
}
