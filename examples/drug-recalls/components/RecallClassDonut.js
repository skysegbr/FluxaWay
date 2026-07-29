import { h } from "/dist/fluxaway.js";
import { DonutChart } from "/dist/fluxaway-charts.js";
import { CLASSIFICATION_COLORS } from "../data.js";

// Recall classes are a SEVERITY scale, not a set of peer categories, so the
// slices keep the status tokens (danger / warning / info) instead of taking
// categorical palette slots — `sliceColor` is exactly that override.
export function RecallClassDonut({ byClassification }) {
  const total = byClassification.reduce((sum, c) => sum + c.count, 0);

  return h(DonutChart, {
    data: byClassification,
    x: "term",
    y: "count",
    label: "By classification",
    height: 220,
    animate: true,
    sliceColor: (row) => CLASSIFICATION_COLORS[row?.term],
    centerLabel: { value: total.toLocaleString(), label: "recalls" },
    emptyMessage: "No recalls match the current filters.",
    ariaLabel: "Recalls by classification",
  });
}
