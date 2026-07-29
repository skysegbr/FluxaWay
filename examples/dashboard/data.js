// Deterministic sample data — no network, no randomness, so the dashboard
// renders identically every load (and in the QA screenshots).

export const RANGES = [
  { id: "7d", label: "Last 7 days", points: 7 },
  { id: "30d", label: "Last 30 days", points: 30 },
  { id: "90d", label: "Last 90 days", points: 90 },
];

// A small deterministic generator: a smooth seasonal curve plus a repeatable
// wobble, so the series look like traffic without needing Math.random().
function wobble(i, seed) {
  return Math.sin((i + seed) * 1.7) * 0.5 + Math.sin((i + seed) * 0.6) * 0.5;
}

function series(points, base, growth, seed, weekendDip = true) {
  return Array.from({ length: points }, (_, i) => {
    const trend = base + i * growth;
    const seasonal = trend * 0.12 * wobble(i, seed);
    const weekend = weekendDip && (i % 7 === 5 || i % 7 === 6) ? -trend * 0.22 : 0;
    return Math.max(0, Math.round(trend + seasonal + weekend));
  });
}

const DAY_MS = 86_400_000;
const END = Date.UTC(2026, 6, 29);   // fixed "today" so labels never drift

export function buildSeries(rangeId) {
  const range = RANGES.find((r) => r.id === rangeId) ?? RANGES[1];
  const { points } = range;

  const visits = series(points, 1800, 26, 1);
  const signups = series(points, 46, 1.1, 4);
  const revenue = series(points, 2600, 54, 2);

  const rows = Array.from({ length: points }, (_, i) => ({
    date: new Date(END - (points - 1 - i) * DAY_MS),
    visits: visits[i],
    signups: signups[i],
    revenue: revenue[i],
  }));

  return { range, rows };
}

// Acquisition channels. Nine of them on purpose: the donut's maxSlices folds
// the tail into "Other" rather than inventing a ninth hue.
export const CHANNELS = [
  { channel: "Organic search", sessions: 18420 },
  { channel: "Direct", sessions: 12180 },
  { channel: "Paid social", sessions: 7640 },
  { channel: "Email", sessions: 5210 },
  { channel: "Referral", sessions: 3180 },
  { channel: "Affiliates", sessions: 1420 },
  { channel: "Display", sessions: 980 },
  { channel: "Podcast", sessions: 610 },
  { channel: "Print", sessions: 240 },
];

// Plan mix per region — a stacked bar's natural shape (parts of one whole).
export const REGIONS = [
  { region: "North America", starter: 4200, growth: 3100, scale: 1800 },
  { region: "Europe", starter: 3600, growth: 2400, scale: 1200 },
  { region: "Asia Pacific", starter: 2800, growth: 1500, scale: 700 },
  { region: "Latin America", starter: 1600, growth: 720, scale: 260 },
];

export const PLAN_SERIES = [
  { key: "starter", label: "Starter" },
  { key: "growth", label: "Growth" },
  { key: "scale", label: "Scale" },
];

export const dayLabel = (date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function sum(rows, key) {
  return rows.reduce((total, row) => total + row[key], 0);
}

/** Percentage change between the first and second half of a series. */
export function trendDelta(rows, key) {
  const half = Math.floor(rows.length / 2) || 1;
  const earlier = sum(rows.slice(0, half), key) / half;
  const later = sum(rows.slice(half), key) / (rows.length - half || 1);
  if (!earlier) return 0;
  return Math.round(((later - earlier) / earlier) * 1000) / 10;
}
