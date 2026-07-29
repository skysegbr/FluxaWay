import { h, loadCSS } from "/dist/fluxaway.js";
import {
  BarChart, ChartCard, DashboardGrid, DonutChart, LineChart, MetricCard, MetricRow, Meter,
} from "/dist/fluxaway-charts.js";

// The add-on's stylesheet carries the categorical palette tokens, so the demos
// need it loaded before they mean anything. This module is imported lazily by
// entryLoader, so the CSS arrives with the entry rather than on every page.
loadCSS("/dist/fluxaway-charts.css");

const MONTHS = [
  { month: "Jan", visits: 1200, signups: 300 },
  { month: "Feb", visits: 1900, signups: 420 },
  { month: "Mar", visits: 1500, signups: 380 },
  { month: "Apr", visits: 2400, signups: 610 },
  { month: "May", visits: 2100, signups: 540 },
  { month: "Jun", visits: 2800, signups: 690 },
];

const SERIES = [
  { key: "visits", label: "Visits" },
  { key: "signups", label: "Signups" },
];

const CHANNELS = [
  { channel: "Organic search", sessions: 18420 },
  { channel: "Direct", sessions: 12180 },
  { channel: "Paid social", sessions: 7640 },
  { channel: "Email", sessions: 5210 },
  { channel: "Referral", sessions: 3180 },
  { channel: "Affiliates", sessions: 1420 },
  { channel: "Display", sessions: 980 },
];

function LinePreview() {
  return h(LineChart, { data: MONTHS, x: "month", series: SERIES, height: 260, animate: true });
}

function BarPreview() {
  return h(BarChart, { data: MONTHS, x: "month", series: SERIES, stacked: true, height: 260, animate: true });
}

function DonutPreview() {
  return h(DonutChart, {
    data: CHANNELS,
    x: "channel",
    y: "sessions",
    height: 230,
    animate: true,
    centerLabel: { value: "49K", label: "sessions" },
  });
}

function DashboardPreview() {
  return h(
    "div",
    { className: "m-stack" },
    h(
      MetricRow,
      { min: 170 },
      h(MetricCard, { label: "Visits", value: 61409, delta: 16.6, deltaLabel: "vs last month", trend: MONTHS.map((m) => m.visits), countUp: true }),
      h(MetricCard, { label: "Signups", value: 2940, delta: 12.1, deltaLabel: "vs last month", trend: MONTHS.map((m) => m.signups), trendColor: "var(--m-chart-2)", countUp: true }),
      h(MetricCard, { label: "Error rate", value: 2.4, format: (n) => `${n.toFixed(1)}%`, delta: 3.1, up: "bad", deltaLabel: "vs last week" }),
    ),
    h(
      DashboardGrid,
      { min: 260 },
      h(ChartCard, { title: "Traffic", subtitle: "Monthly sessions" },
        h(LineChart, { data: MONTHS, x: "month", y: "visits", label: "Visits", height: 200 })),
      h(ChartCard, { title: "Capacity" },
        h("div", { className: "m-stack" },
          h(Meter, { label: "Seats", value: 168, max: 200 }),
          h(Meter, { label: "API calls", value: 940000, max: 1000000 }))),
    ),
  );
}

export const ADDON_ENTRIES = [
  {
    name: "FluxaWay Charts",
    slug: "fluxaway-charts",
    category: "addons",
    module: "fluxaway-charts.js",
    summary:
      "SVG charts and dashboard layout: line, area, bar, donut, sparkline, KPI tiles and cards — with a validated colorblind-safe palette and a table view on every chart.",
    demos: [
      {
        id: "charts-line",
        title: "Line & area",
        note: "Move the pointer across the plot for a crosshair readout of every series, or focus it and walk the x-axis with the arrow keys.",
        render: LinePreview,
        code: `const rows = [
  { month: "Jan", visits: 1200, signups: 300 },
  { month: "Feb", visits: 1900, signups: 420 },
];

return h(LineChart, {
  data: rows,
  x: "month",
  series: [
    { key: "visits",  label: "Visits" },
    { key: "signups", label: "Signups" },
  ],
  animate: true,
});`,
      },
      {
        id: "charts-bar",
        title: "Stacked bars",
        note: "Drop `stacked` for grouped bars, add `horizontal` when the category names are long. Each bar is its own hover and focus target.",
        render: BarPreview,
        code: `return h(BarChart, {
  data: rows,
  x: "month",
  series: [
    { key: "visits",  label: "Visits" },
    { key: "signups", label: "Signups" },
  ],
  stacked: true,
  animate: true,
});`,
      },
      {
        id: "charts-donut",
        title: "Donut",
        note: "Seven channels, six slices: past `maxSlices` the tail folds into a neutral “Other” instead of inventing a new hue.",
        render: DonutPreview,
        code: `return h(DonutChart, {
  data: channels,
  x: "channel",
  y: "sessions",
  maxSlices: 6,
  centerLabel: { value: "49K", label: "sessions" },
  animate: true,
});`,
      },
      {
        id: "charts-dashboard",
        title: "Dashboard layout",
        note: "MetricRow for the KPI row, DashboardGrid + ChartCard for the charts below it. `up: \"bad\"` flips the delta colors, because a rising error rate is not a win.",
        render: DashboardPreview,
        code: `h(MetricRow, { min: 170 },
  h(MetricCard, {
    label: "Visits", value: 61409,
    delta: 16.6, deltaLabel: "vs last month",
    trend: monthlyVisits, countUp: true,
  }),
  h(MetricCard, {
    label: "Error rate", value: 2.4,
    delta: 3.1, up: "bad",
  }),
)

h(DashboardGrid, { min: 260 },
  h(ChartCard, { title: "Traffic", loading: refetching },
    h(LineChart, { data: rows, x: "month", y: "visits" })),
)`,
      },
    ],
    props: [
      { name: "data", type: "Row[]", default: "[]", description: "Rows to plot." },
      { name: "x", type: "string | (row) => value", description: "Category/x key or accessor." },
      { name: "y", type: "string | (row) => number", description: "Shorthand for a single series." },
      { name: "series", type: "{ key, label?, color?, slot? }[]", description: "Several measures. Pin `slot` when the app filters this list, so survivors keep their hue." },
      { name: "animate", type: "boolean | { duration, stagger, ease, key }", default: "false", description: "Entrance animation via fluxaway-motion. Changing `key` replays it." },
      { name: "stacked / horizontal", type: "boolean", default: "false", description: "BarChart layout. Grouped is the multi-series default." },
      { name: "maxSlices", type: "number", default: "6", description: "DonutChart cap; the tail folds into “Other”." },
      { name: "showTable", type: "boolean", default: "true", description: "The table-view twin that keeps every value reachable without hovering." },
      { name: "format / tickFormat / xTickFormat", type: "(value) => string", description: "Tooltip+table, value axis, and category axis formatters." },
    ],
    resources: [
      { label: "Charts source", href: "/dist/fluxaway-charts.js" },
      { label: "Dashboard example", href: "/examples/dashboard/" },
      { label: "Drug recalls example", href: "/examples/drug-recalls/" },
    ],
    notes: [
      "Load /dist/fluxaway-charts.css next to the module — it carries the palette tokens.",
      "The palette has eight slots in a fixed order; a ninth series folds into “Other” rather than cycling. Re-check any color change with `python3 scripts/validate_chart_palette.py`.",
      "There is deliberately no dual-axis option: two measures of different magnitude are two charts.",
    ],
  },
];
