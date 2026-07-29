import { Fragment, h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import {
  AreaChart, BarChart, ChartCard, DonutChart, DumbbellChart, Heatmap, LineChart,
  Meter, ScatterChart, exportCSV, exportPNG,
} from "/dist/fluxaway-charts.js";
import { ACCOUNTS, CHANNELS, PLAN_SERIES, REGIONS } from "../data.js";

// Composition: where the volume comes from and how it splits.
export function MixCards({ animate, busy, totalSessions }) {
  return h(
    Fragment,
    null,
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
        {
          title: "Spend vs revenue",
          subtitle: "Five segments, three colours — a scatter can only carry that many",
          loading: busy,
        },
        h(ScatterChart, {
          data: ACCOUNTS,
          x: "spend",
          y: "revenue",
          groupBy: "segment",
          height: 260,
          xLabel: "Spend",
          yLabel: "Revenue",
          format: (n) => `$${Number(n).toLocaleString()}`,
        }),
      ),
  );
}
