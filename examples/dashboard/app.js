import { h, render, useEffect, useMemo, useRef, useState } from "/dist/fluxaway.js";
import {
  ChartCard, DashboardGrid, LikertChart, SmallMultiples,
} from "/dist/fluxaway-charts.js";
import { TrafficCards } from "./components/TrafficCards.js";
import { MixCards } from "./components/MixCards.js";
import { OpsCards } from "./components/OpsCards.js";
import { DashboardFilters } from "./components/DashboardFilters.js";
import { KpiRow } from "./components/KpiRow.js";
import {
  buildRegionSeries, buildSeries, CHANNELS, dayLabel, sum, SURVEY, SURVEY_SCALE,
} from "./data.js";

function App() {
  const [range, setRange] = useState("30d");
  const [busy, setBusy] = useState(false);
  // Bumping this replays every entrance — see `animate.key` below.
  const [run, setRun] = useState(0);
  // exportPNG needs the rendered <svg>; the card wrapper is enough — it finds
  // the chart inside.
  const visitsRef = useRef(null);

  const { rows } = useMemo(() => buildSeries(range), [range]);
  const regions = useMemo(() => buildRegionSeries(range), [range]);

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
        h(TrafficCards, { rows, animate, busy, visitsRef }),
        h(MixCards, { animate, busy, totalSessions }),
        h(OpsCards, { animate, busy }),
      ),

      h(
        ChartCard,
        {
          title: "What people told us",
          subtitle: "Centred on the neutral answer, so rows compare by lean rather than by width",
          loading: busy,
        },
        h(LikertChart, {
          data: SURVEY,
          x: "question",
          series: SURVEY_SCALE,
          neutralIndex: 2,
          xLabel: "Question",
          format: (n) => `${n}%`,
        }),
      ),

      h(
        ChartCard,
        {
          title: "Visits by region",
          subtitle: "One panel per region on a shared y-scale — the same measure, so the panels really are comparable",
          loading: busy,
        },
        h(SmallMultiples, {
          data: regions.rows,
          x: "date",
          series: regions.series,
          columns: 4,
          height: 150,
          animate,
          xTickFormat: dayLabel,
        }),
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
