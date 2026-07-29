import { useEffect, useMemo, useState } from "/dist/fluxaway.js";
import {
  buildHabitatGrid,
  buildScienceRows,
  buildTelemetry,
  CREW_READINESS,
  halfDelta,
  RESOURCE_LEVELS,
  sum,
} from "../data.js";

export function useMissionDashboard() {
  const [range, setRange] = useState("24h");
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState(0);

  const telemetry = useMemo(() => buildTelemetry(range), [range]);
  const habitatGrid = useMemo(() => buildHabitatGrid(range), [range]);
  const scienceRows = useMemo(
    () => buildScienceRows(telemetry.rows),
    [telemetry.rows],
  );

  useEffect(() => {
    if (!busy) return undefined;
    const timer = setTimeout(() => setBusy(false), 850);
    return () => clearTimeout(timer);
  }, [busy]);

  const energyMix = useMemo(() => [
    { source: "Solar polar", energy: sum(telemetry.rows, "solar") },
    { source: "Eólica", energy: sum(telemetry.rows, "wind") },
    { source: "Hidrogênio", energy: sum(telemetry.rows, "hydrogen") },
  ], [telemetry.rows]);

  const metrics = useMemo(() => {
    const energy = (sum(telemetry.rows, "generation") * telemetry.range.stepHours) / 1000;
    const demand = sum(telemetry.rows, "demand");
    const generation = sum(telemetry.rows, "generation");
    const autonomy = generation ? Math.min(100, (generation / demand) * 100) : 0;
    const readiness = CREW_READINESS.reduce((total, row) => total + row.current, 0)
      / CREW_READINESS.length;

    return {
      energy: {
        value: Math.round(energy * 10) / 10,
        delta: halfDelta(telemetry.rows, "generation"),
        trend: telemetry.rows.map((row) => row.generation),
      },
      autonomy: {
        value: Math.round(autonomy * 10) / 10,
        delta: 1.8,
        trend: telemetry.rows.map((row) =>
          Math.min(100, (row.generation / row.demand) * 100)),
      },
      habitat: {
        value: range === "30d" ? 99.91 : range === "7d" ? 99.96 : 99.98,
        delta: 0.04,
        trend: [99.91, 99.93, 99.92, 99.95, 99.96, 99.98],
      },
      science: {
        value: 18,
        delta: 3,
        trend: scienceRows.map((row) => row.cryo + row.ice + row.atmosphere),
      },
      readiness: {
        value: Math.round(readiness),
        delta: 7.4,
        trend: CREW_READINESS.map((row) => row.current),
      },
    };
  }, [range, scienceRows, telemetry.range.stepHours, telemetry.rows]);

  const resources = useMemo(() => RESOURCE_LEVELS.map((item) => ({
    ...item,
    value: range === "30d" ? Math.max(0, item.value - 8) : range === "7d"
      ? Math.max(0, item.value - 3)
      : item.value,
  })), [range]);

  return {
    range,
    setRange,
    busy,
    refresh: () => setBusy(true),
    replay: () => setRun((value) => value + 1),
    rows: telemetry.rows,
    habitatGrid,
    scienceRows,
    energyMix,
    resources,
    metrics,
    animate: { key: `${range}-${run}`, duration: 680, stagger: 38 },
  };
}
