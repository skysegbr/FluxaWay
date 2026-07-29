import { Fragment, h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import {
  AreaChart, BarChart, ChartCard, DonutChart, DumbbellChart, Heatmap, LineChart,
  Meter, ScatterChart, exportCSV, exportPNG,
} from "/dist/fluxaway-charts.js";
import { LOAD_TIMES, VARIANCE } from "../data.js";

// Operations: values measured against a baseline or a limit.
export function OpsCards({ animate, busy }) {
  return h(
    Fragment,
    null,
    h(
        ChartCard,
        {
          title: "Budget variance",
          subtitle: "Against plan — colour carries distance from zero, not team identity",
          loading: busy,
        },
        h(BarChart, {
          data: VARIANCE,
          x: "team",
          y: "delta",
          horizontal: true,
          diverging: true,
          height: 240,
          animate,
          xLabel: "Team",
          format: (n) => `${Number(n) > 0 ? "+" : ""}${n}%`,
          tickFormat: (n) => `${n}%`,
        }),
      ),
    h(
        ChartCard,
        {
          title: "Page load time",
          subtitle: "Before and after the optimisation work — the bar is the change",
          loading: busy,
        },
        h(DumbbellChart, {
          data: LOAD_TIMES,
          x: "page",
          from: "before",
          to: "after",
          fromLabel: "Before",
          toLabel: "After",
          format: (n) => `${Number(n).toFixed(1)}s`,
          tickFormat: (n) => `${n}s`,
          xLabel: "Page",
        }),
      ),
    h(
        ChartCard,
        { title: "Capacity", subtitle: "Against the plan limit", loading: busy },
        h(
          "div",
          { className: "db-meters" },
          h(Meter, { label: "Seats", value: 168, max: 200 }),
          h(Meter, { label: "API calls", value: 940_000, max: 1_000_000 }),
          h(Meter, { label: "Storage (GB)", value: 240, max: 500 }),
        ),
      ),
  );
}
