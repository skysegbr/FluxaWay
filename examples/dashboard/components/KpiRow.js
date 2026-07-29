import { h } from "/dist/fluxaway.js";
import { MetricCard, MetricRow, formatCompact } from "/dist/fluxaway-charts.js";
import { sum, trendDelta } from "../data.js";

const money = (n) => `$${formatCompact(n)}`;

// Headline numbers as a KPI row of stat tiles. Note `up: "bad"` on bounce
// rate: the same "+4.2%" is a loss there, and the arrow plus the wording
// carry that — the color never says it alone.
export function KpiRow({ rows, animateKey }) {
  const visits = sum(rows, "visits");
  const signups = sum(rows, "signups");
  const revenue = sum(rows, "revenue");
  const conversion = visits ? Math.round((signups / visits) * 1000) / 10 : 0;

  return h(
    MetricRow,
    { min: 190 },
    h(MetricCard, {
      label: "Visits",
      value: visits,
      delta: trendDelta(rows, "visits"),
      deltaLabel: "vs first half",
      trend: rows.map((r) => r.visits),
      countUp: true,
      key: `visits-${animateKey}`,
    }),
    h(MetricCard, {
      label: "Signups",
      value: signups,
      delta: trendDelta(rows, "signups"),
      deltaLabel: "vs first half",
      trend: rows.map((r) => r.signups),
      trendColor: "var(--m-chart-2)",
      countUp: true,
      key: `signups-${animateKey}`,
    }),
    h(MetricCard, {
      label: "Revenue",
      value: revenue,
      format: money,
      delta: trendDelta(rows, "revenue"),
      deltaLabel: "vs first half",
      trend: rows.map((r) => r.revenue),
      trendColor: "var(--m-chart-3)",
      countUp: true,
      key: `revenue-${animateKey}`,
    }),
    h(MetricCard, {
      label: "Conversion rate",
      value: conversion,
      format: (n) => `${n.toFixed(1)}%`,
      delta: 0.4,
      deltaLabel: "vs first half",
      countUp: true,
      key: `conv-${animateKey}`,
    }),
  );
}
