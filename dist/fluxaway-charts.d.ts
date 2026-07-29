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
  className?: string;
  [prop: string]: unknown;
}

export interface LineChartProps<Row = any> extends ChartCommon<Row> {
  /** Fill under the line at ~10% opacity. */
  area?: boolean;
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
