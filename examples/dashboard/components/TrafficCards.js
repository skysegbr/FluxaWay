import { Fragment, h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import {
  AreaChart, BarChart, ChartCard, DonutChart, DumbbellChart, Heatmap, LineChart,
  Meter, ScatterChart, exportCSV, exportPNG,
} from "/dist/fluxaway-charts.js";
import { dayLabel, TRAFFIC_GRID } from "../data.js";

// Volume over time: the headline series, then when it happens.
export function TrafficCards({ rows, animate, busy, visitsRef }) {
  return h(
    Fragment,
    null,
    h(
        ChartCard,
        {
          title: "Visits",
          subtitle: "Daily sessions — drag across the plot to zoom in",
          span: 2,
          loading: busy,
          ref: visitsRef,
          actions: h(
            "div",
            { className: "db-card-actions" },
            h(Button, {
              variant: "text",
              onClick: () => exportCSV(
                { data: rows, x: "date", y: "visits", label: "Visits", xLabel: "Day" },
                { filename: "visits.csv" },
              ),
            }, "CSV"),
            h(Button, {
              variant: "text",
              onClick: () => exportPNG(visitsRef.current, { filename: "visits.png" }),
            }, "PNG"),
          ),
        },
        h(AreaChart, {
          data: rows,
          x: "date",
          y: "visits",
          label: "Visits",
          height: 280,
          animate,
          brush: true,
          xTickFormat: dayLabel,
          xLabel: "Day",
        }),
      ),
    h(
        ChartCard,
        { title: "Signups", subtitle: "Daily — its own scale, deliberately not sharing the revenue axis", loading: busy },
        h(LineChart, {
          data: rows,
          x: "date",
          series: [{ key: "signups", label: "Signups" }],
          height: 220,
          animate,
          xTickFormat: dayLabel,
          xLabel: "Day",
        }),
      ),
    h(
        ChartCard,
        { title: "Revenue", subtitle: "Daily, USD", loading: busy },
        h(LineChart, {
          data: rows,
          x: "date",
          series: [{ key: "revenue", label: "Revenue", slot: 3 }],
          height: 220,
          animate,
          xTickFormat: dayLabel,
          xLabel: "Day",
          format: (n) => `$${Number(n).toLocaleString()}`,
        }),
      ),
    h(
        ChartCard,
        {
          title: "When people visit",
          subtitle: "Sessions by weekday and hour — one hue, stronger means more",
          span: 2,
          loading: busy,
        },
        h(Heatmap, {
          data: TRAFFIC_GRID,
          x: "hour",
          y: "day",
          value: "sessions",
          label: "Sessions",
          showValues: true,
          xTickFormat: (hh) => `${hh}:00`,
        }),
      ),
  );
}
