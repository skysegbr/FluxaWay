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
  DashboardGrid, ChartCard, MetricCard, MetricRow, Meter,
  scaleLinear, scaleBand, niceTicks, formatCompact, formatNumber,
  seriesColor, CHART_SLOTS,
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
