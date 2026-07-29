import { h, render } from "/dist/fluxaway.js";
import { MissionHeader } from "./components/MissionHeader.js";
import { MissionMetrics } from "./components/MissionMetrics.js";
import { EnergyOverview } from "./components/EnergyOverview.js";
import { HabitatOverview } from "./components/HabitatOverview.js";
import { CrewScienceOverview } from "./components/CrewScienceOverview.js";
import { useMissionDashboard } from "./components/useMissionDashboard.js";

function App() {
  const dashboard = useMissionDashboard();

  return h(
    "div",
    { className: "ao-app" },
    h(MissionHeader, {
      range: dashboard.range,
      busy: dashboard.busy,
      onRangeChange: dashboard.setRange,
      onRefresh: dashboard.refresh,
      onReplay: dashboard.replay,
    }),
    h(
      "main",
      { className: "m-container ao-main" },
      h(MissionMetrics, {
        metrics: dashboard.metrics,
        animateKey: dashboard.animate.key,
      }),
      h(EnergyOverview, {
        rows: dashboard.rows,
        mix: dashboard.energyMix,
        totalEnergy: dashboard.metrics.energy.value,
        range: dashboard.range,
        animate: dashboard.animate,
        busy: dashboard.busy,
      }),
      h(HabitatOverview, {
        grid: dashboard.habitatGrid,
        animate: dashboard.animate,
        busy: dashboard.busy,
      }),
      h(CrewScienceOverview, {
        scienceRows: dashboard.scienceRows,
        resources: dashboard.resources,
        range: dashboard.range,
        animate: dashboard.animate,
        busy: dashboard.busy,
      }),
      h(
        "footer",
        { className: "ao-footer" },
        h("span", { ariaHidden: "true" }, "✦"),
        " Telemetria simulada · último pacote recebido há 12 segundos · Estação Aurora 03",
      ),
    ),
  );
}

render(App, document.getElementById("app"));
