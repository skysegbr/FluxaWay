import {
  BarPreview, DashboardPreview, DivergingPreview, DonutPreview, DumbbellPreview,
  FacetPreview, HeatmapPreview, LikertPreview, LinePreview, ScatterPreview,
} from "./chartsDemos.js";

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
        id: "charts-heatmap",
        title: "Heatmap",
        note: "Magnitude on a grid uses the SEQUENTIAL ramp — one hue, stronger means more (it runs light→dark on a light surface and inverts in dark mode, so low values always recede into the background). Categorical hues have no reading order, so they are wrong for a value scale. The key below it is not optional: a continuous encoding is unreadable without one.",
        render: HeatmapPreview,
        code: `return h(Heatmap, {
  data: grid,          // [{ day, hour, sessions }]
  x: "hour",
  y: "day",
  value: "sessions",
  showValues: true,
});`,
      },
      {
        id: "charts-scatter",
        title: "Scatter",
        note: "Five segments, three colours. A scatter is an all-pairs form — any two dots can touch — and the palette is only validated that far, so the tail folds into “Other” instead of taking hues the reader cannot separate. Hovering picks the nearest point, so you never have to hit an 8px dot dead-centre.",
        render: ScatterPreview,
        code: `return h(ScatterChart, {
  data: accounts,
  x: "spend",
  y: "revenue",
  groupBy: "segment",   // capped at ALL_PAIRS_SLOTS (3)
  xLabel: "Spend",
  yLabel: "Revenue",
});`,
      },
      {
        id: "charts-facets",
        title: "Small multiples",
        note: "The way out of “too many series”, instead of a ninth hue. All facets share one y-scale — facet the SAME measure across slices, because different units on a shared scale flatten the small ones into a line at zero.",
        render: FacetPreview,
        code: `return h(SmallMultiples, {
  data: rows,
  x: "day",
  series: regions.map((r) => ({ key: r, label: r })),
  columns: 4,
  // shareScale is on by default — turning it off makes
  // unequal panels LOOK comparable when they are not.
});`,
      },
      {
        id: "charts-diverging",
        title: "Diverging bars",
        note: "Values against a baseline take the DIVERGING ramp: two opposite hues meeting at a neutral grey. The midpoint is grey on purpose — it has to read as “nothing”. The legend becomes a scale key, because here colour means distance from zero, not which series.",
        render: DivergingPreview,
        code: `return h(BarChart, {
  data: variance,     // [{ team, delta }]
  x: "team",
  y: "delta",
  horizontal: true,
  diverging: true,    // { invert: true } flips the poles
});`,
      },
      {
        id: "charts-likert",
        title: "Likert / sentiment",
        note: "An ordered scale as a diverging stacked bar, centred so the neutral response straddles zero. Rows can then be compared by LEAN — scan the baseline — instead of by total width, which is all a plain stacked bar would show.",
        render: LikertPreview,
        code: `return h(LikertChart, {
  data: survey,
  x: "q",
  series: scale,      // IN ORDER, most negative first
  neutralIndex: 2,    // which response is the middle
});`,
      },
      {
        id: "charts-dumbbell",
        title: "Dumbbell",
        note: "Before → after per item. The connector is the mark: two grouped bars would make the reader compute the gap, while this draws it. One hue in two shades, because it is the same measure at two times rather than two series.",
        render: DumbbellPreview,
        code: `return h(DumbbellChart, {
  data: pages,
  x: "page",
  from: "before",
  to: "after",
  fromLabel: "Before",
  toLabel: "After",
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
      { name: "emphasis", type: "string", description: "Highlight one series by key and grey the rest — often the honest answer to “make this clearer”." },
      { name: "brush", type: "boolean", default: "false", description: "LineChart: drag across the plot to zoom a range; Escape or the reset control restores it." },
      { name: "value", type: "string | (row) => number", description: "Heatmap: the magnitude key. Missing cells stay blank rather than reading as zero." },
      { name: "groupBy", type: "string | (row) => value", description: "ScatterChart: colour points by category, capped at ALL_PAIRS_SLOTS (3)." },
      { name: "diverging", type: "boolean | { invert }", default: "false", description: "BarChart: colour by polarity against the baseline instead of series identity." },
      { name: "neutralIndex", type: "number", description: "LikertChart: which response is the middle of the ordered scale." },
      { name: "shareScale", type: "boolean", default: "true", description: "SmallMultiples: one y-scale across facets. Off makes unequal panels look comparable." },
      { name: "format / tickFormat / xTickFormat", type: "(value) => string", description: "Tooltip+table, value axis, and category axis formatters." },
    ],
    resources: [
      { label: "Charts source", href: "#/source/charts-source" },
      { label: "Dashboard example", href: "/examples/dashboard/" },
      { label: "Drug recalls example", href: "/examples/drug-recalls/" },
    ],
    notes: [
      "Load /dist/fluxaway-charts.css next to the module — it carries the palette tokens.",
      "The palette has eight slots in a fixed order; a ninth series folds into “Other” rather than cycling. Re-check any color change with `python3 scripts/validate_chart_palette.py`.",
      "There is deliberately no dual-axis option: two measures of different magnitude are two charts.",
      "Three colour jobs, three ramps: --m-chart-* for identity, --m-seq-* for magnitude, --m-div-* for polarity. Using one for another job is the most common charting mistake.",
      "exportCSV() writes the same rows the table view shows; exportPNG() inlines every computed colour first, since a serialised SVG carries no stylesheet.",
    ],
  },
];
