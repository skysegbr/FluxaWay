import { h } from "/dist/fluxaway.js";
import { BarChart } from "/dist/fluxaway-charts.js";

// US states are NOMINAL categories — swapping their order changes nothing — so
// every bar takes the same slot-1 hue. Coloring them by value would re-encode
// what the bar length already shows. Horizontal, because the labels are names.
export function RecallStateBars({ byState }) {
  return h(BarChart, {
    data: byState,
    x: "term",
    y: "count",
    label: "Top states",
    horizontal: true,
    height: Math.max(180, byState.length * 30 + 40),
    animate: true,
    xLabel: "State",
    emptyMessage: "No recalls match the current filters.",
    ariaLabel: "Recalls by state",
  });
}
