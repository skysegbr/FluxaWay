import { h, loadCSS } from "/dist/fluxaway.js";
import {
  BarChart, ChartCard, DashboardGrid, DonutChart, DumbbellChart, Heatmap,
  LikertChart, LineChart, MetricCard, MetricRow, Meter, ScatterChart,
  SmallMultiples,
} from "/dist/fluxaway-charts.js";

// The add-on's stylesheet carries the palette tokens, so the demos need it
// loaded before they mean anything. This module is imported lazily with the
// entry, so the CSS arrives with the page rather than on every route.
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

export function LinePreview() {
  return h(LineChart, { data: MONTHS, x: "month", series: SERIES, height: 260, animate: true });
}

export function BarPreview() {
  return h(BarChart, { data: MONTHS, x: "month", series: SERIES, stacked: true, height: 260, animate: true });
}

export function DonutPreview() {
  return h(DonutChart, {
    data: CHANNELS,
    x: "channel",
    y: "sessions",
    height: 230,
    animate: true,
    centerLabel: { value: "49K", label: "sessions" },
  });
}

const GRID = ["Mon", "Tue", "Wed", "Thu", "Fri"].flatMap((day, d) =>
  ["06", "09", "12", "15", "18"].map((hour, hh) => ({
    day,
    hour,
    sessions: Math.round((120 + d * 30) * Math.exp(-(((hh - 2) / 1.8) ** 2)) + 20),
  })));

const ACCOUNTS = Array.from({ length: 45 }, (_, i) => {
  const segment = ["SMB", "Mid-market", "Enterprise", "Partner", "Reseller"][i % 5];
  const spend = 300 + ((i * 137) % 2200);
  return { segment, spend, revenue: Math.round(spend * 1.8 + ((i * 53) % 900)) };
});

export function HeatmapPreview() {
  return h(Heatmap, {
    data: GRID, x: "hour", y: "day", value: "sessions",
    label: "Sessions", showValues: true, xTickFormat: (v) => `${v}:00`,
  });
}

export function ScatterPreview() {
  return h(ScatterChart, {
    data: ACCOUNTS, x: "spend", y: "revenue", groupBy: "segment",
    height: 260, xLabel: "Spend", yLabel: "Revenue",
  });
}

export function FacetPreview() {
  const regions = ["North", "South", "East", "West"];
  const data = Array.from({ length: 14 }, (_, i) => {
    const row = { day: `D${i + 1}` };
    regions.forEach((r, ri) => {
      row[r] = Math.round((400 - ri * 90) * (1 + 0.25 * Math.sin((i + ri) * 1.3)));
    });
    return row;
  });
  return h(SmallMultiples, {
    data, x: "day", columns: 4, height: 130,
    series: regions.map((r) => ({ key: r, label: r })),
  });
}

export function DashboardPreview() {
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


const SURVEY = [
  { q: "Docs are clear", sd: 4, d: 9, n: 15, a: 42, sa: 30 },
  { q: "Setup was easy", sd: 12, d: 22, n: 18, a: 30, sa: 18 },
  { q: "Errors are helpful", sd: 20, d: 28, n: 22, a: 20, sa: 10 },
];
const SURVEY_SCALE = [
  { key: "sd", label: "Strongly disagree" },
  { key: "d", label: "Disagree" },
  { key: "n", label: "Neutral" },
  { key: "a", label: "Agree" },
  { key: "sa", label: "Strongly agree" },
];

export function DivergingPreview() {
  const variance = [
    { team: "Platform", delta: 18 }, { team: "Growth", delta: -12 },
    { team: "Payments", delta: 4 }, { team: "Mobile", delta: -25 },
    { team: "Data", delta: 31 },
  ];
  return h(BarChart, {
    data: variance, x: "team", y: "delta", horizontal: true,
    diverging: true, height: 220, format: (n) => `${n > 0 ? "+" : ""}${n}%`,
  });
}

export function LikertPreview() {
  return h(LikertChart, { data: SURVEY, x: "q", series: SURVEY_SCALE, neutralIndex: 2 });
}

export function DumbbellPreview() {
  const pages = [
    { page: "Home", before: 2.8, after: 1.2 },
    { page: "Search", before: 4.1, after: 2.6 },
    { page: "Checkout", before: 3.2, after: 3.4 },
  ];
  return h(DumbbellChart, {
    data: pages, x: "page", from: "before", to: "after",
    fromLabel: "Before", toLabel: "After", format: (n) => `${Number(n).toFixed(1)}s`,
  });
}
