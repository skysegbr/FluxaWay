import { h } from "/dist/fluxaway.js";
import {
  MetricCard,
  MetricRow,
} from "/dist/fluxaway-charts.js";

export function MissionMetrics({ metrics, animateKey }) {
  return h(
    "section",
    { className: "ao-metrics", ariaLabel: "Indicadores principais" },
    h(
      MetricRow,
      { min: 200, key: "mission-metrics-stable-layout" },
      h(MetricCard, {
        key: `energy-${animateKey}-stable-v2`,
        label: "Energia limpa · MWh",
        value: metrics.energy.value,
        format: (value) => value.toFixed(1),
        delta: metrics.energy.delta,
        deltaLabel: "ritmo do período",
        trend: metrics.energy.trend,
        countUp: true,
        hero: true,
      }),
      h(MetricCard, {
        key: `autonomy-${animateKey}-stable-v2`,
        label: "Autonomia energética",
        value: metrics.autonomy.value,
        format: (value) => `${value.toFixed(1)}%`,
        delta: metrics.autonomy.delta,
        deltaLabel: "vs. janela anterior",
        trend: metrics.autonomy.trend,
        trendColor: "var(--m-chart-2)",
        countUp: true,
      }),
      h(MetricCard, {
        key: `habitat-${animateKey}-stable-v2`,
        label: "Disponibilidade do habitat",
        value: metrics.habitat.value,
        format: (value) => `${value.toFixed(2)}%`,
        delta: metrics.habitat.delta,
        deltaLabel: "sem incidentes",
        trend: metrics.habitat.trend,
        trendColor: "var(--m-chart-3)",
        countUp: true,
      }),
      h(MetricCard, {
        key: `science-${animateKey}-stable-v2`,
        label: "Experimentos ativos",
        value: metrics.science.value,
        delta: metrics.science.delta,
        deltaLabel: "novos ciclos",
        trend: metrics.science.trend,
        trendColor: "var(--m-chart-4)",
        countUp: true,
      }),
      h(MetricCard, {
        key: `crew-${animateKey}-stable-v2`,
        label: "Prontidão da tripulação",
        value: metrics.readiness.value,
        format: (value) => `${Math.round(value)}/100`,
        delta: metrics.readiness.delta,
        deltaLabel: "desde a chegada",
        trend: metrics.readiness.trend,
        trendColor: "var(--m-chart-5)",
        countUp: true,
      }),
    ),
  );
}
