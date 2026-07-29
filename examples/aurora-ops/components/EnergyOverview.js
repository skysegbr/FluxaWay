import { h } from "/dist/fluxaway.js";
import {
  ChartCard,
  DashboardGrid,
  DonutChart,
  LineChart,
} from "/dist/fluxaway-charts.js";
import { formatTimestamp } from "../data.js";

const POWER_SERIES = [
  { key: "generation", label: "Geração", slot: 1 },
  { key: "demand", label: "Demanda", slot: 3 },
];

export function EnergyOverview({
  rows,
  mix,
  totalEnergy,
  range,
  animate,
  busy,
}) {
  return h(
    "section",
    { className: "ao-section ao-energy" },
    h(
      "div",
      { className: "ao-section-head" },
      h("div", null,
        h("p", { className: "ao-section-index" }, "01 / ENERGIA"),
        h("h2", null, "Pulso da estação"),
      ),
      h("p", null, "Geração e demanda compartilham a mesma unidade e a mesma escala."),
    ),
    h(
      DashboardGrid,
      { min: 340 },
      h(
        ChartCard,
        {
          title: "Equilíbrio energético",
          subtitle: "Potência instantânea em kW · navegue pelos pontos com o teclado",
          span: 2,
          loading: busy,
          className: "ao-chart-feature",
        },
        h(LineChart, {
          data: rows,
          x: "timestamp",
          series: POWER_SERIES,
          height: 286,
          animate,
          brush: true,
          xTickFormat: (date) => formatTimestamp(date, range),
          xLabel: "Horário",
          format: (value) => `${Number(value).toLocaleString("pt-BR")} kW`,
          tickFormat: (value) => `${value} kW`,
          ariaLabel: "Geração e demanda de energia da estação",
        }),
      ),
      h(
        ChartCard,
        {
          title: "Matriz de geração",
          subtitle: "Participação das três fontes renováveis",
          loading: busy,
          className: "ao-chart-compact",
        },
        h(DonutChart, {
          data: mix,
          x: "source",
          y: "energy",
          label: "Energia por fonte",
          height: 250,
          animate,
          centerLabel: {
            value: `${totalEnergy.toFixed(1)}`,
            label: "MWh no período",
          },
          format: (value) => `${Number(value).toLocaleString("pt-BR")} kWh`,
          ariaLabel: "Distribuição da geração por fonte",
        }),
      ),
    ),
  );
}
