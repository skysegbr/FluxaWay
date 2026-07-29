import { h } from "/dist/fluxaway.js";
import {
  BarChart,
  ChartCard,
  DashboardGrid,
  Heatmap,
} from "/dist/fluxaway-charts.js";
import { CLIMATE_VARIANCE } from "../data.js";

export function HabitatOverview({ grid, animate, busy }) {
  return h(
    "section",
    { className: "ao-section ao-habitat" },
    h(
      "div",
      { className: "ao-section-head" },
      h("div", null,
        h("p", { className: "ao-section-index" }, "02 / HABITAT"),
        h("h2", null, "Onde a energia acontece"),
      ),
      h("p", null, "Intensidade por turno e desvio térmico contra a faixa ideal."),
    ),
    h(
      DashboardGrid,
      { min: 340 },
      h(
        ChartCard,
        {
          title: "Carga por módulo",
          subtitle: "kWh por turno · a escala sequencial indica magnitude",
          span: 2,
          loading: busy,
        },
        h(Heatmap, {
          data: grid,
          x: "shift",
          y: "module",
          value: "energy",
          label: "Consumo de energia",
          showValues: true,
          format: (value) => `${value} kWh`,
          ariaLabel: "Mapa de calor do consumo por módulo e turno",
        }),
      ),
      h(
        ChartCard,
        {
          title: "Envelope térmico",
          subtitle: "Desvio percentual do alvo · zero é a condição ideal",
          loading: busy,
        },
        h(BarChart, {
          data: CLIMATE_VARIANCE,
          x: "zone",
          y: "variance",
          label: "Desvio",
          horizontal: true,
          diverging: true,
          height: 270,
          animate,
          xLabel: "Módulo",
          format: (value) => `${Number(value) > 0 ? "+" : ""}${value}%`,
          tickFormat: (value) => `${value}%`,
          ariaLabel: "Desvio térmico dos módulos em relação ao ideal",
        }),
      ),
    ),
  );
}
