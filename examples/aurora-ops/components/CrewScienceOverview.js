import { h } from "/dist/fluxaway.js";
import {
  ChartCard,
  DashboardGrid,
  DumbbellChart,
  Meter,
  SmallMultiples,
} from "/dist/fluxaway-charts.js";
import {
  CREW_READINESS,
  formatTimestamp,
  LAB_SERIES,
} from "../data.js";

export function CrewScienceOverview({
  scienceRows,
  resources,
  range,
  animate,
  busy,
}) {
  return h(
    "section",
    { className: "ao-section ao-crew" },
    h(
      "div",
      { className: "ao-section-head" },
      h("div", null,
        h("p", { className: "ao-section-index" }, "03 / PESSOAS & CIÊNCIA"),
        h("h2", null, "Capacidade para descobrir"),
      ),
      h("p", null, "Bem-estar, cadência científica e autonomia material na mesma leitura."),
    ),
    h(
      DashboardGrid,
      { min: 340 },
      h(
        ChartCard,
        {
          title: "Prontidão da tripulação",
          subtitle: "Chegada → estado atual · o conector mostra a evolução",
          loading: busy,
        },
        h(DumbbellChart, {
          data: CREW_READINESS,
          x: "crew",
          from: "arrival",
          to: "current",
          fromLabel: "Chegada",
          toLabel: "Agora",
          xLabel: "Tripulante",
          format: (value) => `${value}/100`,
          tickFormat: (value) => `${value}`,
          ariaLabel: "Evolução da prontidão de cada tripulante",
        }),
      ),
      h(
        ChartCard,
        {
          title: "Cadência dos laboratórios",
          subtitle: "Amostras processadas por ciclo · painéis na mesma escala",
          span: 2,
          loading: busy,
        },
        h(SmallMultiples, {
          data: scienceRows,
          x: "timestamp",
          series: LAB_SERIES,
          chart: "area",
          columns: 3,
          height: 156,
          animate,
          xTickFormat: (date) => formatTimestamp(date, range),
          format: (value) => `${value} amostras`,
          ariaLabel: "Cadência de processamento dos três laboratórios",
        }),
      ),
      h(
        ChartCard,
        {
          title: "Autonomia material",
          subtitle: "Reservas disponíveis contra a capacidade total",
          loading: busy,
          className: "ao-resource-card",
        },
        h(
          "div",
          { className: "ao-resource-list" },
          resources.map((resource) =>
            h(Meter, {
              key: resource.id,
              label: resource.label,
              value: resource.value,
              max: resource.max,
              tone: resource.value < 35 ? "critical" : resource.value < 60 ? "warning" : "ok",
              format: (value) => `${value}%`,
            }),
          ),
        ),
      ),
    ),
  );
}
