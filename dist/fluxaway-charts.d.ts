/*!
 * FluxaWay — TypeScript declarations for the charts & dashboard add-on.
 * This app's frontend uses the FluxaWay framework (NOT React):
 * https://github.com/skysegbr/FluxaWay — full AI reference:
 * https://raw.githubusercontent.com/skysegbr/FluxaWay/main/docs/AI_SPEC.md
 */

/**
 * Type declarations for /dist/fluxaway-charts.js — SVG charts and dashboard
 * layout: line/area, bar (grouped, stacked, horizontal), donut/pie,
 * sparkline, plus KPI tiles, cards and an auto-fit grid.
 *
 * Requires /dist/fluxaway-charts.css (it carries the validated categorical
 * palette tokens). Entrance animation is built on /dist/fluxaway-motion.js.
 *
 * Note there is deliberately no dual-axis / `yRight` option: two measures of
 * different magnitude are two charts, not two y-scales on one plot.
 */

import type { VNode } from "./fluxaway.js";
import type { EasingName } from "./fluxaway-motion.js";

/** Number of slots in the categorical palette. Always 8. */
export declare const CHART_SLOTS: 8;

/**
 * `var(--m-chart-N)` for a 0-based slot index. Index 8 and beyond return the
 * neutral `var(--m-chart-other)` token — the palette never cycles, because a
 * reused hue is indistinguishable from an existing slot under simulated CVD.
 */
export declare function seriesColor(index: number): string;

/** Compact number formatting: 1284 → "1.3K". Non-numbers become "—". */
export declare function formatCompact(value: unknown): string;

/** Thousands-separated full number. Non-numbers become "—". */
export declare function formatNumber(value: unknown): string;

/** Rounded "nice" tick values (1/2/5 × 10ⁿ steps) inside [min, max]. */
export declare function niceTicks(min: number, max: number, count?: number): number[];

export interface LinearScale {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
  invert(px: number): number;
  ticks(count?: number): number[];
}

export declare function scaleLinear(options?: {
  domain?: [number, number];
  range?: [number, number];
}): LinearScale;

export interface BandScale {
  (value: string | number): number;
  domain: Array<string | number>;
  range: [number, number];
  /** Width of one band, after padding. */
  bandwidth: number;
  /** Distance between band starts, including padding. */
  step: number;
}

export declare function scaleBand(options?: {
  domain?: Array<string | number>;
  range?: [number, number];
  padding?: number;
}): BandScale;

/** One plotted measure. */
export interface ChartSeries<Row = any> {
  /** Row property name, or an accessor function. */
  key: string | ((row: Row) => number);
  /** Legend and tooltip text. Defaults to `key`. */
  label?: string;
  /** Explicit CSS color, overriding the palette slot. */
  color?: string;
  /**
   * 1-based palette slot. Pin this when the app FILTERS its series list —
   * otherwise colors come from list position and the survivors get repainted,
   * so a reader who learned "signups is orange" is misled.
   */
  slot?: number;
}

/** Entrance animation: `true` for the defaults, or an object to tune it. */
export type ChartAnimate =
  | boolean
  | {
    /** Tween length in ms (default 620). */
    duration?: number;
    /** Per-mark delay in ms (default 45, or 60 for the donut). */
    stagger?: number;
    ease?: EasingName;
    /**
     * Changing this value replays the entrance — a "replay" button, or a
     * filter swap that leaves the mark count unchanged.
     */
    key?: unknown;
  };

interface ChartCommon<Row = any> {
  data?: Row[];
  /** Category/x property name, or an accessor. */
  x?: string | ((row: Row) => string | number);
  /** Shorthand for a single series (mutually exclusive with `series`). */
  y?: string | ((row: Row) => number);
  series?: Array<ChartSeries<Row>>;
  /** Names what is plotted; also the single-series legend substitute. */
  label?: string;
  height?: number;
  animate?: ChartAnimate;
  /** Tooltip and table value formatter (default formatNumber). */
  format?: (value: unknown) => string;
  /** Value-axis tick formatter (default formatCompact). */
  tickFormat?: (value: number) => string;
  /** Category-axis tick formatter (default String). */
  xTickFormat?: (value: unknown) => string;
  /** Header for the category column of the table view. */
  xLabel?: string;
  ariaLabel?: string;
  showGrid?: boolean;
  /** Legends render automatically for >= 2 series; this can suppress them. */
  showLegend?: boolean;
  /**
   * The table-view twin. On by default and best left on: it is what keeps
   * every value reachable without hovering, for screen readers included.
   */
  showTable?: boolean;
  tableLabel?: string;
  emptyMessage?: string;
  /**
   * Highlight ONE series (by key) and grey the rest. Often the honest answer
   * to "make this chart clearer": when the story is "this one moved", several
   * competing hues bury it.
   */
  emphasis?: string;
  /**
   * Force the value-axis domain. Mainly for facets that must share a scale —
   * SmallMultiples sets it for you.
   */
  yDomain?: [number, number];
  className?: string;
  [prop: string]: unknown;
}

export interface LineChartProps<Row = any> extends ChartCommon<Row> {
  /** Fill under the line at ~10% opacity. */
  area?: boolean;
  /**
   * Drag across the plot to zoom into a range; Escape or the reset control
   * restores it. The table view keeps listing the full series, because the
   * zoom is a view of the chart and not a filter on the data.
   */
  brush?: boolean;
  /** Fires with the committed window, and with null on reset. */
  onBrush?: (range: { start: number; end: number; rows: Row[] } | null) => void;
  onPointClick?: (row: Row, index: number) => void;
}

/** Trend over time. Hover and arrow keys both drive one crosshair readout. */
export declare function LineChart<Row = any>(props?: LineChartProps<Row>): VNode;

/** LineChart with `area` on. */
export declare function AreaChart<Row = any>(props?: LineChartProps<Row>): VNode;

export interface BarChartProps<Row = any> extends ChartCommon<Row> {
  /** Part-to-whole within each category. Defaults to grouped bars. */
  stacked?: boolean;
  /** Bars run left-to-right — the right call for long category names. */
  horizontal?: boolean;
  onBarClick?: (row: Row, series: ChartSeries<Row>, value: number) => void;
}

/** Magnitude comparison. Every bar is its own hover/focus target. */
export declare function BarChart<Row = any>(props?: BarChartProps<Row>): VNode;

export interface DonutChartProps<Row = any> {
  data?: Row[];
  x?: string | ((row: Row) => string | number);
  y?: string | ((row: Row) => number);
  label?: string;
  height?: number;
  /** Hole size as a fraction of the outer radius (0 = a pie). */
  innerRatio?: number;
  /**
   * Segment cap (default 6). Past it the smallest slices fold into a single
   * neutral "Other" — part-to-whole stops reading at a glance beyond ~6, and
   * the palette has no 9th hue to give them.
   */
  maxSlices?: number;
  otherLabel?: string;
  /**
   * Override a slice's palette slot. Use it when the color MEANS something —
   * severity tiers wear the status tokens (--m-danger/--m-warning/--m-info),
   * since there hue carries state rather than identity. Return undefined to
   * keep the categorical slot.
   */
  sliceColor?: (row: Row | null, index: number) => string | undefined;
  /** Text for the middle of the donut. */
  centerLabel?: { value: string; label?: string };
  animate?: ChartAnimate;
  format?: (value: unknown) => string;
  ariaLabel?: string;
  showLegend?: boolean;
  showTable?: boolean;
  tableLabel?: string;
  emptyMessage?: string;
  /** `row` is null for the folded "Other" segment. */
  onSliceClick?: (row: Row | null, slice: { label: string; value: number }) => void;
  className?: string;
  [prop: string]: unknown;
}

/** Part-to-whole at a glance. Zero and negative values are skipped. */
export declare function DonutChart<Row = any>(props?: DonutChartProps<Row>): VNode;

/** DonutChart with the hole closed. */
export declare function PieChart<Row = any>(props?: DonutChartProps<Row>): VNode;

export interface SparklineProps {
  values?: number[];
  width?: number;
  height?: number;
  color?: string;
  area?: boolean;
  /** Dot on the final point (default true). */
  showEnd?: boolean;
  ariaLabel?: string;
  className?: string;
  [prop: string]: unknown;
}

/** Trend glyph with no axes, legend or tooltip — for tiles and table cells. */
export declare function Sparkline(props?: SparklineProps): VNode;

/** Steps in the sequential (magnitude) ramp. Always 7. */
export declare const SEQ_STEPS: 7;

/**
 * How many categorical slots stay separable when ANY two marks can be
 * neighbours (scatter, bubble, choropleth). Always 3 — lower than
 * CHART_SLOTS, because the all-pairs test is strictly harder than the
 * adjacent-pairs one the bar/line palette is validated against.
 */
export declare const ALL_PAIRS_SLOTS: 3;

/**
 * `var(--m-seq-N)` for a 0-based magnitude bucket. Slot 1 is always the
 * lowest magnitude in both themes; the stylesheet flips which end is pale.
 */
export declare function seqColor(bucket: number): string;

export interface HeatmapProps<Row = any> {
  data?: Row[];
  /** Column key/accessor. */
  x?: string | ((row: Row) => string | number);
  /** Row key/accessor. */
  y?: string | ((row: Row) => string | number);
  /** Magnitude key/accessor (default "value"). */
  value?: string | ((row: Row) => number);
  label?: string;
  cellHeight?: number;
  /** Buckets to quantise into, capped at SEQ_STEPS. */
  steps?: number;
  /** Print the value inside each cell (only where it fits). */
  showValues?: boolean;
  format?: (value: unknown) => string;
  xTickFormat?: (value: unknown) => string;
  yTickFormat?: (value: unknown) => string;
  ariaLabel?: string;
  /** The scale key. A continuous encoding is unreadable without it. */
  showLegend?: boolean;
  showTable?: boolean;
  tableLabel?: string;
  emptyMessage?: string;
  onCellClick?: (row: Row, cell: { x: string; y: string; value: number }) => void;
  className?: string;
  [prop: string]: unknown;
}

/**
 * Magnitude across a grid, on the SEQUENTIAL ramp (one hue, more-is-darker) —
 * never categorical hues, which have no reading order. Missing combinations
 * are left blank rather than drawn as zero.
 */
export declare function Heatmap<Row = any>(props?: HeatmapProps<Row>): VNode;

export interface ScatterChartProps<Row = any> {
  data?: Row[];
  x?: string | ((row: Row) => number);
  y?: string | ((row: Row) => number);
  /** Categorical key to colour points by. Capped at ALL_PAIRS_SLOTS. */
  groupBy?: string | ((row: Row) => string | number);
  label?: string;
  height?: number;
  radius?: number;
  format?: (value: unknown) => string;
  tickFormat?: (value: number) => string;
  xTickFormat?: (value: number) => string;
  xLabel?: string;
  yLabel?: string;
  otherLabel?: string;
  ariaLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTable?: boolean;
  tableLabel?: string;
  emptyMessage?: string;
  onPointClick?: (row: Row, point: { vx: number; vy: number }) => void;
  className?: string;
  [prop: string]: unknown;
}

/**
 * Relationship between two continuous measures. Hovering uses a nearest-point
 * layer, so the pointer only has to be closest rather than dead-centre on an
 * 8px dot. Groups past ALL_PAIRS_SLOTS fold into a neutral "Other".
 */
export declare function ScatterChart<Row = any>(props?: ScatterChartProps<Row>): VNode;

export interface SmallMultiplesProps<Row = any> {
  data?: Row[];
  x?: string | ((row: Row) => string | number);
  series?: Array<ChartSeries<Row>>;
  /** Which chart to repeat (default "line"). */
  chart?: "line" | "area" | "bar";
  columns?: number;
  height?: number;
  /**
   * One y-scale across every facet (default true). Turning this off lets each
   * facet auto-scale, which makes unequal series LOOK comparable when they are
   * not — the same lie a dual axis tells. Only do it deliberately.
   */
  shareScale?: boolean;
  animate?: ChartAnimate;
  format?: (value: unknown) => string;
  tickFormat?: (value: number) => string;
  xTickFormat?: (value: unknown) => string;
  emptyMessage?: string;
  className?: string;
  [prop: string]: unknown;
}

/**
 * One small chart per series on a shared scale — the documented way out of
 * "too many series", instead of reaching for a ninth hue.
 *
 * Facet the SAME measure across slices (visits per region). Faceting different
 * units on one scale is honest but useless: the smaller measures flatten into
 * a line at zero. Different units are different charts.
 */
export declare function SmallMultiples<Row = any>(props?: SmallMultiplesProps<Row>): VNode;

/** Rows + series → CSV text. Values containing a comma or quote are quoted. */
export declare function chartToCSV<Row = any>(spec?: {
  data?: Row[];
  x?: string | ((row: Row) => unknown);
  series?: Array<ChartSeries<Row>>;
  y?: string | ((row: Row) => number);
  label?: string;
  xLabel?: string;
}): string;

/** Download the chart's data as a .csv. Returns the CSV text. */
export declare function exportCSV<Row = any>(
  spec?: Parameters<typeof chartToCSV<Row>>[0],
  options?: { filename?: string },
): string;

/**
 * Rasterise a rendered chart to PNG and download it.
 *
 * Pass the chart's `<svg>`, an element containing one, or a ref. Series
 * colours are `var(--m-chart-N)` and a serialised SVG carries no stylesheet,
 * so every painted value is read back through getComputedStyle and inlined —
 * otherwise the export would come out black.
 */
export declare function exportPNG(
  target: Element | { current: Element | null } | null,
  options?: { filename?: string; scale?: number; background?: string },
): Promise<Blob | null>;

export interface DashboardGridProps {
  /** Narrowest a card may get before a column is dropped (default 320). */
  min?: number | string;
  gap?: number | string;
  className?: string;
  children?: unknown;
  [prop: string]: unknown;
}

/** Auto-fitting grid for dashboard cards. */
export declare function DashboardGrid(props?: DashboardGridProps): VNode;

export interface ChartCardProps {
  title?: unknown;
  subtitle?: unknown;
  /** Header controls — a range switcher, an export button. */
  actions?: unknown;
  footer?: unknown;
  /** Span two grid columns (falls back to one on narrow screens). */
  span?: number;
  /** Dim the body and mark it aria-busy, holding the previous render. */
  loading?: boolean;
  className?: string;
  children?: unknown;
  [prop: string]: unknown;
}

/** Titled surface for one chart. */
export declare function ChartCard(props?: ChartCardProps): VNode;

export interface MetricRowProps {
  min?: number | string;
  className?: string;
  children?: unknown;
  [prop: string]: unknown;
}

/** Auto-fitting row of KPI tiles. */
export declare function MetricRow(props?: MetricRowProps): VNode;

export interface MetricCardProps {
  label?: unknown;
  value?: number | string;
  /** Signed change; a number renders as a percentage. */
  delta?: number | string;
  /** What the delta is measured against, e.g. "vs last month". */
  deltaLabel?: string;
  /** Sparkline values for the trend. */
  trend?: number[];
  trendColor?: string;
  /**
   * Which direction is GOOD (default "good" = up is good). Set "bad" for
   * error rates and latency, where rising is worse. An arrow always
   * accompanies the color, so direction never rides on hue alone.
   */
  up?: "good" | "bad";
  format?: (value: number) => string;
  /** Count the value up on mount, driven by the motion ticker. */
  countUp?: boolean;
  /** Render at hero size — at most one per view. */
  hero?: boolean;
  className?: string;
  [prop: string]: unknown;
}

/** KPI tile: label, value, optional delta and sparkline. */
export declare function MetricCard(props?: MetricCardProps): VNode;

export interface MeterProps {
  value?: number;
  max?: number;
  label?: unknown;
  format?: (value: unknown) => string;
  /** Force the severity instead of deriving it from the ratio. */
  tone?: "ok" | "warning" | "critical";
  className?: string;
  [prop: string]: unknown;
}

/** A single ratio against a limit — not a 2-slice pie. */
export declare function Meter(props?: MeterProps): VNode;
