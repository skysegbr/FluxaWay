// Tests for the charts & dashboard add-on (fluxaway-charts.js).
//
// Two things are being protected here. The first is ordinary correctness:
// scales, tick rounding, stacking, negatives, empty data. The second is the
// set of DESIGN rules the module exists to enforce — a legend for >= 2 series
// and none for one, a table-view twin on every chart, colors that follow the
// entity rather than its rank, a donut that folds its tail instead of growing
// a 9th hue. Those are easy to "simplify" away later, so they are asserted.

import { h, render } from "../dist/fluxaway.js";
import {
  LineChart, AreaChart, BarChart, DonutChart, PieChart, Sparkline,
  Heatmap, ScatterChart, SmallMultiples, LikertChart, DumbbellChart,
  DashboardGrid, ChartCard, MetricCard, MetricRow, Meter,
  scaleLinear, scaleBand, niceTicks, formatCompact, formatNumber,
  seriesColor, seqColor, divergingColor, chartToCSV, exportPNG,
  CHART_SLOTS, SEQ_STEPS, ALL_PAIRS_SLOTS, DIV_STEPS,
} from "../dist/fluxaway-charts.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pointer(type, target, opts = {}) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, ...opts }));
}

function key(target, k) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
}

const MONTHS = [
  { month: "Jan", visits: 1200, signups: 300 },
  { month: "Feb", visits: 1900, signups: 420 },
  { month: "Mar", visits: 1500, signups: 380 },
];

const TWO = [
  { key: "visits", label: "Visits" },
  { key: "signups", label: "Signups" },
];

// ── scales & formatting ─────────────────────────────────────

test("scaleLinear: maps the domain onto the range and inverts back", () => {
  const scale = scaleLinear({ domain: [0, 10], range: [0, 100] });
  assertEqual(scale(0), 0);
  assertEqual(scale(5), 50);
  assertEqual(scale(10), 100);
  assertEqual(scale.invert(50), 5);
});

test("scaleLinear: a zero-width domain does not divide by zero", () => {
  const scale = scaleLinear({ domain: [5, 5], range: [0, 100] });
  assert(Number.isFinite(scale(5)), "a collapsed domain must still produce a finite pixel");
});

test("scaleLinear: a non-numeric value falls back to the domain start, never NaN", () => {
  const scale = scaleLinear({ domain: [0, 10], range: [0, 100] });
  assertEqual(scale(undefined), 0);
  assertEqual(scale("nope"), 0);
});

test("scaleBand: bands sit inside the range and share one bandwidth", () => {
  const scale = scaleBand({ domain: ["a", "b", "c"], range: [0, 300], padding: 0 });
  assertEqual(scale.bandwidth, 100);
  assertEqual(scale("a"), 0);
  assertEqual(scale("b"), 100);
  assertEqual(scale("c"), 200);
});

test("scaleBand: an unknown category returns the range start instead of NaN", () => {
  const scale = scaleBand({ domain: ["a"], range: [10, 100] });
  assertEqual(scale("missing"), 10);
});

test("niceTicks: rounds to 1/2/5 steps", () => {
  assertEqual(JSON.stringify(niceTicks(0, 2400, 5)), JSON.stringify([0, 500, 1000, 1500, 2000]));
});

test("niceTicks: a fractional step does not accumulate float drift", () => {
  // Repeated `t += 0.1` yields 0.30000000000000004 without the re-rounding.
  const ticks = niceTicks(0, 0.5, 5);
  for (const tick of ticks) {
    assertEqual(tick, Math.round(tick * 10) / 10, `tick ${tick} carries float drift`);
  }
});

test("formatCompact: one decimal below 10, none above, and units climb", () => {
  assertEqual(formatCompact(999), "999");
  assertEqual(formatCompact(1284), "1.3K");
  assertEqual(formatCompact(13400), "13K");
  assertEqual(formatCompact(2.5e6), "2.5M");
  assertEqual(formatCompact(3e9), "3B");
  assertEqual(formatCompact("nope"), "—");
});

test("formatNumber: non-numbers degrade to an em dash rather than NaN", () => {
  assertEqual(formatNumber(undefined), "—");
  assertEqual(formatNumber(1500), (1500).toLocaleString());
});

// ── palette contract ────────────────────────────────────────

test("seriesColor: slots are 1-based tokens and never cycle past the palette", () => {
  assertEqual(seriesColor(0), "var(--m-chart-1)");
  assertEqual(seriesColor(7), "var(--m-chart-8)");
  // A 9th series must NOT wrap back to slot 1 — a generated/reused hue is
  // indistinguishable from an existing one under simulated CVD.
  assertEqual(seriesColor(8), "var(--m-chart-other)");
  assertEqual(seriesColor(99), "var(--m-chart-other)");
  assertEqual(CHART_SLOTS, 8);
});

test("series colors follow the entity: an explicit slot survives filtering", async () => {
  const container = mountPoint();

  // "signups" is slot 2 while both series render. After "visits" is filtered
  // out it is FIRST in the list, and without `slot` it would be repainted
  // slot 1 — the recolor-on-filter bug this prop exists to prevent.
  function App({ only }) {
    const series = only
      ? [{ key: "signups", label: "Signups", slot: 2 }]
      : [{ key: "visits", label: "Visits", slot: 1 }, { key: "signups", label: "Signups", slot: 2 }];
    return h(BarChart, { data: MONTHS, x: "month", series });
  }

  render(() => h(App, { only: false }), container);
  await flush();
  const before = [...container.querySelectorAll("path.m-chart-bar")]
    .map((p) => p.getAttribute("fill"));
  assert(before.includes("var(--m-chart-2)"), "signups should start on slot 2");

  render(() => h(App, { only: true }), container);
  await flush();
  const after = [...container.querySelectorAll("path.m-chart-bar")]
    .map((p) => p.getAttribute("fill"));
  assert(after.every((fill) => fill === "var(--m-chart-2)"),
    `the surviving series must keep slot 2, got ${JSON.stringify(after)}`);
});

// ── LineChart ───────────────────────────────────────────────

test("LineChart: draws one path per series plus a table twin", async () => {
  const container = mountPoint();
  render(() => h(LineChart, { data: MONTHS, x: "month", series: TWO, label: "Traffic" }), container);
  await flush();

  assertEqual(container.querySelectorAll("path.m-chart-line-path").length, 2);
  assertEqual(container.querySelectorAll("details.m-chart-table").length, 1);
  // every value reachable without hovering: 3 rows x (1 header cell + 2 values)
  assertEqual(container.querySelectorAll(".m-chart-table tbody tr").length, 3);
  assertEqual(container.querySelectorAll(".m-chart-table tbody td").length, 6);
});

test("LineChart: a legend appears for two series and is absent for one", async () => {
  const container = mountPoint();

  render(() => h(LineChart, { data: MONTHS, x: "month", series: TWO }), container);
  await flush();
  assertEqual(container.querySelectorAll(".m-chart-legend-item").length, 2);

  // One series needs no legend box — the title already names what is plotted.
  render(() => h(LineChart, { data: MONTHS, x: "month", y: "visits" }), container);
  await flush();
  assertEqual(container.querySelectorAll(".m-chart-legend").length, 0);
});

test("LineChart: a single data point renders a dot, since a 1-point path strokes nothing", async () => {
  const container = mountPoint();
  render(() => h(LineChart, { data: [MONTHS[0]], x: "month", y: "visits" }), container);
  await flush();

  const d = container.querySelector("path.m-chart-line-path").getAttribute("d");
  assert(!d.includes("L"), "a one-point path has no line segment");
  assertEqual(container.querySelectorAll("circle.m-chart-dot").length, 1);
});

test("LineChart: the y-axis domain contains the data — no point above the last tick", async () => {
  const container = mountPoint();
  // max 1200 with a 500 step stops ticks at 1000; the axis must extend to 1500
  // so the top point stays inside the plotted band.
  render(() => h(LineChart, { data: [MONTHS[0]], x: "month", y: "visits" }), container);
  await flush();

  const ticks = [...container.querySelectorAll(".m-chart-axis-y text")].map((t) => t.textContent);
  assert(ticks.includes("1.5K"), `expected a tick above the max, got ${JSON.stringify(ticks)}`);

  const dot = container.querySelector("circle.m-chart-dot");
  assert(Number(dot.getAttribute("cy")) >= 0, "the point must sit inside the plot, not above it");
});

test("LineChart: pointer move opens a crosshair tooltip listing every series", async () => {
  const container = mountPoint();
  render(() => h(LineChart, { data: MONTHS, x: "month", series: TWO }), container);
  await flush();

  assertEqual(container.querySelectorAll(".m-chart-tooltip").length, 0);

  const svg = container.querySelector("svg.m-chart-svg");
  pointer("pointermove", svg, { clientX: 0, clientY: 0 });
  await flush();

  const tooltip = container.querySelector(".m-chart-tooltip");
  assert(tooltip, "a pointermove over the plot must open the tooltip");
  // one tooltip, EVERY series — the pointer never has to land on a line
  assertEqual(tooltip.querySelectorAll(".m-chart-tooltip-row").length, 2);
  assertEqual(container.querySelectorAll("line.m-chart-crosshair").length, 1);

  pointer("pointerleave", svg);
  await flush();
  assertEqual(container.querySelectorAll(".m-chart-tooltip").length, 0);
});

test("LineChart: arrow keys walk the x-axis, so hover is not the only way in", async () => {
  const container = mountPoint();
  render(() => h(LineChart, { data: MONTHS, x: "month", series: TWO }), container);
  await flush();

  const svg = container.querySelector("svg.m-chart-svg");
  assertEqual(svg.getAttribute("tabindex"), "0");

  key(svg, "ArrowRight");
  await flush();
  const first = container.querySelector(".m-chart-tooltip-title").textContent;

  key(svg, "ArrowRight");
  await flush();
  const second = container.querySelector(".m-chart-tooltip-title").textContent;

  assert(first !== second, `arrow keys must move the readout (${first} -> ${second})`);
});

test("AreaChart: fills under the line and keeps the wash off the stroke", async () => {
  const container = mountPoint();
  render(() => h(AreaChart, { data: MONTHS, x: "month", y: "visits" }), container);
  await flush();

  const area = container.querySelector("path.m-chart-area");
  assert(area, "AreaChart must render a filled area path");
  assert(area.getAttribute("d").trim().endsWith("Z"), "the area path must close back to the baseline");
});

// ── BarChart ────────────────────────────────────────────────

test("BarChart: grouped renders a bar per category per series", async () => {
  const container = mountPoint();
  render(() => h(BarChart, { data: MONTHS, x: "month", series: TWO }), container);
  await flush();
  assertEqual(container.querySelectorAll("path.m-chart-bar").length, 6);
});

test("BarChart: bars are capped in thickness rather than filling the band", async () => {
  const container = mountPoint();
  // Two categories in a 640px fallback width would give ~250px bands.
  render(() => h(BarChart, { data: MONTHS.slice(0, 2), x: "month", y: "visits" }), container);
  await flush();

  const bar = container.querySelector("path.m-chart-bar");
  const box = bar.getBBox();
  assert(box.width <= 24 + 0.5, `bar thickness must stay capped at 24px, got ${box.width}`);
});

test("BarChart: stacked segments sum per category and carry a surface gap", async () => {
  const container = mountPoint();
  render(() => h(BarChart, { data: MONTHS, x: "month", series: TWO, stacked: true }), container);
  await flush();

  const bars = [...container.querySelectorAll("path.m-chart-bar")];
  assertEqual(bars.length, 6);

  // Jan: visits 1200 then signups 300 stacked on top of it. The signups
  // segment must sit ABOVE (smaller y) than the visits segment it stacks on.
  const janVisits = bars[0].getBBox();
  const janSignups = bars[1].getBBox();
  assert(janSignups.y < janVisits.y,
    `the stacked segment must sit above its base (${janSignups.y} vs ${janVisits.y})`);
  // separated by the surface gap, never a stroke
  assert(bars[0].getAttribute("stroke") === null, "marks must not be separated by a stroke");
  const gap = janVisits.y - (janSignups.y + janSignups.height);
  assert(gap >= 1 && gap <= 4, `expected a ~2px surface gap between segments, got ${gap}`);
});

test("BarChart: negative values grow downward from the zero baseline", async () => {
  const container = mountPoint();
  const pnl = [{ q: "Q1", pnl: 400 }, { q: "Q2", pnl: -220 }];
  render(() => h(BarChart, { data: pnl, x: "q", y: "pnl" }), container);
  await flush();

  const [up, down] = [...container.querySelectorAll("path.m-chart-bar")].map((p) => p.getBBox());
  assert(up.y + up.height <= down.y + 1,
    `the positive bar must end where the negative one starts (${up.y + up.height} vs ${down.y})`);
});

test("BarChart: horizontal puts category labels on the y-axis, right-aligned", async () => {
  const container = mountPoint();
  render(() => h(BarChart, {
    data: [{ k: "Direct", n: 10 }, { k: "Search", n: 5 }],
    x: "k", y: "n", horizontal: true,
  }), container);
  await flush();

  const label = container.querySelector(".m-chart-axis-y text");
  assertEqual(label.textContent, "Direct");
  // text-anchor must reach the DOM as the hyphenated SVG attribute; the
  // camelCase spelling silently renders left-aligned text over the bars.
  assertEqual(label.getAttribute("text-anchor"), "end");
  assert(label.getBBox().x < 0, "the label must sit left of the plot, not inside it");
});

test("x-axis labels are thinned so they never overprint each other", async () => {
  const container = mountPoint();
  // 30 daily points in a 640px fallback width cannot all be labelled.
  const daily = Array.from({ length: 30 }, (_, i) => ({
    day: `Jul ${i + 1}`, n: 100 + i,
  }));
  render(() => h(LineChart, { data: daily, x: "day", y: "n" }), container);
  await flush();

  const labels = [...container.querySelectorAll(".m-chart-axis-x text")];
  assert(labels.length > 1 && labels.length < daily.length,
    `expected a thinned axis, got ${labels.length} of ${daily.length}`);

  // The last point is the range's right edge and must be labelled...
  assertEqual(labels[labels.length - 1].textContent, "Jul 30");

  // ...without crowding its neighbour: centres stay at least ~56px apart.
  const centres = labels.map((t) => t.getBBox().x + t.getBBox().width / 2);
  for (let i = 1; i < centres.length; i += 1) {
    assert(centres[i] - centres[i - 1] >= 40,
      `labels ${labels[i - 1].textContent} and ${labels[i].textContent} collide`);
  }
});

test("BarChart: each bar is its own hover and focus target", async () => {
  const container = mountPoint();
  render(() => h(BarChart, { data: MONTHS, x: "month", y: "visits" }), container);
  await flush();

  const bar = container.querySelector("path.m-chart-bar");
  assertEqual(bar.getAttribute("tabindex"), "0");
  assert(bar.getAttribute("aria-label").includes("Jan"), "the mark must name its category");

  pointer("pointerenter", bar, { clientX: 10, clientY: 10 });
  await flush();
  assert(container.querySelector(".m-chart-tooltip"), "hovering a bar must open its tooltip");

  // keyboard focus shows the same details as hover
  pointer("pointerleave", bar);
  await flush();
  bar.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
  await flush();
  assert(container.querySelector(".m-chart-tooltip"), "focus must open the same readout as hover");
});

test("BarChart: onBarClick reports the row, series and value", async () => {
  const container = mountPoint();
  const seen = [];
  render(() => h(BarChart, {
    data: MONTHS, x: "month", y: "visits",
    onBarClick: (row, series, value) => seen.push([row.month, series.key, value]),
  }), container);
  await flush();

  container.querySelector("path.m-chart-bar").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await flush();
  assertEqual(JSON.stringify(seen), JSON.stringify([["Jan", "visits", 1200]]));
});

// ── DonutChart ──────────────────────────────────────────────

test("DonutChart: renders an arc per slice with a share in its label", async () => {
  const container = mountPoint();
  const data = [{ k: "A", n: 75 }, { k: "B", n: 25 }];
  render(() => h(DonutChart, { data, x: "k", y: "n" }), container);
  await flush();

  const arcs = [...container.querySelectorAll("path.m-chart-arc")];
  assertEqual(arcs.length, 2);
  assert(arcs[0].getAttribute("aria-label").includes("75.0%"),
    `expected a share in the label, got ${arcs[0].getAttribute("aria-label")}`);
});

test("DonutChart: folds the tail into Other instead of growing a 9th hue", async () => {
  const container = mountPoint();
  const many = Array.from({ length: 9 }, (_, i) => ({ k: `S${i}`, n: 100 - i * 5 }));
  render(() => h(DonutChart, { data: many, x: "k", y: "n", maxSlices: 6 }), container);
  await flush();

  assertEqual(container.querySelectorAll("path.m-chart-arc").length, 6);
  const labels = [...container.querySelectorAll(".m-chart-legend-label")].map((n) => n.textContent);
  assertEqual(labels[labels.length - 1], "Other");
  // the fold must preserve the total, not drop the tail
  const values = [...container.querySelectorAll(".m-chart-legend-value")].map((n) => n.textContent);
  const shown = values.reduce((sum, v) => sum + Number(v.replace(/,/g, "")), 0);
  assertEqual(shown, many.reduce((sum, d) => sum + d.n, 0));
});

test("DonutChart: zero and negative values are skipped, not drawn as slivers", async () => {
  const container = mountPoint();
  const data = [{ k: "A", n: 10 }, { k: "B", n: 0 }, { k: "C", n: -5 }];
  render(() => h(DonutChart, { data, x: "k", y: "n" }), container);
  await flush();
  assertEqual(container.querySelectorAll("path.m-chart-arc").length, 1);
});

test("DonutChart: sliceColor overrides the palette for status-meaning slices", async () => {
  const container = mountPoint();
  // Severity tiers are STATE, not identity, so they wear the status tokens
  // rather than taking categorical slots.
  const tiers = [{ k: "Class I", n: 30 }, { k: "Class II", n: 50 }, { k: "Class III", n: 20 }];
  const tone = { "Class I": "var(--m-danger)", "Class II": "var(--m-warning)" };
  render(() => h(DonutChart, {
    data: tiers, x: "k", y: "n",
    sliceColor: (row) => tone[row?.k],
  }), container);
  await flush();

  const fills = [...container.querySelectorAll("path.m-chart-arc")].map((p) => p.getAttribute("fill"));
  // sorted by value: Class II (50), Class I (30), Class III (20)
  assertEqual(fills[0], "var(--m-warning)");
  assertEqual(fills[1], "var(--m-danger)");
  // returning undefined keeps the categorical slot
  assertEqual(fills[2], "var(--m-chart-3)");
});

test("PieChart: closes the hole so the arc reaches the centre", async () => {
  const container = mountPoint();
  render(() => h(PieChart, { data: [{ k: "A", n: 1 }], x: "k", y: "n" }), container);
  await flush();
  const d = container.querySelector("path.m-chart-arc").getAttribute("d");
  // A pie slice starts with a move to the CENTRE and then lines out to the rim
  // (a donut would start on the rim instead). height 240 -> centre at 120,120.
  const [, mx, my, cmd] = d.split(" ");
  assertEqual(cmd, "L", `expected a centre-anchored slice, got ${d}`);
  assertEqual(Number(mx), 120);
  assertEqual(Number(my), 120);
});

// ── empty states ────────────────────────────────────────────

test("charts with no data show an empty state instead of an axis-only frame", async () => {
  const container = mountPoint();
  render(() => h("div", null,
    h(LineChart, { data: [], x: "month", y: "visits" }),
    h(BarChart, { data: [], x: "month", y: "visits" }),
    h(DonutChart, { data: [], x: "k", y: "n" }),
  ), container);
  await flush();

  assertEqual(container.querySelectorAll(".m-chart-empty").length, 3);
  assertEqual(container.querySelectorAll("svg.m-chart-svg").length, 0);
});

test("a series key missing from the rows plots as zero rather than NaN", async () => {
  const container = mountPoint();
  render(() => h(BarChart, {
    data: MONTHS, x: "month", series: [{ key: "nope", label: "Missing" }],
  }), container);
  await flush();

  for (const bar of container.querySelectorAll("path.m-chart-bar")) {
    assert(!bar.getAttribute("d").includes("NaN"), "a missing key must not leak NaN into the path");
  }
});

// ── Sparkline ───────────────────────────────────────────────

test("Sparkline: draws a line, a wash and an end dot with no chrome", async () => {
  const container = mountPoint();
  render(() => h(Sparkline, { values: [1, 4, 2, 8] }), container);
  await flush();

  const svg = container.querySelector("svg.m-chart-sparkline");
  assert(svg, "Sparkline must render");
  assertEqual(svg.querySelectorAll("circle").length, 1);
  assertEqual(container.querySelectorAll(".m-chart-axis").length, 0);
  assertEqual(container.querySelectorAll(".m-chart-legend").length, 0);
});

test("Sparkline: a flat series still produces finite geometry", async () => {
  const container = mountPoint();
  render(() => h(Sparkline, { values: [5, 5, 5] }), container);
  await flush();
  const d = container.querySelector("svg.m-chart-sparkline path").getAttribute("d");
  assert(!d.includes("NaN"), `a flat series must not collapse into NaN: ${d}`);
});

// ── dashboard layer ─────────────────────────────────────────

test("MetricCard: colors the delta by direction AND ships an arrow, never color alone", async () => {
  const container = mountPoint();
  render(() => h("div", null,
    h(MetricCard, { label: "Revenue", value: 1000, delta: 12 }),
    h(MetricCard, { label: "Errors", value: 5, delta: 12, up: "bad" }),
  ), container);
  await flush();

  const [good, bad] = container.querySelectorAll(".m-metric-delta");
  // same +12%, opposite meaning: rising revenue is good, rising errors are not
  assert(good.classList.contains("m-metric-delta-good"), "rising revenue reads as good");
  assert(bad.classList.contains("m-metric-delta-bad"), "rising errors read as bad");
  assertEqual(good.querySelector(".m-metric-arrow").textContent, "↑");
});

test("MetricCard: a flat delta is neutral rather than good or bad", async () => {
  const container = mountPoint();
  render(() => h(MetricCard, { label: "Flat", value: 10, delta: 0 }), container);
  await flush();
  const delta = container.querySelector(".m-metric-delta");
  assert(delta.classList.contains("m-metric-delta-flat"), "a zero delta must not read as a win");
  assertEqual(delta.querySelector(".m-metric-arrow").textContent, "→");
});

test("MetricCard: renders its value immediately when countUp is off", async () => {
  const container = mountPoint();
  render(() => h(MetricCard, { label: "Users", value: 12900 }), container);
  await flush();
  assertEqual(container.querySelector(".m-metric-value").textContent, "13K");
});

test("MetricCard: countUp lands exactly on the target value", async () => {
  const container = mountPoint();
  render(() => h(MetricCard, { label: "Users", value: 4200, countUp: true }), container);
  await flush();
  await sleep(1100);   // past the 900ms count-up
  assertEqual(container.querySelector(".m-metric-value").textContent, "4.2K");
});

test("Meter: escalates its tone with the ratio and exposes ARIA values", async () => {
  const container = mountPoint();
  render(() => h("div", null,
    h(Meter, { label: "Low", value: 10, max: 100 }),
    h(Meter, { label: "High", value: 95, max: 100 }),
  ), container);
  await flush();

  const fills = container.querySelectorAll(".m-meter-fill");
  assert(fills[0].classList.contains("m-meter-ok"), "a low ratio stays neutral");
  assert(fills[1].classList.contains("m-meter-critical"), "a near-limit ratio reads critical");

  const track = container.querySelector('[role="meter"]');
  assertEqual(track.getAttribute("aria-valuenow"), "10");
  assertEqual(track.getAttribute("aria-valuemax"), "100");
});

test("Meter: clamps out-of-range values to the track", async () => {
  const container = mountPoint();
  render(() => h(Meter, { label: "Over", value: 250, max: 100 }), container);
  await flush();
  assertEqual(container.querySelector(".m-meter-fill").style.width, "100%");
});

test("ChartCard: holds the previous render at reduced opacity while loading", async () => {
  const container = mountPoint();
  render(() => h(ChartCard, { title: "Traffic", loading: true },
    h(Sparkline, { values: [1, 2, 3] })), container);
  await flush();

  const card = container.querySelector(".m-dash-card");
  assertEqual(card.getAttribute("aria-busy"), "true");
  assert(card.querySelector(".m-dash-card-loading"), "the body dims instead of flashing a skeleton");
  assert(card.querySelector("svg.m-chart-sparkline"), "the previous render stays mounted");
});

test("DashboardGrid and MetricRow expose their track width as a custom property", async () => {
  const container = mountPoint();
  render(() => h("div", null,
    h(DashboardGrid, { min: 280 }, h(ChartCard, { title: "A" })),
    h(MetricRow, { min: 200 }, h(MetricCard, { label: "B", value: 1 })),
  ), container);
  await flush();

  assertEqual(container.querySelector(".m-dash-grid").style.getPropertyValue("--m-dash-min"), "280px");
  assertEqual(container.querySelector(".m-metric-row-group").style.getPropertyValue("--m-metric-min"), "200px");
});

// ── animation ───────────────────────────────────────────────

test("animate settles back to an untransformed mark, so the resting render is exact", async () => {
  const container = mountPoint();
  render(() => h(BarChart, { data: MONTHS, x: "month", y: "visits", animate: true }), container);
  await flush();
  await sleep(1200);   // 620ms duration + 3 x 45ms stagger, plus slack

  for (const bar of container.querySelectorAll("path.m-chart-bar")) {
    // a lingering scale would misstate every value it draws
    assert(bar.style.transform === "none" || bar.style.transform === "",
      `bar left mid-animation: ${bar.style.transform}`);
    assertEqual(bar.style.willChange, "auto", "the compositor hint must be released at rest");
  }
});

test("animate: false leaves no inline transform at all", async () => {
  const container = mountPoint();
  render(() => h(BarChart, { data: MONTHS, x: "month", y: "visits" }), container);
  await flush();

  for (const bar of container.querySelectorAll("path.m-chart-bar")) {
    assertEqual(bar.style.transform, "", "an un-animated chart must not be transformed");
  }
});

test("animate.key replays the entrance without remounting the chart", async () => {
  const container = mountPoint();

  function App({ runId }) {
    return h(BarChart, {
      data: MONTHS, x: "month", y: "visits", animate: { key: runId, duration: 400 },
    });
  }

  render(() => h(App, { runId: 1 }), container);
  await flush();
  await sleep(700);
  const settled = container.querySelector("path.m-chart-bar");
  assert(settled.style.transform === "none" || settled.style.transform === "",
    "the first run must settle");

  // Bumping the key restarts the timeline: the mark is mid-scale again.
  render(() => h(App, { runId: 2 }), container);
  await flush();
  const bar = container.querySelector("path.m-chart-bar");
  assert(bar.style.transform.includes("scale"),
    `a new animate.key must replay the entrance, got ${bar.style.transform || "(none)"}`);

  await sleep(700);
  assert(bar.style.transform === "none" || bar.style.transform === "",
    "the replay must settle too");
});

test("the line wipe clips through the hyphenated clip-path attribute", async () => {
  const container = mountPoint();
  render(() => h(LineChart, { data: MONTHS, x: "month", y: "visits", animate: true }), container);
  await flush();

  // camelCase `clipPath` would set a bogus attribute and silently never clip
  const clipped = container.querySelector("g[clip-path]");
  assert(clipped, "the wiped group must carry a clip-path attribute");
  assert(clipped.getAttribute("clip-path").startsWith("url(#"), "clip-path must reference the clipPath element");
  assert(container.querySelector("clipPath rect.m-chart-wipe"), "the wipe rect must exist to be scaled");
});

// ── sequential ramp & Heatmap ───────────────────────────────

test("seqColor: buckets map onto the ramp and clamp at both ends", () => {
  assertEqual(seqColor(0), "var(--m-seq-1)");
  assertEqual(seqColor(SEQ_STEPS - 1), `var(--m-seq-${SEQ_STEPS})`);
  // Out-of-range buckets clamp rather than producing an undefined token.
  assertEqual(seqColor(99), `var(--m-seq-${SEQ_STEPS})`);
  assertEqual(seqColor(-3), "var(--m-seq-1)");
  assertEqual(seqColor("nope"), "var(--m-seq-1)");
});

const GRID = [
  { day: "Mon", hour: "09", n: 5 },
  { day: "Mon", hour: "12", n: 50 },
  { day: "Tue", hour: "09", n: 25 },
  { day: "Tue", hour: "12", n: 100 },
];

test("Heatmap: one cell per datum, on the sequential ramp not categorical hues", async () => {
  const container = mountPoint();
  render(() => h(Heatmap, { data: GRID, x: "hour", y: "day", value: "n" }), container);
  await flush();

  const cells = [...container.querySelectorAll("rect.m-heat-cell")];
  assertEqual(cells.length, 4);
  for (const cell of cells) {
    assert(cell.getAttribute("fill").startsWith("var(--m-seq-"),
      `magnitude must use the sequential ramp, got ${cell.getAttribute("fill")}`);
  }
  // the largest value lands on a deeper step than the smallest
  const first = Number(cells[0].getAttribute("fill").match(/\d+/)[0]);
  const last = Number(cells[3].getAttribute("fill").match(/\d+/)[0]);
  assert(last > first, "a bigger value must sit further along the ramp");
});

test("Heatmap: a gap in the grid stays empty instead of reading as zero", async () => {
  const container = mountPoint();
  // Mon/15 is absent — three cells, not a 2x2 grid with a zero-valued block.
  render(() => h(Heatmap, {
    data: [...GRID.slice(0, 2), { day: "Tue", hour: "09", n: 3 }],
    x: "hour", y: "day", value: "n",
  }), container);
  await flush();
  assertEqual(container.querySelectorAll("rect.m-heat-cell").length, 3);
});

test("Heatmap: ships a scale key and a table twin, since colour alone is not readable", async () => {
  const container = mountPoint();
  render(() => h(Heatmap, { data: GRID, x: "hour", y: "day", value: "n" }), container);
  await flush();

  assertEqual(container.querySelectorAll(".m-heat-legend-ramp > span").length, SEQ_STEPS);
  assertEqual(container.querySelectorAll("details.m-chart-table").length, 1);
  // every cell is focusable and names its own value
  const cell = container.querySelector("rect.m-heat-cell");
  assertEqual(cell.getAttribute("tabindex"), "0");
  assert(cell.getAttribute("aria-label").includes("Mon"), "the cell must name its row");
});

// ── ScatterChart ────────────────────────────────────────────

const POINTS = Array.from({ length: 20 }, (_, i) => ({
  spend: i * 10,
  revenue: i * 12 + (i % 3) * 5,
  segment: ["A", "B", "C", "D", "E"][i % 5],
}));

test("ScatterChart: plots a dot per row with a table twin", async () => {
  const container = mountPoint();
  render(() => h(ScatterChart, { data: POINTS, x: "spend", y: "revenue" }), container);
  await flush();

  assertEqual(container.querySelectorAll("circle.m-chart-point").length, 20);
  assertEqual(container.querySelectorAll("details.m-chart-table").length, 1);
});

test("ScatterChart: folds past the all-pairs safe depth instead of inventing hues", async () => {
  const container = mountPoint();
  render(() => h(ScatterChart, {
    data: POINTS, x: "spend", y: "revenue", groupBy: "segment",
  }), container);
  await flush();

  const fills = new Set([...container.querySelectorAll("circle.m-chart-point")]
    .map((n) => n.getAttribute("fill")));
  // 5 groups, but scatter is an all-pairs form: only 3 get their own slot.
  assertEqual(fills.size, ALL_PAIRS_SLOTS + 1);
  assert(fills.has("var(--m-chart-other)"), "the tail must share the neutral token");

  // The folded groups collapse into ONE legend row — several rows sharing a
  // grey would imply a distinction the colour cannot carry.
  const labels = [...container.querySelectorAll(".m-chart-legend-label")].map((n) => n.textContent);
  assertEqual(labels.length, ALL_PAIRS_SLOTS + 1);
  assert(labels[labels.length - 1].startsWith("Other"), `expected a folded row, got ${labels}`);

  // and the cap is explained rather than silently applied
  assert(container.querySelector(".m-chart-note"), "the fold must be explained in the chart");
});

test("ScatterChart: hovering near a point picks it, without needing dead-centre aim", async () => {
  const container = mountPoint();
  render(() => h(ScatterChart, { data: POINTS.slice(0, 5), x: "spend", y: "revenue" }), container);
  await flush();

  const svg = container.querySelector("svg.m-chart-svg");
  const dot = container.querySelector("circle.m-chart-point");
  const box = dot.getBoundingClientRect();
  // aim ~10px away from the centre — a pinpoint hit test would miss this
  pointer("pointermove", svg, {
    clientX: box.x + box.width / 2 + 10,
    clientY: box.y + box.height / 2 + 10,
  });
  await flush();
  assert(container.querySelector(".m-chart-tooltip"),
    "a near miss must still resolve to the closest point");
});

// ── emphasis ────────────────────────────────────────────────

test("emphasis: one series keeps its hue and the rest recede to grey", async () => {
  const container = mountPoint();
  render(() => h(LineChart, { data: MONTHS, x: "month", series: TWO, emphasis: "signups" }), container);
  await flush();

  const strokes = [...container.querySelectorAll("path.m-chart-line-path")]
    .map((n) => n.getAttribute("stroke"));
  assertEqual(strokes.filter((s) => s === "var(--m-chart-muted)").length, 1);
  assertEqual(strokes.filter((s) => s === "var(--m-chart-2)").length, 1);
});

// ── SmallMultiples ──────────────────────────────────────────

test("SmallMultiples: one facet per series, all on ONE shared scale", async () => {
  const container = mountPoint();
  // Wildly different magnitudes: auto-scaling each facet would make a 30-ish
  // series look identical to a 1200-ish one.
  const wide = [
    { m: "Jan", big: 1200, small: 20 },
    { m: "Feb", big: 1900, small: 35 },
  ];
  render(() => h(SmallMultiples, {
    data: wide, x: "m",
    series: [{ key: "big", label: "Big" }, { key: "small", label: "Small" }],
  }), container);
  await flush();

  const facets = [...container.querySelectorAll(".m-facet")];
  assertEqual(facets.length, 2);
  const ticks = facets.map((f) =>
    [...f.querySelectorAll(".m-chart-axis-y text")].map((t) => t.textContent).join("|"));
  assertEqual(ticks[0], ticks[1], `facets must share a y scale, got ${JSON.stringify(ticks)}`);
});

test("SmallMultiples: shareScale false lets each facet scale itself", async () => {
  const container = mountPoint();
  const wide = [
    { m: "Jan", big: 1200, small: 20 },
    { m: "Feb", big: 1900, small: 35 },
  ];
  render(() => h(SmallMultiples, {
    data: wide, x: "m", shareScale: false,
    series: [{ key: "big", label: "Big" }, { key: "small", label: "Small" }],
  }), container);
  await flush();

  const ticks = [...container.querySelectorAll(".m-facet")].map((f) =>
    [...f.querySelectorAll(".m-chart-axis-y text")].map((t) => t.textContent).join("|"));
  assert(ticks[0] !== ticks[1], "opting out must actually give each facet its own scale");
});

// ── brush / zoom ────────────────────────────────────────────

test("brush: a committed selection narrows the plot and offers a way back", async () => {
  const container = mountPoint();
  const many = Array.from({ length: 12 }, (_, i) => ({ m: `M${i + 1}`, v: 10 + i }));
  render(() => h(LineChart, { data: many, x: "m", y: "v", brush: true }), container);
  await flush();

  const svg = container.querySelector("svg.m-chart-svg");
  assertEqual(container.querySelectorAll(".m-chart-zoom-reset").length, 0);

  const box = svg.getBoundingClientRect();
  const y = box.y + box.height / 2;
  pointer("pointerdown", svg, { clientX: box.x + box.width * 0.35, clientY: y, button: 0 });
  await flush();
  pointer("pointermove", svg, { clientX: box.x + box.width * 0.65, clientY: y });
  await flush();
  assert(container.querySelector("rect.m-chart-brush"), "the selection must be visible while dragging");
  assertEqual(container.querySelectorAll(".m-chart-tooltip").length, 0,
    "a drag owns the pointer — the crosshair must stay out of the way");

  pointer("pointerup", svg, { clientX: box.x + box.width * 0.65, clientY: y });
  await flush();

  assertEqual(container.querySelectorAll(".m-chart-zoom-reset").length, 1);
  // the table view still lists the FULL series: zoom is a view, not a filter
  assertEqual(container.querySelectorAll(".m-chart-table tbody tr").length, 12);

  container.querySelector(".m-chart-zoom-reset").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await flush();
  assertEqual(container.querySelectorAll(".m-chart-zoom-reset").length, 0);
});

test("brush: a plain click does not collapse the chart to a single point", async () => {
  const container = mountPoint();
  const many = Array.from({ length: 12 }, (_, i) => ({ m: `M${i + 1}`, v: 10 + i }));
  render(() => h(LineChart, { data: many, x: "m", y: "v", brush: true }), container);
  await flush();

  const svg = container.querySelector("svg.m-chart-svg");
  const box = svg.getBoundingClientRect();
  const at = { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
  pointer("pointerdown", svg, { ...at, button: 0 });
  pointer("pointerup", svg, at);
  await flush();

  assertEqual(container.querySelectorAll(".m-chart-zoom-reset").length, 0);
});

// ── export ──────────────────────────────────────────────────

test("chartToCSV: emits a header row and escapes separators", async () => {
  const csv = chartToCSV({
    data: [{ m: "Jan, 2026", v: 10 }, { m: 'He said "hi"', v: 20 }],
    x: "m", y: "v", label: "Value", xLabel: "Month",
  });
  const lines = csv.split("\n");
  assertEqual(lines[0], "Month,Value");
  // a comma inside a value must be quoted, not split the column
  assertEqual(lines[1], '"Jan, 2026",10');
  assertEqual(lines[2], '"He said ""hi""",20');
});

test("exportPNG: resolves var() colours into the raster instead of exporting blank", async () => {
  const container = mountPoint();
  // The sandbox lives off-screen, so give the chart a real width to lay out in.
  container.style.width = "480px";
  render(() => h(Heatmap, { data: GRID, x: "hour", y: "day", value: "n" }), container);
  await flush();

  const svg = container.querySelector("svg.m-chart-svg");
  const blob = await exportPNG(svg, { filename: "test.png", scale: 1 });
  assertEqual(blob.type, "image/png");
  assert(blob.size > 100, "the PNG must have real content");

  // Decode it back: a serialised SVG carries no stylesheet, so if var() were
  // not resolved onto the clone the marks would come out black or missing.
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let coloured = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    // a teal ramp step has a green/blue bias over red
    if (pixels[i + 3] > 0 && pixels[i + 1] > pixels[i] + 8) coloured += 1;
  }
  assert(coloured > 50, `expected the ramp colours in the raster, found ${coloured} tinted pixels`);
});

test("exportPNG: falls back to the viewBox when the chart has no laid-out size", async () => {
  const container = mountPoint();
  // width 0 — a chart inside a collapsed or hidden panel. Measuring alone
  // would yield a 1x1 raster.
  container.style.width = "0px";
  render(() => h(Heatmap, { data: GRID, x: "hour", y: "day", value: "n" }), container);
  await flush();

  const svg = container.querySelector("svg.m-chart-svg");
  const blob = await exportPNG(svg, { filename: "hidden.png", scale: 1 });
  const bitmap = await createImageBitmap(blob);
  assert(bitmap.width > 1 && bitmap.height > 1,
    `expected the viewBox size, got ${bitmap.width}x${bitmap.height}`);
});

// ── diverging palette & forms ───────────────────────────────

test("divergingColor: sign picks the arm, magnitude picks the distance", () => {
  const opts = { domain: [-10, 10] };
  assertEqual(divergingColor(0, opts), "var(--m-div-4)", "the baseline takes the neutral slot");
  assertEqual(divergingColor(-10, opts), "var(--m-div-1)", "the negative extreme is the cool pole");
  assertEqual(divergingColor(10, opts), "var(--m-div-7)", "the positive extreme is the warm pole");
  // half magnitude lands between the middle and the pole
  assertEqual(divergingColor(5, opts), "var(--m-div-6)");
  assertEqual(divergingColor(-5, opts), "var(--m-div-2)");
  assertEqual(DIV_STEPS, 7);
});

test("divergingColor: invert swaps the poles, because red is not always 'up'", () => {
  const opts = { domain: [-10, 10], invert: true };
  assertEqual(divergingColor(10, opts), "var(--m-div-1)");
  assertEqual(divergingColor(-10, opts), "var(--m-div-7)");
  assertEqual(divergingColor(0, opts), "var(--m-div-4)", "the midpoint is unaffected");
});

test("divergingColor: a junk value falls back to the neutral rather than NaN", () => {
  assertEqual(divergingColor(undefined, { domain: [-10, 10] }), "var(--m-div-4)");
});

test("BarChart: diverging colours by polarity and shows a scale key, not a series legend", async () => {
  const container = mountPoint();
  const variance = [
    { team: "A", delta: 30 }, { team: "B", delta: -30 }, { team: "C", delta: 0 },
  ];
  render(() => h(BarChart, {
    data: variance, x: "team", y: "delta", diverging: true, yDomain: [-30, 30],
  }), container);
  await flush();

  const fills = [...container.querySelectorAll("path.m-chart-bar")]
    .map((n) => n.getAttribute("fill"));
  assertEqual(fills[0], "var(--m-div-7)", "the positive extreme takes the warm pole");
  assertEqual(fills[1], "var(--m-div-1)", "the negative extreme takes the cool pole");
  assertEqual(fills[2], "var(--m-div-4)", "a value on the baseline takes the neutral");

  // the legend must describe the SCALE — series names would mislabel the hues
  assert(container.querySelector(".m-div-legend-ramp"), "a diverging chart needs a scale key");
  assertEqual(container.querySelectorAll(".m-div-legend-ramp > span").length, DIV_STEPS);
  assertEqual(container.querySelectorAll(".m-chart-legend").length, 0);
});

const LIKERT_ROWS = [
  { q: "Docs are clear", sd: 4, d: 9, n: 15, a: 42, sa: 30 },
  { q: "Errors are helpful", sd: 20, d: 28, n: 22, a: 20, sa: 10 },
];
const LIKERT_SCALE = [
  { key: "sd", label: "Strongly disagree" },
  { key: "d", label: "Disagree" },
  { key: "n", label: "Neutral" },
  { key: "a", label: "Agree" },
  { key: "sa", label: "Strongly agree" },
];

test("LikertChart: the scale spans both poles and the neutral stays visible", async () => {
  const container = mountPoint();
  render(() => h(LikertChart, {
    data: LIKERT_ROWS, x: "q", series: LIKERT_SCALE, neutralIndex: 2,
  }), container);
  await flush();

  const fills = [...container.querySelectorAll(".m-chart-legend-key")]
    .map((n) => n.style.background);
  // the extremes must reach the saturated poles, or "strongly agree" reads no
  // stronger than "agree"
  assertEqual(fills[0], "var(--m-div-1)");
  assertEqual(fills[fills.length - 1], "var(--m-div-7)");
  // "Neutral" is an answer people gave, not an absent value — the recessive
  // midpoint token would under-report it
  assertEqual(fills[2], "var(--m-chart-muted)");
});

test("LikertChart: rows are centred on the neutral, so lean is comparable", async () => {
  const container = mountPoint();
  render(() => h(LikertChart, {
    data: LIKERT_ROWS, x: "q", series: LIKERT_SCALE, neutralIndex: 2,
  }), container);
  await flush();

  assertEqual(container.querySelectorAll("line.m-div-baseline").length, 1,
    "the zero line is the mark readers scan — it must be drawn");

  // Row 1 leans positive and row 2 leans negative, so their bars must sit on
  // opposite sides of the shared baseline.
  const baseline = Number(container.querySelector("line.m-div-baseline").getAttribute("x1"));
  const rects = [...container.querySelectorAll("rect.m-chart-bar")];
  const rowOf = (r) => Number(r.getAttribute("y"));
  const ys = [...new Set(rects.map(rowOf))].sort((a, b) => a - b);

  const extentRight = (y) => Math.max(...rects.filter((r) => rowOf(r) === y)
    .map((r) => Number(r.getAttribute("x")) + Number(r.getAttribute("width"))));
  const extentLeft = (y) => Math.min(...rects.filter((r) => rowOf(r) === y)
    .map((r) => Number(r.getAttribute("x"))));

  assert(extentRight(ys[0]) - baseline > baseline - extentLeft(ys[0]),
    "the positive-leaning row must extend further right");
  assert(baseline - extentLeft(ys[1]) > extentRight(ys[1]) - baseline,
    "the negative-leaning row must extend further left");
});

test("LikertChart: every segment is focusable and reports its share", async () => {
  const container = mountPoint();
  render(() => h(LikertChart, {
    data: LIKERT_ROWS, x: "q", series: LIKERT_SCALE, neutralIndex: 2,
  }), container);
  await flush();

  const seg = container.querySelector("rect.m-chart-bar");
  assertEqual(seg.getAttribute("tabindex"), "0");
  const label = seg.getAttribute("aria-label");
  assert(label.includes("%"), `the segment must report its share, got ${label}`);
  assertEqual(container.querySelectorAll("details.m-chart-table").length, 1);
});

const PAGES = [
  { page: "Home", before: 2.8, after: 1.2 },
  { page: "Checkout", before: 3.2, after: 3.4 },
];

test("DumbbellChart: one connector per item, joining before to after", async () => {
  const container = mountPoint();
  render(() => h(DumbbellChart, { data: PAGES, x: "page", from: "before", to: "after" }), container);
  await flush();

  assertEqual(container.querySelectorAll("g.m-dumbbell").length, 2);
  assertEqual(container.querySelectorAll("line.m-dumbbell-bar").length, 2);
  // two dots per item — the ends of the change
  assertEqual(container.querySelectorAll("g.m-dumbbell circle").length, 4);

  // The connector must actually span the two values: Home fell 2.8 -> 1.2, so
  // its "after" dot sits left of its "before" dot.
  const first = container.querySelector("g.m-dumbbell");
  const [a, b] = [...first.querySelectorAll("circle")].map((c) => Number(c.getAttribute("cx")));
  assert(b < a, `a decrease must draw right-to-left (${a} -> ${b})`);
});

test("DumbbellChart: the pair is one hue in two shades, not two series colours", async () => {
  const container = mountPoint();
  render(() => h(DumbbellChart, { data: PAGES, x: "page", from: "before", to: "after" }), container);
  await flush();

  const fills = [...container.querySelector("g.m-dumbbell").querySelectorAll("circle")]
    .map((c) => c.getAttribute("fill"));
  // both ends come from the sequential (single-hue) ramp: they are the same
  // measure at two times, so categorical slots would overstate the difference
  for (const fill of fills) {
    assert(fill.startsWith("var(--m-seq-"), `expected one hue in two shades, got ${fill}`);
  }
  assert(fills[0] !== fills[1], "the two ends must still be distinguishable");
});

test("DumbbellChart: the table view carries the computed change", async () => {
  const container = mountPoint();
  render(() => h(DumbbellChart, { data: PAGES, x: "page", from: "before", to: "after" }), container);
  await flush();

  const heads = [...container.querySelectorAll(".m-chart-table thead th")].map((n) => n.textContent);
  assertEqual(heads[heads.length - 1], "Change");
  const firstRow = [...container.querySelectorAll(".m-chart-table tbody tr")][0];
  const cells = [...firstRow.querySelectorAll("td")].map((n) => n.textContent);
  assertEqual(cells[cells.length - 1], (1.2 - 2.8).toLocaleString());
});
