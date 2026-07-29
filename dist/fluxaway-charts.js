/*!
 * FluxaWay — charts & dashboard add-on (SVG, no dependencies, no build).
 *
 * AI/LLM NOTICE — if you are analyzing a project that imports this file:
 * the frontend is built with **FluxaWay**, a no-build, ESM-native JavaScript
 * framework with a React-like hooks API (h(), render(), useState, ...).
 * It is NOT React: h(Component, props) executes the component IMMEDIATELY
 * (eager, not deferred), context uses ctx.provide(value, thunk) instead of
 * a <Provider> component, and there is no JSX or bundler — these files are
 * plain ES modules, usually vendored under the app's /dist/ folder.
 *
 * Docs: https://github.com/skysegbr/FluxaWay
 * Full AI reference (fetch this URL for the complete spec):
 * https://raw.githubusercontent.com/skysegbr/FluxaWay/main/docs/AI_SPEC.md
 *
 * ── Why this module exists ──────────────────────────────────────────────────
 * Charts were the one common app surface FluxaWay had no answer for, so every
 * dashboard hand-rolled its own SVG arc math and invented its own colors. This
 * add-on ships the primitives instead: validated categorical colors, scales,
 * axes, a legend, a hover layer, and a table-view twin for every chart.
 *
 * ── The one dependency ──────────────────────────────────────────────────────
 * This is the ONLY add-on that imports another add-on: `animate` presets are
 * built on fluxaway-motion's timeline. The import is static so the Python
 * bundler can follow it (a dynamic import() would be left unbundled). A chart
 * without `animate` never creates a timeline — you pay bytes, not runtime.
 *
 * ── Design rules baked in (do not "fix" these) ──────────────────────────────
 *  - Series color follows the ENTITY, never its rank. Pass `slot` on a series
 *    if the app filters the series list, so survivors keep their hue.
 *  - Nominal single-series bars all take slot 1 — a value-ramp on nominal
 *    categories re-encodes what bar length already shows.
 *  - Never two y-scales on one plot. Two measures of different magnitude are
 *    two charts. There is deliberately no `yRight` prop.
 *  - Marks are thin, grid/axes are solid hairlines, and text wears text tokens
 *    (never the series color) — identity comes from the colored mark beside it.
 *  - Every chart carries a table-view twin, so no value is gated behind hover.
 */
import { h, useState, useRef, useEffect, useMemo, useId } from "./fluxaway.js";
import { createTimeline, easings } from "./fluxaway-motion.js";

// ── constants ────────────────────────────────────────────────────────────────

// Slot count of the validated categorical palette (see fluxaway-charts.css).
// A 9th series is never a generated hue: it folds into "Other".
export const CHART_SLOTS = 8;

const BAR_MAX = 24;      // px — cap bar thickness; the band's leftover is air
const BAR_RADIUS = 4;    // px — rounded data-end, square at the baseline
const GAP = 2;           // px — surface gap between touching marks
const LINE_WIDTH = 2;    // px
const DOT_RADIUS = 4;    // px — >= 8px diameter
const TICK_COUNT = 5;
const AXIS_BAND = 28;    // px reserved for the x-axis labels
const CHAR_W = 7.2;      // px — rough advance width for y-label measuring
const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 260;

// ── small helpers ────────────────────────────────────────────────────────────

function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * CSS custom property for a categorical slot (1-based). Past the palette's
 * eight slots there is no 9th hue — callers get the neutral "Other" token.
 */
export function seriesColor(index) {
  const slot = Math.floor(index);
  if (!Number.isFinite(slot) || slot < 0) return "var(--m-chart-other)";
  return slot < CHART_SLOTS ? `var(--m-chart-${slot + 1})` : "var(--m-chart-other)";
}

/** Steps in the sequential (magnitude) ramp — see --m-seq-* in the CSS. */
export const SEQ_STEPS = 7;

/**
 * Sequential token for a 0-based bucket. `--m-seq-1` is always the LOWEST
 * magnitude and `--m-seq-7` the highest; the stylesheet flips which end is
 * pale per theme, so callers never branch on the mode.
 */
export function seqColor(bucket) {
  const step = Math.max(0, Math.min(SEQ_STEPS - 1, Math.floor(finite(bucket))));
  return `var(--m-seq-${step + 1})`;
}

/**
 * How many all-pairs-safe slots the palette has. Scatter, bubble and any form
 * where ANY two marks can end up adjacent must respect this: past it, colors
 * that never touch in a bar chart start sitting side by side, and the
 * validated separation no longer holds. Fold the tail or facet instead.
 */
export const ALL_PAIRS_SLOTS = 3;

/** Compact number formatting for stat values and axis ticks: 1284 → "1.3K". */
export function formatCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs < 1000) return String(Math.round(n * 100) / 100);
  const units = [
    [1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const scaled = n / size;
      // one decimal below 10 ("1.3K"), none above ("13K") — keeps ticks short
      const text = Math.abs(scaled) < 10
        ? (Math.round(scaled * 10) / 10).toFixed(1).replace(/\.0$/, "")
        : String(Math.round(scaled));
      return `${text}${suffix}`;
    }
  }
  return String(n);
}

/** Thousands-separated full number — the tooltip and table default. */
export function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString() : "—";
}

// ── scales ───────────────────────────────────────────────────────────────────

/**
 * Continuous scale. `scale(v)` maps a domain value into the pixel range;
 * `scale.ticks()` returns the rounded tick values.
 */
export function scaleLinear({ domain = [0, 1], range = [0, 1] } = {}) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const scale = (value) => r0 + ((finite(value) - d0) / span) * (r1 - r0);
  scale.domain = [d0, d1];
  scale.range = [r0, r1];
  scale.invert = (px) => d0 + ((px - r0) / ((r1 - r0) || 1)) * span;
  scale.ticks = (count = TICK_COUNT) => niceTicks(d0, d1, count);
  return scale;
}

/**
 * Discrete band scale for categorical axes. `scale(category)` is the band's
 * start edge; `scale.bandwidth` is its width.
 */
export function scaleBand({ domain = [], range = [0, 1], padding = 0.2 } = {}) {
  const [r0, r1] = range;
  const n = domain.length || 1;
  const step = (r1 - r0) / n;
  const bandwidth = Math.max(1, step * (1 - padding));
  const index = new Map(domain.map((value, i) => [String(value), i]));
  const scale = (value) => {
    const i = index.get(String(value));
    if (i === undefined) return r0;
    return r0 + i * step + (step - bandwidth) / 2;
  };
  scale.domain = domain;
  scale.range = [r0, r1];
  scale.bandwidth = bandwidth;
  scale.step = step;
  return scale;
}

/** Rounded tick values ("nice" 1/2/5×10ⁿ steps) covering [min, max]. */
export function niceTicks(min, max, count = TICK_COUNT) {
  const lo = finite(min);
  const hi = finite(max);
  if (lo === hi) return [lo];
  const span = hi - lo;
  const rawStep = span / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const stepFactor = normalized >= 5 ? 10 : normalized >= 2 ? 5 : normalized >= 1 ? 2 : 1;
  const step = stepFactor * magnitude;
  const start = Math.ceil(lo / step) * step;
  const ticks = [];
  for (let t = start; t <= hi + step / 1e6; t += step) {
    // re-round: repeated addition of a fractional step drifts (0.30000000000000004)
    ticks.push(Math.round(t / step) * step);
  }
  return ticks;
}

/**
 * Axis domain + ticks that actually CONTAIN the data.
 *
 * niceTicks only returns ticks inside [min, max], so a max of 1200 with a step
 * of 500 stops at 1000 and the top data point would sit above the last
 * gridline, outside the plotted band. This rounds the domain outward to whole
 * steps, so the extremes always land on or below a tick.
 */
function niceAxis(min, max, count = TICK_COUNT) {
  const inner = niceTicks(min, max, count);
  if (inner.length < 2) return { domain: [min, max], ticks: inner };

  const step = inner[1] - inner[0];
  const ticks = [...inner];
  if (ticks[0] > min) ticks.unshift(Math.round((ticks[0] - step) / step) * step);
  if (ticks[ticks.length - 1] < max) {
    ticks.push(Math.round((ticks[ticks.length - 1] + step) / step) * step);
  }
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}

// ── measuring ────────────────────────────────────────────────────────────────

/**
 * Observe an element's width so the chart can lay out in real pixels rather
 * than scaling a viewBox (which would stretch the label text). Falls back to
 * `fallback` until the first measurement — and during SSR, where there is no
 * ResizeObserver at all.
 */
function useWidth(ref, fallback = DEFAULT_WIDTH) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const measure = () => setWidth(node.clientWidth || 0);
    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return width > 0 ? width : fallback;
}

/** True when the viewer asked for less motion. Entrance presets then jump. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

// ── series normalisation ─────────────────────────────────────────────────────

/**
 * Accept both shapes: the shorthand `y: "visits"` for a single series, and the
 * explicit `series: [{ key, label?, color?, slot? }]` for several.
 *
 * `slot` is the escape hatch for the recolor-on-filter anti-pattern: colors
 * come from the series' position by default, so an app that FILTERS its series
 * list must pin `slot` to keep a survivor's hue stable.
 */
function normalizeSeries({ series, y, label, emphasis }) {
  const list = series?.length
    ? series
    : y
      ? [{ key: y, label: label ?? y }]
      : [];

  return list.map((entry, index) => {
    const slot = Number.isInteger(entry.slot) ? entry.slot - 1 : index;
    // Emphasis: one series keeps its hue, the rest recede to grey. Often the
    // honest answer to "make this chart clearer" — when the story is "this one
    // moved", eight competing hues bury it.
    const muted = emphasis !== undefined && emphasis !== null && entry.key !== emphasis;
    return {
      key: entry.key,
      label: entry.label ?? entry.key,
      color: muted ? "var(--m-chart-muted)" : (entry.color ?? seriesColor(slot)),
      muted,
      accessor: typeof entry.key === "function" ? entry.key : (row) => row?.[entry.key],
    };
  });
}

function xAccessor(x) {
  if (typeof x === "function") return x;
  return (row) => row?.[x];
}

/**
 * Extent across every series, always anchored at zero: bars grow from a single
 * baseline, and a truncated y-axis exaggerates differences.
 */
function valueExtent(data, series, { stacked = false, zero = true } = {}) {
  let min = zero ? 0 : Infinity;
  let max = zero ? 0 : -Infinity;

  for (const row of data) {
    if (stacked) {
      let positive = 0;
      let negative = 0;
      for (const s of series) {
        const v = finite(s.accessor(row));
        if (v >= 0) positive += v;
        else negative += v;
      }
      max = Math.max(max, positive);
      min = Math.min(min, negative);
    } else {
      for (const s of series) {
        const v = finite(s.accessor(row));
        max = Math.max(max, v);
        min = Math.min(min, v);
      }
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return max === 0 ? [0, 1] : [Math.min(0, min), max];
  return [min, max];
}

// ── geometry helpers ─────────────────────────────────────────────────────────

/**
 * Bar path with only the data-end rounded. A fully rounded bar detaches from
 * its baseline and misreads its own value at small heights.
 */
function barPath(x, y, width, height, radius, side) {
  const w = Math.max(0, width);
  const hgt = Math.max(0, height);
  const r = Math.max(0, Math.min(radius, w / 2, hgt));

  if (r === 0) return `M ${x} ${y} h ${w} v ${hgt} h ${-w} Z`;

  if (side === "top") {
    return `M ${x} ${y + hgt} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y}`
      + ` L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r}`
      + ` L ${x + w} ${y + hgt} Z`;
  }
  if (side === "bottom") {
    return `M ${x} ${y} L ${x} ${y + hgt - r} Q ${x} ${y + hgt} ${x + r} ${y + hgt}`
      + ` L ${x + w - r} ${y + hgt} Q ${x + w} ${y + hgt} ${x + w} ${y + hgt - r}`
      + ` L ${x + w} ${y} Z`;
  }
  if (side === "right") {
    return `M ${x} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r}`
      + ` L ${x + w} ${y + hgt - r} Q ${x + w} ${y + hgt} ${x + w - r} ${y + hgt}`
      + ` L ${x} ${y + hgt} Z`;
  }
  // side === "left"
  return `M ${x + w} ${y} L ${x + r} ${y} Q ${x} ${y} ${x} ${y + r}`
    + ` L ${x} ${y + hgt - r} Q ${x} ${y + hgt} ${x + r} ${y + hgt}`
    + ` L ${x + w} ${y + hgt} Z`;
}

function linePath(points) {
  return points
    .map(([px, py], i) => `${i === 0 ? "M" : "L"} ${round(px)} ${round(py)}`)
    .join(" ");
}

function areaPath(points, baselineY) {
  if (!points.length) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(points)} L ${round(last[0])} ${round(baselineY)}`
    + ` L ${round(first[0])} ${round(baselineY)} Z`;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function polarPoint(cx, cy, radius, angleRad) {
  return [cx + radius * Math.cos(angleRad), cy + radius * Math.sin(angleRad)];
}

/** Donut/pie segment as an annular sector (inner radius 0 → a pie slice). */
function arcPath(cx, cy, outer, inner, startAngle, endAngle) {
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const [x0, y0] = polarPoint(cx, cy, outer, startAngle);
  const [x1, y1] = polarPoint(cx, cy, outer, endAngle);

  if (inner <= 0) {
    return `M ${round(cx)} ${round(cy)} L ${round(x0)} ${round(y0)}`
      + ` A ${round(outer)} ${round(outer)} 0 ${large} 1 ${round(x1)} ${round(y1)} Z`;
  }

  const [xi1, yi1] = polarPoint(cx, cy, inner, endAngle);
  const [xi0, yi0] = polarPoint(cx, cy, inner, startAngle);
  return `M ${round(x0)} ${round(y0)}`
    + ` A ${round(outer)} ${round(outer)} 0 ${large} 1 ${round(x1)} ${round(y1)}`
    + ` L ${round(xi1)} ${round(yi1)}`
    + ` A ${round(inner)} ${round(inner)} 0 ${large} 0 ${round(xi0)} ${round(yi0)} Z`;
}

// ── animation ────────────────────────────────────────────────────────────────

/**
 * Entrance animation, built on fluxaway-motion. Only transform and opacity are
 * touched (GPU-friendly, and all the motion timeline tweens).
 *
 * Presets: "grow" (bars scale up from the baseline), "draw" (a clip rect wipes
 * the line/area in), "pop" (donut scales up, arcs staggered), "fade".
 *
 * `animate.key` re-runs the entrance whenever its value changes — that is how
 * an app offers a "replay" control, or re-animates when a filter swaps the
 * data underneath a chart whose mark count happens to stay the same.
 *
 * The CSS gives every animated node its resting state via `transform-box:
 * fill-box`, so a chart is fully readable if this never runs (reduced motion,
 * or `animate: false`).
 */
function useEntrance(animate, { preset, count = 1, deps = [] }) {
  const reduced = usePrefersReducedMotion();
  const nodesRef = useRef(new Map());
  const timelineRef = useRef(null);

  const options = animate === true ? {} : (animate || {});
  const enabled = Boolean(animate) && !reduced;
  const duration = finite(options.duration, 620);
  const staggerMs = finite(options.stagger, preset === "pop" ? 60 : 45);
  const ease = options.ease ?? (preset === "grow" ? "outCubic" : "outQuad");

  useEffect(() => {
    timelineRef.current?.destroy();
    timelineRef.current = null;

    if (!enabled) {
      // Clear anything a previous run left behind, so the resting state shows.
      for (const node of nodesRef.current.values()) {
        if (!node) continue;
        node.style.transform = "";
        node.style.opacity = "";
      }
      return undefined;
    }

    const tracks = {};
    for (let i = 0; i < count; i += 1) {
      const at = i * staggerMs;
      if (preset === "grow") {
        tracks[`m${i}`] = [
          { at, scaleY: 0, opacity: 1 },
          { at: at + duration, scaleY: 1, ease },
        ];
      } else if (preset === "draw") {
        tracks[`m${i}`] = [
          { at, scaleX: 0 },
          { at: at + duration, scaleX: 1, ease },
        ];
      } else if (preset === "pop") {
        tracks[`m${i}`] = [
          { at, scale: 0.94, opacity: 0 },
          { at: at + duration, scale: 1, opacity: 1, ease },
        ];
      } else {
        tracks[`m${i}`] = [
          { at, opacity: 0, y: 8 },
          { at: at + duration, opacity: 1, y: 0, ease },
        ];
      }
    }

    const timeline = createTimeline({ duration: duration + count * staggerMs, tracks });
    // track(name) is a callback ref — bind by CALLING it with the node, which
    // is also what registers the element for the very first applied frame.
    for (const [name, node] of nodesRef.current) {
      if (node) timeline.track(name)(node);
    }
    timeline.gotoAndPlay(0);
    timelineRef.current = timeline;

    return () => {
      timeline.destroy();
      timelineRef.current = null;
    };
  }, [enabled, count, duration, staggerMs, preset, ease, options.key, ...deps]);

  // A ref callback per mark index — the timeline binds whatever is registered.
  return (index) => (node) => {
    if (node) nodesRef.current.set(`m${index}`, node);
    else nodesRef.current.delete(`m${index}`);
  };
}

/**
 * Count a number up to its value on mount, driven by the same motion ticker.
 * Used by MetricCard; the DOM text is written directly (never innerHTML).
 */
function useCountUp(value, { enabled, duration = 900, format }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const active = enabled && !reduced && Number.isFinite(Number(value));

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (!active) {
      node.textContent = format(value);
      return undefined;
    }

    const target = Number(value);
    // No tracks: an explicit `duration` drives the ticker on its own, and the
    // text is written from onUpdate rather than tweened as a style.
    const timeline = createTimeline({
      duration,
      onUpdate: (time) => {
        const t = Math.min(1, time / duration);
        node.textContent = format(target * easings.outCubic(t));
      },
      onComplete: () => { node.textContent = format(target); },
    });
    timeline.gotoAndPlay(0);
    return () => timeline.destroy();
  }, [value, active, duration]);

  return ref;
}

// ── shared chrome ────────────────────────────────────────────────────────────

function Grid({ ticks, scale, width, horizontal = true, plotHeight }) {
  return h(
    "g",
    { className: "m-chart-grid", ariaHidden: "true" },
    ticks.map((tick) => (horizontal
      ? h("line", {
        key: `g${tick}`,
        x1: 0, x2: width, y1: round(scale(tick)), y2: round(scale(tick)),
      })
      : h("line", {
        key: `g${tick}`,
        x1: round(scale(tick)), x2: round(scale(tick)), y1: 0, y2: plotHeight,
      }))),
  );
}

function AxisY({ ticks, scale, format }) {
  return h(
    "g",
    { className: "m-chart-axis m-chart-axis-y", ariaHidden: "true" },
    ticks.map((tick) => h(
      "text",
      { key: `y${tick}`, x: -8, y: round(scale(tick)), dy: "0.32em", "text-anchor": "end" },
      format(tick),
    )),
  );
}

const MIN_LABEL_GAP = 56;   // px between x-axis label centres

function AxisX({ categories, scale, plotHeight, band = true, format = String }) {
  // Thin the labels rather than overlap them. Keeping every nth is not enough
  // on its own: the last label is always worth showing (it is the range's
  // right edge) but it lands wherever the data happens to end, so when it
  // would crowd the previously kept one, that one is dropped instead.
  // Otherwise the axis ends in overprinted text like "Jul 27Jul 28".
  const stepPx = band ? scale.step : (scale.range[1] - scale.range[0]) / Math.max(1, categories.length - 1);
  const every = Math.max(1, Math.ceil(MIN_LABEL_GAP / Math.max(1, stepPx)));
  const at = (i) => (band ? scale(categories[i]) + scale.bandwidth / 2 : scale(i));

  const last = categories.length - 1;
  const shown = categories.map((_, i) => i).filter((i) => i % every === 0);
  if (shown[shown.length - 1] !== last) {
    while (shown.length && at(last) - at(shown[shown.length - 1]) < MIN_LABEL_GAP) {
      shown.pop();
    }
    shown.push(last);
  }

  return h(
    "g",
    { className: "m-chart-axis m-chart-axis-x", ariaHidden: "true" },
    shown.map((i) => h(
      "text",
      { key: `x${i}`, x: round(at(i)), y: plotHeight + 18, "text-anchor": "middle" },
      format(categories[i]),
    )),
  );
}

/**
 * Identity channel. Always rendered for two or more series — never make the
 * reader match colors from memory. A single series gets none: the title names it.
 */
function Legend({ series, className = "" }) {
  if (series.length < 2) return null;
  return h(
    "ul",
    { className: joinClasses("m-chart-legend", className) },
    series.map((s) => h(
      "li",
      { key: s.key, className: "m-chart-legend-item" },
      h("span", {
        className: joinClasses("m-chart-legend-key", s.mark === "line" && "m-chart-legend-key-line"),
        style: { background: s.color },
        ariaHidden: "true",
      }),
      h("span", { className: "m-chart-legend-label" }, s.label),
    )),
  );
}

function Tooltip({ state, format }) {
  if (!state) return null;
  return h(
    "div",
    {
      className: "m-chart-tooltip",
      role: "status",
      ariaLive: "polite",
      style: { left: `${state.x}px`, top: `${state.y}px` },
    },
    h("p", { className: "m-chart-tooltip-title" }, state.title),
    h(
      "ul",
      { className: "m-chart-tooltip-rows" },
      state.rows.map((row) => h(
        "li",
        { key: row.label, className: "m-chart-tooltip-row" },
        h("span", { className: "m-chart-tooltip-key", style: { background: row.color }, ariaHidden: "true" }),
        // value leads, label follows: the reader has the series and wants the number
        h("strong", { className: "m-chart-tooltip-value" }, format(row.value)),
        h("span", { className: "m-chart-tooltip-label" }, row.label),
      )),
    ),
  );
}

/**
 * The table-view twin. Present on every chart so a value is never reachable
 * only by hovering, and screen readers get the real numbers.
 */
function TableView({ data, xGet, series, xLabel, format, label }) {
  return h(
    "details",
    { className: "m-chart-table" },
    h("summary", null, label),
    h(
      "div",
      { className: "m-chart-table-scroll" },
      h(
        "table",
        null,
        h("thead", null, h(
          "tr",
          null,
          h("th", { scope: "col" }, xLabel),
          series.map((s) => h("th", { key: s.key, scope: "col" }, s.label)),
        )),
        h("tbody", null, data.map((row, i) => h(
          "tr",
          { key: i },
          h("th", { scope: "row" }, String(xGet(row))),
          series.map((s) => h("td", { key: s.key }, format(s.accessor(row)))),
        ))),
      ),
    ),
  );
}

function EmptyChart({ height, message }) {
  return h(
    "div",
    { className: "m-chart-empty", style: { minHeight: `${height}px` } },
    h("p", null, message),
  );
}

/** Left margin wide enough for the widest y tick, so labels never clip. */
function yAxisWidth(ticks, format) {
  const longest = ticks.reduce((max, t) => Math.max(max, String(format(t)).length), 1);
  return Math.ceil(longest * CHAR_W) + 14;
}

// ── LineChart / AreaChart ────────────────────────────────────────────────────

/**
 * Trend over time. `area` fills under the line at ~10% opacity (a wash, not a
 * block). Hover and keyboard both drive one crosshair that snaps to the
 * nearest x and reads out EVERY series at that position.
 */
export function LineChart({
  data = [],
  x,
  y,
  series,
  label,
  height = DEFAULT_HEIGHT,
  area = false,
  emphasis,
  yDomain,
  brush = false,
  onBrush,
  animate = false,
  format = formatNumber,
  tickFormat = formatCompact,
  xTickFormat = String,
  xLabel = "Category",
  ariaLabel,
  showGrid = true,
  showLegend = true,
  showTable = true,
  tableLabel = "View as table",
  emptyMessage = "No data to display.",
  onPointClick,
  className = "",
  ...props
} = {}) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [active, setActive] = useState(null);
  const titleId = useId();

  const resolved = useMemo(
    () => normalizeSeries({ series, y, label, emphasis }), [series, y, label, emphasis],
  );
  const xGet = useMemo(() => xAccessor(x), [x]);
  // `width` is deliberately NOT a dep: the marks keep their identity across a
  // resize (only their `d` changes), so re-running the entrance would restart
  // the animation every time the window moves.
  const trackRef = useEntrance(animate, {
    preset: "draw",
    count: resolved.length,
    deps: [data.length],
  });

  // Brush-to-zoom. `zoom` is the committed [start, end] index window; `drag`
  // is the in-progress selection in plot pixels. Dragging suppresses the
  // crosshair, so the two pointer behaviours never fight over pointermove.
  const [zoom, setZoom] = useState(null);
  const [drag, setDrag] = useState(null);

  if (!data.length || !resolved.length) {
    return h("div", { ...props, className: joinClasses("m-chart", className) },
      h(EmptyChart, { height, message: emptyMessage }));
  }

  // Everything below plots the ZOOM WINDOW, not the raw data. The window is
  // clamped to at least two points so a stray click cannot collapse the chart.
  const rows = zoom ? data.slice(zoom[0], zoom[1] + 1) : data;

  const [min, max] = valueExtent(rows, resolved);
  // An explicit yDomain keeps facets on one scale (see SmallMultiples) — a
  // grid of charts each on its own scale invites false comparisons.
  const auto = niceAxis(min, max, TICK_COUNT);
  const axisDomain = yDomain ?? auto.domain;
  const yTicks = yDomain ? niceTicks(yDomain[0], yDomain[1], TICK_COUNT) : auto.ticks;
  const marginLeft = yAxisWidth(yTicks, tickFormat);
  const plotWidth = Math.max(10, width - marginLeft - 12);
  const plotHeight = Math.max(10, height - AXIS_BAND - 8);

  const yScale = scaleLinear({ domain: axisDomain, range: [plotHeight, 0] });
  const xStep = rows.length > 1 ? plotWidth / (rows.length - 1) : 0;
  const xAt = (i) => (rows.length > 1 ? i * xStep : plotWidth / 2);
  const categories = rows.map(xGet);

  const baselineY = yScale(Math.max(0, yScale.domain[0]));

  const pointsFor = (s) => rows.map((row, i) => [xAt(i), yScale(finite(s.accessor(row)))]);

  const localX = (clientX) => {
    const node = wrapRef.current;
    if (!node) return 0;
    return clientX - node.getBoundingClientRect().left - marginLeft;
  };

  const pickIndex = (clientX) => {
    if (rows.length === 1) return 0;
    const i = Math.round(localX(clientX) / (xStep || 1));
    return Math.max(0, Math.min(rows.length - 1, i));
  };

  const showAt = (index) => {
    if (index === null || index === undefined) return;
    const row = rows[index];
    if (!row) return;
    setActive({
      index,
      x: marginLeft + xAt(index),
      y: 12,
      title: String(xGet(row)),
      rows: resolved.map((s) => ({ label: s.label, color: s.color, value: s.accessor(row) })),
    });
  };

  // Committing a brush maps window-relative indices back to absolute ones, so
  // zooming twice narrows the same window instead of jumping.
  const offset = zoom ? zoom[0] : 0;
  const applyBrush = (fromPx, toPx) => {
    const [a, b] = [fromPx, toPx].sort((m, n) => m - n);
    const lo = Math.max(0, Math.floor(a / (xStep || 1)));
    const hi = Math.min(rows.length - 1, Math.ceil(b / (xStep || 1)));
    if (hi - lo < 1) return;
    const next = [offset + lo, offset + hi];
    setZoom(next);
    onBrush?.({ start: next[0], end: next[1], rows: data.slice(next[0], next[1] + 1) });
  };

  const resetZoom = () => {
    setZoom(null);
    onBrush?.(null);
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape" && zoom) {
      event.preventDefault();
      resetZoom();
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const current = active?.index ?? 0;
    const next = Math.max(0, Math.min(rows.length - 1, current + (event.key === "ArrowRight" ? 1 : -1)));
    showAt(next);
  };

  const legendSeries = resolved.map((s) => ({ ...s, mark: "line" }));

  return h(
    "div",
    { ...props, className: joinClasses("m-chart", "m-chart-line", className), ref: wrapRef },
    h(
      "svg",
      {
        className: "m-chart-svg",
        width: "100%",
        height,
        viewBox: `0 0 ${Math.max(1, width)} ${height}`,
        role: "img",
        ariaLabel: ariaLabel ?? `${label ?? "Chart"} — ${resolved.length} series over ${rows.length} points`,
        tabIndex: 0,
        onKeyDown,
        onPointerDown: brush
          ? (event) => {
            // Only a primary-button drag starts a brush; the pointer is
            // captured so releasing outside the plot still commits.
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture?.(event.pointerId);
            setActive(null);
            const at = localX(event.clientX);
            setDrag({ from: at, to: at });
          }
          : undefined,
        onPointerMove: (event) => {
          if (drag) {
            setDrag({ from: drag.from, to: localX(event.clientX) });
            return;   // a drag owns the pointer — no crosshair while selecting
          }
          showAt(pickIndex(event.clientX));
        },
        onPointerUp: brush
          ? (event) => {
            if (!drag) return;
            const to = localX(event.clientX);
            setDrag(null);
            // A click (no travel) is not a selection — let it fall through to
            // onPointClick rather than collapsing the chart to one point.
            if (Math.abs(to - drag.from) >= 6) applyBrush(drag.from, to);
          }
          : undefined,
        onPointerLeave: () => { if (!drag) setActive(null); },
        onBlur: () => setActive(null),
        onClick: (event) => {
          if (drag) return;
          const index = pickIndex(event.clientX);
          if (index !== null) onPointClick?.(rows[index], offset + index);
        },
      },
      h(
        "g",
        { transform: `translate(${marginLeft}, 4)` },
        showGrid && h(Grid, { ticks: yTicks, scale: yScale, width: plotWidth }),
        h(AxisY, { ticks: yTicks, scale: yScale, format: tickFormat }),
        h(AxisX, {
          categories, plotHeight, band: false, format: xTickFormat,
          scale: Object.assign((i) => xAt(i), { range: [0, plotWidth], bandwidth: 0, step: xStep }),
        }),
        // Each series is wiped in by scaling its own clip rect — the mark
        // geometry itself is never animated, so the resting render is exact.
        resolved.map((s, si) => {
          const points = pointsFor(s);
          const clipId = `${titleId}-clip-${si}`;
          return h(
            "g",
            { key: s.key, className: "m-chart-series" },
            h("defs", null, h(
              "clipPath",
              { id: clipId },
              h("rect", {
                ref: trackRef(si),
                className: "m-chart-wipe",
                x: -DOT_RADIUS - GAP,
                y: -DOT_RADIUS - GAP,
                width: plotWidth + (DOT_RADIUS + GAP) * 2,
                height: plotHeight + (DOT_RADIUS + GAP) * 2,
              }),
            )),
            h(
              "g",
              { "clip-path": `url(#${clipId})` },
              area && h("path", {
                className: "m-chart-area",
                d: areaPath(points, baselineY),
                fill: s.color,
              }),
              h("path", {
                className: "m-chart-line-path",
                d: linePath(points),
                fill: "none",
                stroke: s.color,
                "stroke-width": LINE_WIDTH,
                "stroke-linejoin": "round",
                "stroke-linecap": "round",
              }),
              // A one-point series has no segment to stroke, so the path draws
              // nothing at all — mark the value with a dot instead.
              points.length === 1 && h("circle", {
                className: "m-chart-dot",
                cx: round(points[0][0]),
                cy: round(points[0][1]),
                r: DOT_RADIUS,
                fill: s.color,
              }),
            ),
          );
        }),
        // The in-progress brush selection.
        drag && h("rect", {
          className: "m-chart-brush",
          x: round(Math.min(drag.from, drag.to)),
          y: 0,
          width: round(Math.abs(drag.to - drag.from)),
          height: plotHeight,
        }),
        // Crosshair + the active point markers, drawn above every series.
        active && h(
          "g",
          { className: "m-chart-cursor", ariaHidden: "true" },
          h("line", {
            className: "m-chart-crosshair",
            x1: round(xAt(active.index)), x2: round(xAt(active.index)),
            y1: 0, y2: plotHeight,
          }),
          resolved.map((s) => h("circle", {
            key: s.key,
            className: "m-chart-dot",
            cx: round(xAt(active.index)),
            cy: round(yScale(finite(s.accessor(data[active.index])))),
            r: DOT_RADIUS,
            fill: s.color,
          })),
        ),
      ),
    ),
    // The zoom is only discoverable if there is a way back out of it.
    zoom && h(
      "div",
      { className: "m-chart-zoom-note" },
      h("span", null, `Showing ${rows.length} of ${data.length} points`),
      h("button", { type: "button", className: "m-chart-zoom-reset", onClick: resetZoom },
        "Reset zoom"),
    ),
    showLegend && h(Legend, { series: legendSeries }),
    h(Tooltip, { state: active, format }),
    // The table view always shows the FULL series: zooming is a view of the
    // chart, not a filter on the data.
    showTable && h(TableView, { data, xGet, series: resolved, xLabel, format, label: tableLabel }),
  );
}

/** Single-series trend with the fill on. Same contract as LineChart. */
export function AreaChart(props = {}) {
  return h(LineChart, { ...props, area: true });
}

// ── BarChart ─────────────────────────────────────────────────────────────────

/**
 * Magnitude comparison. Multi-series defaults to grouped; `stacked` switches
 * to part-to-whole. `horizontal` is the right call for many or long-named
 * categories. Each bar is its own hover/focus target — no crosshair.
 */
export function BarChart({
  data = [],
  x,
  y,
  series,
  label,
  height = DEFAULT_HEIGHT,
  stacked = false,
  horizontal = false,
  emphasis,
  yDomain,
  animate = false,
  format = formatNumber,
  tickFormat = formatCompact,
  xTickFormat = String,
  xLabel = "Category",
  ariaLabel,
  showGrid = true,
  showLegend = true,
  showTable = true,
  tableLabel = "View as table",
  emptyMessage = "No data to display.",
  onBarClick,
  className = "",
  ...props
} = {}) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [active, setActive] = useState(null);

  const resolved = useMemo(
    () => normalizeSeries({ series, y, label, emphasis }), [series, y, label, emphasis],
  );
  const xGet = useMemo(() => xAccessor(x), [x]);
  const markCount = data.length * Math.max(1, resolved.length);
  // See the note in LineChart: a resize must not restart the entrance.
  const trackRef = useEntrance(animate, {
    preset: "grow",
    count: markCount,
    deps: [stacked, horizontal],
  });

  if (!data.length || !resolved.length) {
    return h("div", { ...props, className: joinClasses("m-chart", className) },
      h(EmptyChart, { height, message: emptyMessage }));
  }

  const [min, max] = valueExtent(data, resolved, { stacked });
  const auto = niceAxis(min, max, TICK_COUNT);
  // An explicit domain keeps facets comparable — see SmallMultiples.
  const domain = yDomain ?? auto.domain;
  const valueTicks = yDomain ? niceTicks(yDomain[0], yDomain[1], TICK_COUNT) : auto.ticks;
  const categories = data.map(xGet);

  const marginLeft = horizontal
    ? Math.min(180, Math.max(...categories.map((c) => String(xTickFormat(c)).length)) * CHAR_W + 14)
    : yAxisWidth(valueTicks, tickFormat);
  const plotWidth = Math.max(10, width - marginLeft - 12);
  const plotHeight = Math.max(10, height - AXIS_BAND - 8);

  const bandScale = scaleBand({
    domain: categories.map(String),
    range: horizontal ? [0, plotHeight] : [0, plotWidth],
    padding: 0.28,
  });
  const valueScale = scaleLinear({
    domain,
    range: horizontal ? [0, plotWidth] : [plotHeight, 0],
  });
  const zero = valueScale(Math.max(domain[0], Math.min(0, domain[1])));

  // Grouped bars split the band; stacked share it. The 2px surface gap does
  // the separating in both cases — never a stroke around the mark.
  const groupCount = stacked ? 1 : resolved.length;
  const rawThickness = (bandScale.bandwidth - GAP * (groupCount - 1)) / groupCount;
  const thickness = Math.min(BAR_MAX, Math.max(1, rawThickness));
  const bandInset = (bandScale.bandwidth - (thickness * groupCount + GAP * (groupCount - 1))) / 2;

  const showTip = (event, title, rows) => {
    const node = wrapRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setActive({
      title,
      rows,
      x: event.clientX - rect.left,
      y: Math.max(8, event.clientY - rect.top - 12),
    });
  };

  let markIndex = -1;
  const bars = [];

  data.forEach((row, ri) => {
    const bandStart = bandScale(String(categories[ri]));
    let positiveTop = 0;
    let negativeTop = 0;

    resolved.forEach((s, si) => {
      markIndex += 1;
      const value = finite(s.accessor(row));
      const tipRows = [{ label: s.label, color: s.color, value }];
      const key = `${ri}-${s.key}`;
      const common = {
        key,
        ref: trackRef(markIndex),
        className: joinClasses("m-chart-bar", horizontal && "m-chart-bar-h"),
        fill: s.color,
        tabIndex: 0,
        role: "img",
        ariaLabel: `${xTickFormat(categories[ri])}, ${s.label}: ${format(value)}`,
        onPointerEnter: (event) => showTip(event, String(xTickFormat(categories[ri])), tipRows),
        onPointerMove: (event) => showTip(event, String(xTickFormat(categories[ri])), tipRows),
        onPointerLeave: () => setActive(null),
        onFocus: () => {
          const node = wrapRef.current;
          if (!node) return;
          setActive({ title: String(xTickFormat(categories[ri])), rows: tipRows, x: 12, y: 8 });
        },
        onBlur: () => setActive(null),
        onClick: () => onBarClick?.(row, s, value),
      };

      if (horizontal) {
        const yPos = bandStart + bandInset + (stacked ? 0 : si * (thickness + GAP));
        const from = stacked
          ? valueScale(value >= 0 ? positiveTop : negativeTop + value)
          : Math.min(zero, valueScale(value));
        const to = stacked
          ? valueScale(value >= 0 ? positiveTop + value : negativeTop)
          : Math.max(zero, valueScale(value));
        const barWidth = Math.max(0, to - from - (stacked ? GAP : 0));
        bars.push(h("path", {
          ...common,
          d: barPath(from, yPos, barWidth, thickness, BAR_RADIUS, value >= 0 ? "right" : "left"),
        }));
      } else {
        const xPos = bandStart + bandInset + (stacked ? 0 : si * (thickness + GAP));
        const from = stacked
          ? valueScale(value >= 0 ? positiveTop + value : negativeTop)
          : Math.min(zero, valueScale(value));
        const to = stacked
          ? valueScale(value >= 0 ? positiveTop : negativeTop + value)
          : Math.max(zero, valueScale(value));
        const barHeight = Math.max(0, to - from - (stacked ? GAP : 0));
        bars.push(h("path", {
          ...common,
          d: barPath(xPos, from, thickness, barHeight, BAR_RADIUS, value >= 0 ? "top" : "bottom"),
        }));
      }

      if (value >= 0) positiveTop += value;
      else negativeTop += value;
    });
  });

  return h(
    "div",
    { ...props, className: joinClasses("m-chart", "m-chart-bar-chart", className), ref: wrapRef },
    h(
      "svg",
      {
        className: "m-chart-svg",
        width: "100%",
        height,
        viewBox: `0 0 ${Math.max(1, width)} ${height}`,
        role: "group",
        ariaLabel: ariaLabel ?? `${label ?? "Chart"} — ${data.length} categories`,
      },
      h(
        "g",
        { transform: `translate(${marginLeft}, 4)` },
        showGrid && h(Grid, {
          ticks: valueTicks,
          scale: valueScale,
          width: plotWidth,
          horizontal: !horizontal,
          plotHeight,
        }),
        horizontal
          ? h(
            "g",
            { className: "m-chart-axis m-chart-axis-y", ariaHidden: "true" },
            categories.map((category, i) => h(
              "text",
              {
                key: `c${i}`,
                x: -8,
                y: round(bandScale(String(category)) + bandScale.bandwidth / 2),
                dy: "0.32em",
                "text-anchor": "end",
              },
              xTickFormat(category),
            )),
          )
          : h(AxisY, { ticks: valueTicks, scale: valueScale, format: tickFormat }),
        horizontal
          ? h(
            "g",
            { className: "m-chart-axis m-chart-axis-x", ariaHidden: "true" },
            valueTicks.map((tick) => h(
              "text",
              { key: `t${tick}`, x: round(valueScale(tick)), y: plotHeight + 18, "text-anchor": "middle" },
              tickFormat(tick),
            )),
          )
          : h(AxisX, { categories, scale: bandScale, plotHeight, format: xTickFormat }),
        h("g", { className: "m-chart-bars" }, bars),
      ),
    ),
    showLegend && h(Legend, { series: resolved }),
    h(Tooltip, { state: active, format }),
    showTable && h(TableView, { data, xGet, series: resolved, xLabel, format, label: tableLabel }),
  );
}

// ── DonutChart / PieChart ────────────────────────────────────────────────────

/**
 * Part-to-whole at a glance. Deliberately capped: past `maxSlices` the tail
 * folds into a neutral "Other" rather than growing more hues, and close values
 * belong in a bar chart, not here.
 */
export function DonutChart({
  data = [],
  x,
  y,
  label,
  height = 240,
  innerRatio = 0.62,
  maxSlices = 6,
  otherLabel = "Other",
  sliceColor,
  animate = false,
  format = formatNumber,
  ariaLabel,
  showLegend = true,
  showTable = true,
  tableLabel = "View as table",
  emptyMessage = "No data to display.",
  centerLabel,
  onSliceClick,
  className = "",
  ...props
} = {}) {
  const wrapRef = useRef(null);
  const [active, setActive] = useState(null);
  const xGet = useMemo(() => xAccessor(x), [x]);
  const yGet = useMemo(() => (typeof y === "function" ? y : (row) => row?.[y]), [y]);

  // Fold the tail before anything else, so slot assignment and the legend
  // agree with what is actually drawn.
  const slices = useMemo(() => {
    const mapped = data
      .map((row) => ({ label: String(xGet(row)), value: finite(yGet(row)), row }))
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value);

    // A slice may override its palette slot. That is the escape hatch for
    // segments whose color MEANS something — severity tiers wear the status
    // tokens (danger/warning/info), because there the hue is not identity.
    const paint = (s, i) => ({ ...s, color: sliceColor?.(s.row, i) ?? seriesColor(i) });

    if (mapped.length <= maxSlices) {
      return mapped.map(paint);
    }

    const head = mapped.slice(0, maxSlices - 1).map(paint);
    const tail = mapped.slice(maxSlices - 1);
    return [...head, {
      label: otherLabel,
      value: tail.reduce((sum, s) => sum + s.value, 0),
      color: "var(--m-chart-other)",
      row: null,
      folded: tail.length,
    }];
  }, [data, xGet, yGet, maxSlices, otherLabel, sliceColor]);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const trackRef = useEntrance(animate, { preset: "pop", count: slices.length, deps: [total] });

  if (!slices.length || total <= 0) {
    return h("div", { ...props, className: joinClasses("m-chart", className) },
      h(EmptyChart, { height, message: emptyMessage }));
  }

  const size = height;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 4;
  const inner = Math.max(0, outer * innerRatio);

  const showTip = (event, slice) => {
    const node = wrapRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setActive({
      title: slice.label,
      rows: [{ label: `${((slice.value / total) * 100).toFixed(1)}%`, color: slice.color, value: slice.value }],
      x: event.clientX - rect.left,
      y: Math.max(8, event.clientY - rect.top - 12),
    });
  };

  let angle = -Math.PI / 2;   // start at 12 o'clock
  const arcs = slices.map((slice, i) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    // A 2px surface gap between segments, expressed as an angle at the
    // outer edge, so neighbours read distinct without a stroke.
    const gapAngle = Math.min(sweep * 0.4, GAP / outer);
    const start = angle;
    const end = angle + sweep - gapAngle;
    angle += sweep;

    return h("path", {
      key: `${slice.label}-${i}`,
      ref: trackRef(i),
      className: "m-chart-arc",
      d: arcPath(cx, cy, outer, inner, start, end),
      fill: slice.color,
      tabIndex: 0,
      role: "img",
      ariaLabel: `${slice.label}: ${format(slice.value)} (${((slice.value / total) * 100).toFixed(1)}%)`,
      onPointerEnter: (event) => showTip(event, slice),
      onPointerMove: (event) => showTip(event, slice),
      onPointerLeave: () => setActive(null),
      onFocus: () => setActive({
        title: slice.label,
        rows: [{ label: `${((slice.value / total) * 100).toFixed(1)}%`, color: slice.color, value: slice.value }],
        x: 12,
        y: 8,
      }),
      onBlur: () => setActive(null),
      onClick: () => onSliceClick?.(slice.row, slice),
    });
  });

  return h(
    "div",
    { ...props, className: joinClasses("m-chart", "m-chart-donut", className), ref: wrapRef },
    h(
      "div",
      { className: "m-chart-donut-body" },
      h(
        "div",
        { className: "m-chart-donut-figure" },
        h(
          "svg",
          {
            className: "m-chart-svg",
            width: size,
            height: size,
            viewBox: `0 0 ${size} ${size}`,
            role: "group",
            ariaLabel: ariaLabel ?? `${label ?? "Share"} — ${slices.length} segments`,
          },
          h("g", { className: "m-chart-arcs" }, arcs),
        ),
        inner > 0 && centerLabel && h(
          "div",
          { className: "m-chart-donut-center" },
          h("strong", null, centerLabel.value),
          centerLabel.label && h("span", null, centerLabel.label),
        ),
      ),
      showLegend && h(
        "ul",
        { className: "m-chart-legend m-chart-legend-stack" },
        slices.map((slice, i) => h(
          "li",
          { key: `${slice.label}-${i}`, className: "m-chart-legend-item" },
          h("span", { className: "m-chart-legend-key", style: { background: slice.color }, ariaHidden: "true" }),
          h("span", { className: "m-chart-legend-label" }, slice.label),
          h("span", { className: "m-chart-legend-value" }, format(slice.value)),
        )),
      ),
    ),
    h(Tooltip, { state: active, format }),
    showTable && h(
      "details",
      { className: "m-chart-table" },
      h("summary", null, tableLabel),
      h(
        "div",
        { className: "m-chart-table-scroll" },
        h(
          "table",
          null,
          h("thead", null, h("tr", null,
            h("th", { scope: "col" }, "Segment"),
            h("th", { scope: "col" }, "Value"),
            h("th", { scope: "col" }, "Share"))),
          h("tbody", null, slices.map((slice, i) => h(
            "tr",
            { key: `${slice.label}-${i}` },
            h("th", { scope: "row" }, slice.label),
            h("td", null, format(slice.value)),
            h("td", null, `${((slice.value / total) * 100).toFixed(1)}%`),
          ))),
        ),
      ),
    ),
  );
}

/** DonutChart with the hole closed. */
export function PieChart(props = {}) {
  return h(DonutChart, { ...props, innerRatio: 0 });
}

// ── Sparkline ────────────────────────────────────────────────────────────────

/**
 * Trend shape with no chrome — for a stat tile, a table cell, or a card. No
 * axes, no legend, no tooltip: it is a glyph, and the number beside it is the
 * value. `values` is a plain number array.
 */
export function Sparkline({
  values = [],
  width = 96,
  height = 28,
  color,
  area = true,
  showEnd = true,
  ariaLabel,
  className = "",
  ...props
} = {}) {
  if (!values.length) return null;

  const numbers = values.map((v) => finite(v));
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const pad = DOT_RADIUS + 1;
  const yScale = scaleLinear({
    domain: min === max ? [min - 1, max + 1] : [min, max],
    range: [height - pad, pad],
  });
  const step = numbers.length > 1 ? (width - pad * 2) / (numbers.length - 1) : 0;
  const points = numbers.map((v, i) => [pad + i * step, yScale(v)]);
  const stroke = color ?? "var(--m-chart-1)";
  const last = points[points.length - 1];

  return h(
    "svg",
    {
      ...props,
      className: joinClasses("m-chart-sparkline", className),
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      ariaLabel: ariaLabel ?? `Trend: ${formatNumber(numbers[0])} to ${formatNumber(numbers[numbers.length - 1])}`,
    },
    area && h("path", { className: "m-chart-area", d: areaPath(points, height), fill: stroke }),
    h("path", {
      d: linePath(points),
      fill: "none",
      stroke,
      "stroke-width": LINE_WIDTH,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    }),
    showEnd && h("circle", { className: "m-chart-dot", cx: round(last[0]), cy: round(last[1]), r: 3, fill: stroke }),
  );
}

// ── Heatmap ──────────────────────────────────────────────────────────────────

/**
 * Magnitude across a grid (day × hour, cohort × week). This is SEQUENTIAL
 * encoding — one hue, more-is-darker — so it uses the --m-seq-* ramp, never
 * categorical hues: a rainbow for magnitude has no reading order.
 *
 * Values are bucketed into the ramp's steps. A continuous colour scale is
 * unreadable without a key, so the scale legend and the table twin are both
 * on by default.
 */
export function Heatmap({
  data = [],
  x,
  y,
  value = "value",
  label,
  cellHeight = 30,
  steps = SEQ_STEPS,
  format = formatNumber,
  xTickFormat = String,
  yTickFormat = String,
  showValues = false,
  showLegend = true,
  showTable = true,
  tableLabel = "View as table",
  emptyMessage = "No data to display.",
  ariaLabel,
  onCellClick,
  className = "",
  ...props
} = {}) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [active, setActive] = useState(null);

  const xGet = useMemo(() => xAccessor(x), [x]);
  const yGet = useMemo(() => xAccessor(y), [y]);
  const vGet = useMemo(() => (typeof value === "function" ? value : (row) => row?.[value]), [value]);

  // Axis order follows first appearance in the data, so the caller controls it
  // by ordering the rows — re-sorting a heatmap silently changes its meaning.
  const { cols, rowsAxis, cells, min, max } = useMemo(() => {
    const colSeen = [];
    const rowSeen = [];
    const map = new Map();
    let lo = Infinity;
    let hi = -Infinity;

    for (const row of data) {
      const cx = String(xGet(row));
      const cy = String(yGet(row));
      const v = finite(vGet(row));
      if (!colSeen.includes(cx)) colSeen.push(cx);
      if (!rowSeen.includes(cy)) rowSeen.push(cy);
      map.set(`${cy}|${cx}`, { x: cx, y: cy, value: v, row });
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }

    return {
      cols: colSeen,
      rowsAxis: rowSeen,
      cells: map,
      min: Number.isFinite(lo) ? lo : 0,
      max: Number.isFinite(hi) ? hi : 1,
    };
  }, [data, xGet, yGet, vGet]);

  if (!data.length || !cols.length) {
    return h("div", { ...props, className: joinClasses("m-chart", className) },
      h(EmptyChart, { height: cellHeight * 4, message: emptyMessage }));
  }

  const bucketCount = Math.max(2, Math.min(SEQ_STEPS, Math.floor(steps)));
  const span = max - min || 1;
  const bucketOf = (v) =>
    Math.max(0, Math.min(bucketCount - 1, Math.floor(((v - min) / span) * bucketCount)));

  const marginLeft = Math.min(
    180,
    Math.max(...rowsAxis.map((r) => String(yTickFormat(r)).length)) * CHAR_W + 14,
  );
  const plotWidth = Math.max(10, width - marginLeft - 12);
  const cellW = plotWidth / cols.length;
  const plotHeight = rowsAxis.length * cellHeight;
  const height = plotHeight + AXIS_BAND + 8;

  const showTip = (event, cell) => {
    const node = wrapRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setActive({
      title: `${yTickFormat(cell.y)} · ${xTickFormat(cell.x)}`,
      rows: [{ label: label ?? "Value", color: seqColor(bucketOf(cell.value)), value: cell.value }],
      x: event.clientX - rect.left,
      y: Math.max(8, event.clientY - rect.top - 12),
    });
  };

  const rects = [];
  rowsAxis.forEach((ry, r) => {
    cols.forEach((cx, c) => {
      const cell = cells.get(`${ry}|${cx}`);
      if (!cell) return;   // a gap in the grid stays empty, never a zero-valued block
      const bucket = bucketOf(cell.value);
      rects.push(h(
        "g",
        { key: `${ry}|${cx}` },
        h("rect", {
          className: "m-heat-cell",
          x: round(c * cellW + GAP / 2),
          y: round(r * cellHeight + GAP / 2),
          width: round(Math.max(1, cellW - GAP)),
          height: round(Math.max(1, cellHeight - GAP)),
          rx: 2,
          fill: seqColor(bucket),
          tabIndex: 0,
          role: "img",
          ariaLabel: `${yTickFormat(ry)}, ${xTickFormat(cx)}: ${format(cell.value)}`,
          onPointerEnter: (event) => showTip(event, cell),
          onPointerMove: (event) => showTip(event, cell),
          onPointerLeave: () => setActive(null),
          onFocus: () => setActive({
            title: `${yTickFormat(ry)} · ${xTickFormat(cx)}`,
            rows: [{ label: label ?? "Value", color: seqColor(bucket), value: cell.value }],
            x: 12,
            y: 8,
          }),
          onBlur: () => setActive(null),
          onClick: () => onCellClick?.(cell.row, cell),
        }),
        // In-cell values pick their ink from the BUCKET, not from JS colour
        // maths: the stylesheet knows which end of the ramp is dark in each
        // theme, so the label always clears its own fill.
        showValues && cellW > 34 && h(
          "text",
          {
            className: joinClasses("m-heat-value",
              bucket >= bucketCount / 2 ? "m-heat-value-deep" : "m-heat-value-pale"),
            x: round(c * cellW + cellW / 2),
            y: round(r * cellHeight + cellHeight / 2),
            dy: "0.32em",
            "text-anchor": "middle",
            ariaHidden: "true",
          },
          formatCompact(cell.value),
        ),
      ));
    });
  });

  return h(
    "div",
    { ...props, className: joinClasses("m-chart", "m-chart-heatmap", className), ref: wrapRef },
    h(
      "svg",
      {
        className: "m-chart-svg",
        width: "100%",
        height,
        viewBox: `0 0 ${Math.max(1, width)} ${height}`,
        role: "group",
        ariaLabel: ariaLabel ?? `${label ?? "Heatmap"} — ${rowsAxis.length} by ${cols.length} grid`,
      },
      h(
        "g",
        { transform: `translate(${marginLeft}, 4)` },
        h(
          "g",
          { className: "m-chart-axis m-chart-axis-y", ariaHidden: "true" },
          rowsAxis.map((ry, r) => h(
            "text",
            {
              key: `r${r}`,
              x: -8,
              y: round(r * cellHeight + cellHeight / 2),
              dy: "0.32em",
              "text-anchor": "end",
            },
            yTickFormat(ry),
          )),
        ),
        h(AxisX, {
          categories: cols,
          plotHeight,
          format: xTickFormat,
          scale: Object.assign((c) => cols.indexOf(String(c)) * cellW,
            { range: [0, plotWidth], bandwidth: cellW, step: cellW }),
        }),
        h("g", { className: "m-heat-cells" }, rects),
      ),
    ),
    showLegend && h(
      "div",
      { className: "m-heat-legend" },
      h("span", { className: "m-heat-legend-end" }, format(min)),
      h(
        "span",
        { className: "m-heat-legend-ramp", ariaHidden: "true" },
        Array.from({ length: bucketCount }, (_, i) =>
          h("span", { key: i, style: { background: seqColor(i) } })),
      ),
      h("span", { className: "m-heat-legend-end" }, format(max)),
    ),
    h(Tooltip, { state: active, format }),
    showTable && h(
      "details",
      { className: "m-chart-table" },
      h("summary", null, tableLabel),
      h(
        "div",
        { className: "m-chart-table-scroll" },
        h(
          "table",
          null,
          h("thead", null, h("tr", null,
            h("th", { scope: "col" }, ""),
            cols.map((c) => h("th", { key: c, scope: "col" }, xTickFormat(c))))),
          h("tbody", null, rowsAxis.map((ry) => h(
            "tr",
            { key: ry },
            h("th", { scope: "row" }, yTickFormat(ry)),
            cols.map((cx) => {
              const cell = cells.get(`${ry}|${cx}`);
              return h("td", { key: cx }, cell ? format(cell.value) : "—");
            }),
          ))),
        ),
      ),
    ),
  );
}

// ── ScatterChart ─────────────────────────────────────────────────────────────

/**
 * Relationship between two continuous measures.
 *
 * Scatter is an ALL-PAIRS form: any two dots can land next to each other, so
 * the palette's adjacent-pair guarantee is not enough and the validated safe
 * depth is only the first three slots. Past `ALL_PAIRS_SLOTS` groups the tail
 * folds into a neutral "Other" — the alternative would be colours the reader
 * cannot reliably separate.
 *
 * An 8px dot is a pinpoint nobody hits, so hovering uses a nearest-point layer
 * over the whole plot rather than per-dot hit areas.
 */
export function ScatterChart({
  data = [],
  x,
  y,
  groupBy,
  label,
  height = DEFAULT_HEIGHT,
  radius = 5,
  format = formatNumber,
  tickFormat = formatCompact,
  xTickFormat = formatCompact,
  xLabel = "x",
  yLabel = "y",
  otherLabel = "Other",
  ariaLabel,
  showGrid = true,
  showLegend = true,
  showTable = true,
  tableLabel = "View as table",
  emptyMessage = "No data to display.",
  onPointClick,
  className = "",
  ...props
} = {}) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [active, setActive] = useState(null);

  const xGet = useMemo(() => xAccessor(x), [x]);
  const yGet = useMemo(() => xAccessor(y), [y]);
  const gGet = useMemo(() => (groupBy ? xAccessor(groupBy) : null), [groupBy]);

  // Groups keep first-appearance order so a colour follows its entity rather
  // than its rank, exactly as `series` does elsewhere.
  const groups = useMemo(() => {
    if (!gGet) return [{ key: "__all", label: label ?? "Points", color: seriesColor(0) }];
    const seen = [];
    for (const row of data) {
      const g = String(gGet(row));
      if (!seen.includes(g)) seen.push(g);
    }
    return seen.map((g, i) => ({
      key: g,
      label: g,
      color: i < ALL_PAIRS_SLOTS ? seriesColor(i) : "var(--m-chart-other)",
      folded: i >= ALL_PAIRS_SLOTS,
    }));
  }, [data, gGet, label]);

  const points = useMemo(() => data.map((row) => ({
    row,
    vx: finite(xGet(row)),
    vy: finite(yGet(row)),
    group: gGet ? String(gGet(row)) : "__all",
  })), [data, xGet, yGet, gGet]);

  if (!points.length) {
    return h("div", { ...props, className: joinClasses("m-chart", className) },
      h(EmptyChart, { height, message: emptyMessage }));
  }

  const xs = points.map((p) => p.vx);
  const ys = points.map((p) => p.vy);
  const xAxis = niceAxis(Math.min(...xs), Math.max(...xs), TICK_COUNT);
  const yAxis = niceAxis(Math.min(...ys), Math.max(...ys), TICK_COUNT);

  const marginLeft = yAxisWidth(yAxis.ticks, tickFormat);
  const plotWidth = Math.max(10, width - marginLeft - 12);
  const plotHeight = Math.max(10, height - AXIS_BAND - 8);

  const xScale = scaleLinear({ domain: xAxis.domain, range: [0, plotWidth] });
  const yScale = scaleLinear({ domain: yAxis.domain, range: [plotHeight, 0] });

  const colorOf = (group) => groups.find((g) => g.key === group)?.color ?? seriesColor(0);
  const placed = points.map((p) => ({ ...p, px: xScale(p.vx), py: yScale(p.vy) }));

  // Nearest-point picking: the pointer only has to be CLOSEST, not dead-centre.
  const HIT_RADIUS = 28;
  const pickNearest = (clientX, clientY) => {
    const node = wrapRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    const px = clientX - rect.left - marginLeft;
    const py = clientY - rect.top - 4;
    let best = null;
    let bestDist = HIT_RADIUS;
    for (const p of placed) {
      const d = Math.hypot(p.px - px, p.py - py);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
  };

  const showPoint = (p, clientX, clientY) => {
    const node = wrapRef.current;
    if (!node || !p) { setActive(null); return; }
    const rect = node.getBoundingClientRect();
    setActive({
      point: p,
      title: gGet ? String(p.group) : (label ?? "Point"),
      rows: [
        { label: xLabel, color: colorOf(p.group), value: p.vx },
        { label: yLabel, color: colorOf(p.group), value: p.vy },
      ],
      x: clientX !== undefined ? clientX - rect.left : marginLeft + p.px,
      y: clientY !== undefined ? Math.max(8, clientY - rect.top - 12) : 8,
    });
  };

  const onKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const sorted = [...placed].sort((a, b) => a.vx - b.vx);
    const at = active?.point ? sorted.indexOf(active.point) : -1;
    const next = Math.max(0, Math.min(sorted.length - 1, at + (event.key === "ArrowRight" ? 1 : -1)));
    showPoint(sorted[next]);
  };

  return h(
    "div",
    { ...props, className: joinClasses("m-chart", "m-chart-scatter", className), ref: wrapRef },
    h(
      "svg",
      {
        className: "m-chart-svg",
        width: "100%",
        height,
        viewBox: `0 0 ${Math.max(1, width)} ${height}`,
        role: "img",
        ariaLabel: ariaLabel ?? `${label ?? "Scatter"} — ${points.length} points`,
        tabIndex: 0,
        onKeyDown,
        onPointerMove: (event) => showPoint(pickNearest(event.clientX, event.clientY), event.clientX, event.clientY),
        onPointerLeave: () => setActive(null),
        onBlur: () => setActive(null),
        onClick: (event) => {
          const p = pickNearest(event.clientX, event.clientY);
          if (p) onPointClick?.(p.row, p);
        },
      },
      h(
        "g",
        { transform: `translate(${marginLeft}, 4)` },
        showGrid && h(Grid, { ticks: yAxis.ticks, scale: yScale, width: plotWidth }),
        showGrid && h(Grid, {
          ticks: xAxis.ticks, scale: xScale, width: plotWidth, horizontal: false, plotHeight,
        }),
        h(AxisY, { ticks: yAxis.ticks, scale: yScale, format: tickFormat }),
        h(
          "g",
          { className: "m-chart-axis m-chart-axis-x", ariaHidden: "true" },
          xAxis.ticks.map((tick) => h(
            "text",
            { key: `x${tick}`, x: round(xScale(tick)), y: plotHeight + 18, "text-anchor": "middle" },
            xTickFormat(tick),
          )),
        ),
        h(
          "g",
          { className: "m-chart-dots" },
          placed.map((p, i) => h("circle", {
            key: i,
            className: joinClasses("m-chart-point", active?.point === p && "m-chart-point-active"),
            cx: round(p.px),
            cy: round(p.py),
            r: radius,
            fill: colorOf(p.group),
          })),
        ),
      ),
    ),
    // Folded groups collapse into ONE legend entry. Listing them separately
    // would show several rows sharing the same grey, which reads as a bug and
    // implies a distinction the colours cannot carry.
    showLegend && groups.length > 1 && h(Legend, {
      series: (() => {
        const named = groups.filter((g) => !g.folded);
        const folded = groups.filter((g) => g.folded);
        if (!folded.length) return named;
        return [...named, {
          key: "__other",
          label: `${otherLabel} (${folded.length})`,
          color: "var(--m-chart-other)",
        }];
      })(),
    }),
    h(Tooltip, { state: active, format }),
    showTable && h(
      "details",
      { className: "m-chart-table" },
      h("summary", null, tableLabel),
      h(
        "div",
        { className: "m-chart-table-scroll" },
        h(
          "table",
          null,
          h("thead", null, h("tr", null,
            gGet && h("th", { scope: "col" }, "Group"),
            h("th", { scope: "col" }, xLabel),
            h("th", { scope: "col" }, yLabel))),
          h("tbody", null, points.map((p, i) => h(
            "tr",
            { key: i },
            gGet && h("th", { scope: "row" }, String(p.group)),
            h("td", null, format(p.vx)),
            h("td", null, format(p.vy)),
          ))),
        ),
      ),
    ),
    groups.some((g) => g.folded) && h(
      "p",
      { className: "m-chart-note" },
      `Only the first ${ALL_PAIRS_SLOTS} groups get their own colour here — in a scatter any two dots can sit side by side, and the palette only guarantees separation that far. The rest share “${otherLabel}”; facet with SmallMultiples to tell them apart.`,
    ),
  );
}

// ── SmallMultiples ───────────────────────────────────────────────────────────

/**
 * One small chart per series, on a SHARED scale.
 *
 * This is the documented way out of "too many series" — never a ninth hue.
 * `shareScale` is on for a reason: a grid of charts each auto-scaled to its own
 * data looks comparable and is not, which is the same lie a dual axis tells.
 *
 * Facet the SAME MEASURE across slices — visits per region, revenue per plan.
 * Faceting different units (sessions, signups, dollars) on one scale is the
 * mirror-image mistake: the shared axis is honest, but it flattens the smaller
 * measures into a line at zero. Different units are just different charts.
 */
export function SmallMultiples({
  data = [],
  x,
  series = [],
  chart = "line",
  columns = 3,
  height = 150,
  shareScale = true,
  animate = false,
  format = formatNumber,
  tickFormat = formatCompact,
  xTickFormat = String,
  emptyMessage = "No data to display.",
  className = "",
  ...props
} = {}) {
  const resolved = useMemo(() => normalizeSeries({ series }), [series]);

  if (!data.length || !resolved.length) {
    return h("div", { ...props, className: joinClasses("m-chart", className) },
      h(EmptyChart, { height, message: emptyMessage }));
  }

  // One domain across every facet, computed from all series at once.
  const [min, max] = valueExtent(data, resolved);
  const shared = shareScale ? niceAxis(min, max, TICK_COUNT).domain : undefined;

  const Chart = chart === "bar" ? BarChart : LineChart;
  const style = {
    "--m-facet-columns": String(Math.max(1, Math.floor(columns))),
    ...(props.style || {}),
  };

  return h(
    "div",
    { ...props, style, className: joinClasses("m-facets", className) },
    resolved.map((s) => h(
      "section",
      { key: s.key, className: "m-facet" },
      h("h4", { className: "m-facet-title" }, s.label),
      h(Chart, {
        data,
        x,
        series: [{ key: s.key, label: s.label, color: s.color }],
        height,
        yDomain: shared,
        area: chart === "area",
        animate,
        format,
        tickFormat,
        xTickFormat,
        // The facet's own heading names the series, and one table per facet
        // would bury the page; the caller keeps a single table alongside.
        showLegend: false,
        showTable: false,
      }),
    )),
  );
}

// ── Export ───────────────────────────────────────────────────────────────────

/** Rows + series → CSV text. Quotes anything containing a comma or quote. */
export function chartToCSV({ data = [], x, series = [], y, label, xLabel = "Category" } = {}) {
  const resolved = normalizeSeries({ series, y, label });
  const xGet = xAccessor(x);
  // Written without regex literals on purpose: scripts/validate_fluxaway.py
  // balances brackets with a lexer that has no notion of regex, so a pattern
  // containing a quote reads as an unterminated string.
  const escape = (cell) => {
    const text = cell === null || cell === undefined ? "" : String(cell);
    const needsQuotes = text.includes(",") || text.includes('"') || text.includes("\n");
    return needsQuotes ? `"${text.split('"').join('""')}"` : text;
  };

  const head = [xLabel, ...resolved.map((s) => s.label)].map(escape).join(",");
  const body = data.map((row) =>
    [xGet(row), ...resolved.map((s) => s.accessor(row))].map(escape).join(","));
  return [head, ...body].join("\n");
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download the chart's data as a .csv — the table view, as a file. */
export function exportCSV(spec = {}, { filename = "chart.csv" } = {}) {
  const csv = chartToCSV(spec);
  download(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }), filename);
  return csv;
}

/**
 * Rasterise a rendered chart to PNG.
 *
 * The catch this solves: marks are painted with `var(--m-chart-N)`, and a
 * serialised SVG carries no stylesheet, so a naive export comes out black.
 * Every painted attribute is therefore read back through getComputedStyle on
 * the LIVE nodes and written onto the clone as a literal colour.
 */
export async function exportPNG(target, {
  filename = "chart.png",
  scale = 2,
  background,
} = {}) {
  const node = target?.current ?? target;
  const svg = node?.tagName?.toLowerCase() === "svg" ? node : node?.querySelector?.("svg");
  if (!svg) throw new Error("exportPNG: no <svg> found in the target element.");

  // Prefer the laid-out size, but fall back to the viewBox: a chart inside a
  // hidden panel (or an off-screen container) measures 0 and would otherwise
  // export as a 1x1 pixel.
  const rect = svg.getBoundingClientRect();
  const viewBox = (svg.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
  const boxW = viewBox.length === 4 && viewBox[2] > 0 ? viewBox[2] : 0;
  const boxH = viewBox.length === 4 && viewBox[3] > 0 ? viewBox[3] : 0;
  const w = Math.max(1, Math.round(rect.width || boxW || DEFAULT_WIDTH));
  const hgt = Math.max(1, Math.round(rect.height || boxH || DEFAULT_HEIGHT));

  const clone = svg.cloneNode(true);
  const live = svg.querySelectorAll("*");
  const copies = clone.querySelectorAll("*");
  const PAINT = ["fill", "stroke", "stroke-width", "opacity", "font-size", "font-family", "font-weight"];

  for (let i = 0; i < live.length; i += 1) {
    const computed = getComputedStyle(live[i]);
    for (const prop of PAINT) {
      const resolvedValue = computed.getPropertyValue(prop);
      if (resolvedValue) copies[i].setAttribute(prop, resolvedValue);
    }
  }

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(hgt));

  const svgText = new XMLSerializer().serializeToString(clone);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("exportPNG: the serialised SVG could not be decoded."));
    img.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = hgt * scale;
  const ctx = canvas.getContext("2d");
  // A PNG has no page behind it, so a transparent export of dark-mode text is
  // invisible wherever it is pasted. Default to the chart's own surface.
  const fill = background
    ?? (getComputedStyle(svg).getPropertyValue("--m-chart-surface").trim() || "#ffffff");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (blob) download(blob, filename);
  return blob;
}

// ── Dashboard layout ─────────────────────────────────────────────────────────

/**
 * Auto-fitting grid for dashboard cards. `min` is the narrowest a card may get
 * before the grid drops a column; a card can span two with `span={2}` on
 * ChartCard.
 */
export function DashboardGrid({ min = 320, gap, className = "", children, ...props } = {}) {
  const style = { "--m-dash-min": typeof min === "number" ? `${min}px` : min, ...(props.style || {}) };
  if (gap !== undefined) style["--m-dash-gap"] = typeof gap === "number" ? `${gap}px` : gap;
  return h("div", { ...props, style, className: joinClasses("m-dash-grid", className) }, children);
}

/**
 * A titled surface for one chart. `actions` sits in the header (a range
 * switcher, an export button); `loading` holds the previous render at reduced
 * opacity instead of flashing a skeleton.
 */
export function ChartCard({
  title,
  subtitle,
  actions,
  footer,
  span = 1,
  loading = false,
  className = "",
  children,
  ...props
} = {}) {
  return h(
    "section",
    {
      ...props,
      className: joinClasses("m-dash-card", span > 1 && "m-dash-card-wide", className),
      "aria-busy": loading ? "true" : undefined,
    },
    (title || actions) && h(
      "header",
      { className: "m-dash-card-head" },
      h(
        "div",
        { className: "m-dash-card-heading" },
        title && h("h3", { className: "m-dash-card-title" }, title),
        subtitle && h("p", { className: "m-dash-card-subtitle" }, subtitle),
      ),
      actions && h("div", { className: "m-dash-card-actions" }, actions),
    ),
    h("div", { className: joinClasses("m-dash-card-body", loading && "m-dash-card-loading") }, children),
    footer && h("footer", { className: "m-dash-card-foot" }, footer),
  );
}

/**
 * A row of KPI tiles — the form a handful of headline numbers should take
 * (never a grouped bar chart of one value each). Auto-fits, then wraps.
 */
export function MetricRow({ min = 160, className = "", children, ...props } = {}) {
  const style = { "--m-metric-min": typeof min === "number" ? `${min}px` : min, ...(props.style || {}) };
  return h("div", { ...props, style, className: joinClasses("m-metric-row-group", className) }, children);
}

/**
 * KPI tile: label, value, optional signed delta and sparkline.
 *
 * `up` names which direction is GOOD (default "good"), because a rising error
 * rate is bad — the arrow and the word carry the meaning, never color alone.
 * `countUp` animates the value on mount via the motion ticker.
 */
export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  trend,
  trendColor,
  up = "good",
  format = formatCompact,
  countUp = false,
  hero = false,
  className = "",
  ...props
} = {}) {
  const numeric = Number(value);
  const valueRef = useCountUp(value, {
    enabled: countUp && Number.isFinite(numeric),
    format: (n) => format(n),
  });

  const deltaNumber = typeof delta === "number" ? delta : parseFloat(String(delta ?? "").replace(/[^\d.-]/g, ""));
  const rising = Number.isFinite(deltaNumber) ? deltaNumber > 0 : String(delta ?? "").trim().startsWith("+");
  const flat = Number.isFinite(deltaNumber) && deltaNumber === 0;
  const good = up === "good" ? rising : !rising;

  return h(
    "div",
    { ...props, className: joinClasses("m-metric", hero && "m-metric-hero", className) },
    h("p", { className: "m-metric-label" }, label),
    h(
      "div",
      { className: "m-metric-row" },
      h(
        "strong",
        { className: "m-metric-value", ref: valueRef },
        // Static render (and SSR) writes the value directly; useCountUp
        // overwrites the same node when it animates.
        Number.isFinite(numeric) ? format(numeric) : value,
      ),
      trend?.length && h(Sparkline, {
        values: trend,
        color: trendColor ?? "var(--m-chart-1)",
        className: "m-metric-spark",
      }),
    ),
    delta !== undefined && delta !== null && h(
      "p",
      {
        className: joinClasses(
          "m-metric-delta",
          flat ? "m-metric-delta-flat" : good ? "m-metric-delta-good" : "m-metric-delta-bad",
        ),
      },
      h("span", { className: "m-metric-arrow", ariaHidden: "true" }, flat ? "→" : rising ? "↑" : "↓"),
      h("span", { className: "m-metric-delta-value" }, typeof delta === "number" ? `${delta > 0 ? "+" : ""}${delta}%` : delta),
      deltaLabel && h("span", { className: "m-metric-delta-label" }, deltaLabel),
    ),
  );
}

/**
 * Single ratio against a limit. The track is a lighter step of the fill's own
 * ramp, so the state reads across the whole bar — not a 2-slice pie.
 */
export function Meter({
  value = 0,
  max = 100,
  label,
  format = formatNumber,
  tone,
  className = "",
  ...props
} = {}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, finite(value) / max)) : 0;
  const level = tone ?? (ratio >= 0.9 ? "critical" : ratio >= 0.75 ? "warning" : "ok");

  return h(
    "div",
    { ...props, className: joinClasses("m-meter", className) },
    (label || value !== undefined) && h(
      "div",
      { className: "m-meter-head" },
      label && h("span", { className: "m-meter-label" }, label),
      h("span", { className: "m-meter-value" }, `${format(value)} / ${format(max)}`),
    ),
    h(
      "div",
      {
        className: "m-meter-track",
        role: "meter",
        ariaValuenow: String(finite(value)),
        ariaValuemin: "0",
        ariaValuemax: String(finite(max)),
        ariaLabel: label,
      },
      h("div", {
        className: joinClasses("m-meter-fill", `m-meter-${level}`),
        style: { width: `${ratio * 100}%` },
      }),
    ),
  );
}
