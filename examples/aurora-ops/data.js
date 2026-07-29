// Telemetria determinística: o dashboard mantém a mesma história visual em
// screenshots, testes e recargas, sem depender de rede ou Math.random().

export const RANGE_OPTIONS = [
  { id: "24h", label: "24 horas", points: 24, stepHours: 1 },
  { id: "7d", label: "7 dias", points: 28, stepHours: 6 },
  { id: "30d", label: "30 dias", points: 30, stepHours: 24 },
];

export const HABITAT_BASE = [
  { module: "Estufa", shift: "00–06", energy: 38 },
  { module: "Estufa", shift: "06–12", energy: 74 },
  { module: "Estufa", shift: "12–18", energy: 86 },
  { module: "Estufa", shift: "18–24", energy: 52 },
  { module: "Laboratório", shift: "00–06", energy: 44 },
  { module: "Laboratório", shift: "06–12", energy: 69 },
  { module: "Laboratório", shift: "12–18", energy: 91 },
  { module: "Laboratório", shift: "18–24", energy: 63 },
  { module: "Alojamento", shift: "00–06", energy: 61 },
  { module: "Alojamento", shift: "06–12", energy: 48 },
  { module: "Alojamento", shift: "12–18", energy: 42 },
  { module: "Alojamento", shift: "18–24", energy: 78 },
  { module: "Oficina", shift: "00–06", energy: 21 },
  { module: "Oficina", shift: "06–12", energy: 57 },
  { module: "Oficina", shift: "12–18", energy: 72 },
  { module: "Oficina", shift: "18–24", energy: 34 },
  { module: "Comunicações", shift: "00–06", energy: 31 },
  { module: "Comunicações", shift: "06–12", energy: 36 },
  { module: "Comunicações", shift: "12–18", energy: 40 },
  { module: "Comunicações", shift: "18–24", energy: 37 },
];

export const CLIMATE_VARIANCE = [
  { zone: "Estufa", variance: 3.2 },
  { zone: "Laboratório", variance: -1.4 },
  { zone: "Alojamento", variance: 0.8 },
  { zone: "Oficina", variance: -4.6 },
  { zone: "Comunicações", variance: 1.9 },
];

export const CREW_READINESS = [
  { crew: "Maya · geologia", arrival: 71, current: 89 },
  { crew: "Caio · biologia", arrival: 76, current: 92 },
  { crew: "Lin · sistemas", arrival: 84, current: 87 },
  { crew: "Noor · clima", arrival: 68, current: 85 },
  { crew: "Ivo · operações", arrival: 79, current: 91 },
];

export const RESOURCE_LEVELS = [
  { id: "water", label: "Água potável", value: 78, max: 100 },
  { id: "oxygen", label: "Reserva de O₂", value: 91, max: 100 },
  { id: "food", label: "Alimentos", value: 64, max: 100 },
];

export const LAB_SERIES = [
  { key: "cryo", label: "Criobiologia", slot: 1 },
  { key: "ice", label: "Núcleos de gelo", slot: 2 },
  { key: "atmosphere", label: "Atmosfera", slot: 3 },
];

const END = Date.UTC(2026, 6, 29, 15);
const HOUR_MS = 3_600_000;

function wave(index, seed) {
  return Math.sin((index + seed) * 0.71) * 0.58
    + Math.sin((index + seed) * 0.19) * 0.42;
}

export function buildTelemetry(rangeId) {
  const range = RANGE_OPTIONS.find((item) => item.id === rangeId) ?? RANGE_OPTIONS[0];
  const rows = Array.from({ length: range.points }, (_, index) => {
    const timestamp = new Date(
      END - (range.points - 1 - index) * range.stepHours * HOUR_MS,
    );
    const localHour = timestamp.getUTCHours();
    const daylight = Math.max(0, Math.sin(((localHour - 4) / 20) * Math.PI));
    const solar = Math.round(62 + daylight * 284 + wave(index, 2) * 18);
    const wind = Math.round(176 + wave(index, 6) * 52);
    const hydrogen = Math.round(82 + wave(index, 11) * 14);
    const generation = Math.max(0, solar + wind + hydrogen);
    const demand = Math.round(390 + wave(index, 9) * 43 + (localHour >= 18 ? 34 : 0));

    return {
      timestamp,
      solar: Math.max(18, solar),
      wind: Math.max(70, wind),
      hydrogen: Math.max(48, hydrogen),
      generation,
      demand,
    };
  });

  return { range, rows };
}

export function buildHabitatGrid(rangeId) {
  const factor = rangeId === "24h" ? 0.94 : rangeId === "30d" ? 1.08 : 1;
  return HABITAT_BASE.map((cell, index) => ({
    ...cell,
    energy: Math.round(cell.energy * factor + wave(index, 4) * 3),
  }));
}

export function buildScienceRows(timeline) {
  return timeline.map((row, index) => ({
    timestamp: row.timestamp,
    cryo: Math.max(2, Math.round(8 + index * 0.18 + wave(index, 1) * 2)),
    ice: Math.max(2, Math.round(6 + index * 0.12 + wave(index, 5) * 2)),
    atmosphere: Math.max(2, Math.round(7 + index * 0.15 + wave(index, 9) * 2)),
  }));
}

export function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}

export function average(rows, key) {
  return rows.length ? sum(rows, key) / rows.length : 0;
}

export function halfDelta(rows, key) {
  const split = Math.max(1, Math.floor(rows.length / 2));
  const earlier = average(rows.slice(0, split), key);
  const later = average(rows.slice(split), key);
  return earlier ? Math.round(((later - earlier) / earlier) * 1000) / 10 : 0;
}

export function formatTimestamp(date, rangeId) {
  if (rangeId === "24h") {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
