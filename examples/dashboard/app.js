import { h, render, useEffect, useMemo, useState } from "/dist/fluxaway.js";
import {
  AreaChart, BarChart, ChartCard, DashboardGrid, DonutChart, LineChart, Meter,
} from "/dist/fluxaway-charts.js";
import { DashboardFilters } from "./components/DashboardFilters.js";
import { KpiRow } from "./components/KpiRow.js";
import {
  buildSeries, CHANNELS, dayLabel, PLAN_SERIES, REGIONS, sum,
} from "./data.js";

function App() {
  const [range, setRange] = useState("30d");
  const [busy, setBusy] = useState(false);
  // Bumping this replays every entrance — see `animate.key` below.
  const [run, setRun] = useState(0);

  const { rows } = useMemo(() => buildSeries(range), [range]);

  // Simulated refetch: the charts HOLD their previous render at reduced
  // opacity while it runs (ChartCard's `loading`), instead of flashing a
  // skeleton and jumping the layout.
  const refresh = () => setBusy(true);
  useEffect(() => {
    if (!busy) return undefined;
    const timer = setTimeout(() => setBusy(false), 900);
    return () => clearTimeout(timer);
  }, [busy]);

  const totalSessions = CHANNELS.reduce((total, c) => total + c.sessions, 0);
  const animate = { key: `${range}-${run}` };

  return h(
    "div",
    { className: "db-app" },
    h(
      "header",
      { className: "db-header" },
      h("h1", null, "Acme Analytics"),
      h("p", null, "Sample dashboard built with fluxaway-charts — no build step, no chart library."),
    ),
    h(
      "main",
      { className: "m-container db-main" },
      h(DashboardFilters, {
        range,
        onRangeChange: setRange,
        onRefresh: refresh,
        onReplay: () => setRun((n) => n + 1),
        busy,
      }),

      h(KpiRow, { rows, animateKey: animate.key }),

      h(
        DashboardGrid,
        { min: 360 },
        // Two measures of very different magnitude — visits in the thousands,
        // signups in the hundreds — so they are TWO charts, never one plot
        // with two y-scales.
        h(
          ChartCard,
          { title: "Visits", subtitle: "Daily sessions", span: 2, loading: busy },
          h(AreaChart, {
            data: rows,
            x: "date",
            y: "visits",
            label: "Visits",
            height: 280,
            animate,
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
            title: "Acquisition channels",
            subtitle: "Nine channels, six slices — the tail folds into “Other”",
            loading: busy,
          },
          h(DonutChart, {
            data: CHANNELS,
            x: "channel",
            y: "sessions",
            label: "Sessions by channel",
            height: 230,
            animate,
            centerLabel: { value: totalSessions.toLocaleString(), label: "sessions" },
          }),
        ),

        h(
          ChartCard,
          { title: "Plan mix by region", subtitle: "Stacked — parts of one whole", loading: busy },
          h(BarChart, {
            data: REGIONS,
            x: "region",
            series: PLAN_SERIES,
            stacked: true,
            horizontal: true,
            height: 240,
            animate,
            xLabel: "Region",
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
      ),

      h(
        "footer",
        { className: "db-footer" },
        h("p", null,
          `Showing ${rows.length} days · ${sum(rows, "visits").toLocaleString()} visits. `,
          "Every chart carries a “View as table” twin, so no value is locked behind a hover."),
      ),
    ),
  );
}

render(App, document.getElementById("app"));
