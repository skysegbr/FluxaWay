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

// Visits per REGION over time. Small multiples compare the SAME measure
// across slices, which is what makes one shared y-scale honest — faceting
// three different units (sessions, signups, dollars) on one scale would flatten
// the small ones into a line at zero.
export function buildRegionSeries(rangeId) {
  const { rows } = buildSeries(rangeId);
  const shares = [
    ["North America", 0.42, 2], ["Europe", 0.31, 5],
    ["Asia Pacific", 0.18, 8], ["Latin America", 0.09, 11],
  ];
  return {
    rows: rows.map((row, i) => {
      const out = { date: row.date };
      for (const [region, share, seed] of shares) {
        out[region] = Math.round(row.visits * share * (1 + 0.18 * wobble(i, seed)));
      }
      return out;
    }),
    series: shares.map(([region]) => ({ key: region, label: region })),
  };
}

// ── Grid data for the heatmap: sessions by weekday x hour ───────────────────
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HOURS = ["00", "03", "06", "09", "12", "15", "18", "21"];

export const TRAFFIC_GRID = DAYS.flatMap((day, d) =>
  HOURS.map((hour, hIndex) => {
    // Office hours peak on weekdays; weekends flatten out and shift later.
    const weekend = d >= 5;
    const peak = weekend ? 6 : 4;                      // index of the busiest hour
    const spread = weekend ? 3.4 : 2.2;
    const shape = Math.exp(-(((hIndex - peak) / spread) ** 2));
    // Midweek runs busier than Monday or Friday, so the grid has vertical
    // structure to read as well as horizontal.
    const weekdayLift = [0.86, 1.0, 1.08, 1.02, 0.9, 1, 1][d];
    const base = (weekend ? 210 : 480) * weekdayLift;
    return { day, hour, sessions: Math.round(base * shape) + (weekend ? 20 : 40) };
  }),
);

// ── Scatter: spend vs revenue per account, grouped by segment ───────────────
const SEGMENTS = ["SMB", "Mid-market", "Enterprise", "Partner", "Reseller"];

export const ACCOUNTS = Array.from({ length: 60 }, (_, i) => {
  const segment = SEGMENTS[i % SEGMENTS.length];
  const tier = SEGMENTS.indexOf(segment);
  const spend = 400 + ((i * 137) % 2600) + tier * 300;
  // revenue tracks spend with a repeatable wobble, so the correlation is real
  const revenue = Math.round(spend * (1.6 + tier * 0.25) + wobble(i, 3) * 900);
  return { account: `Account ${i + 1}`, segment, spend, revenue: Math.max(120, revenue) };
});

// ── Budget variance per team: a signed value against a baseline ─────────────
export const VARIANCE = [
  { team: "Platform", delta: 18 },
  { team: "Growth", delta: -12 },
  { team: "Payments", delta: 4 },
  { team: "Mobile", delta: -25 },
  { team: "Data", delta: 31 },
  { team: "Support", delta: -3 },
];

// ── Survey responses on an ordered scale ───────────────────────────────────
export const SURVEY = [
  { question: "Docs are clear", sd: 4, d: 9, n: 15, a: 42, sa: 30 },
  { question: "Setup was easy", sd: 12, d: 22, n: 18, a: 30, sa: 18 },
  { question: "I'd recommend it", sd: 3, d: 5, n: 12, a: 35, sa: 45 },
  { question: "Errors are helpful", sd: 20, d: 28, n: 22, a: 20, sa: 10 },
];

export const SURVEY_SCALE = [
  { key: "sd", label: "Strongly disagree" },
  { key: "d", label: "Disagree" },
  { key: "n", label: "Neutral" },
  { key: "a", label: "Agree" },
  { key: "sa", label: "Strongly agree" },
];

// ── Page load time before and after the optimisation work ──────────────────
export const LOAD_TIMES = [
  { page: "Home", before: 2.8, after: 1.2 },
  { page: "Search", before: 4.1, after: 2.6 },
  { page: "Product", before: 3.6, after: 1.9 },
  { page: "Checkout", before: 3.2, after: 3.4 },
  { page: "Profile", before: 1.9, after: 0.9 },
];
