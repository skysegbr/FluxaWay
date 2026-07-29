import { h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { ThemeToggle } from "/dist/fluxaway-components-theme.js";
import { RANGES } from "../data.js";

// One filter row, above everything it scopes — never a control inside a chart
// card. Every chart, KPI and table below re-renders against the same slice, so
// the numbers on screen always agree with each other.
export function DashboardFilters({ range, onRangeChange, onRefresh, onReplay, busy }) {
  return h(
    "div",
    { className: "db-filters" },
    h(
      "div",
      { className: "db-filter-group", role: "group", "aria-label": "Date range" },
      RANGES.map((r) =>
        h(
          "button",
          {
            key: r.id,
            type: "button",
            className: `db-range${r.id === range ? " db-range-active" : ""}`,
            "aria-pressed": String(r.id === range),
            onClick: () => onRangeChange(r.id),
          },
          r.label,
        ),
      ),
    ),
    h(
      "div",
      { className: "db-filter-actions" },
      h(Button, { variant: "text", onClick: onReplay }, "Replay animation"),
      h(Button, { variant: "tonal", onClick: onRefresh, disabled: busy },
        busy ? "Refreshing…" : "Refresh"),
      h(ThemeToggle, null),
    ),
  );
}
