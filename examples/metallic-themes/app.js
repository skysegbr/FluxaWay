import { h, render, useDesign, useEffect } from "/dist/fluxaway.js";
import { useMetalTheme } from "/dist/fluxaway-metallic.js";
import {
  SEMANTIC_ALERTS,
  SEMANTIC_BUTTONS,
  SEMANTIC_STATUSES,
  THEME_DIRECTIONS,
} from "./data.js";
import { CommandHero } from "./components/CommandHero.js";
import { ButtonLab } from "./components/ButtonLab.js";
import { MetricsDeck } from "./components/MetricsDeck.js";
import { OperationsPanel } from "./components/OperationsPanel.js";
import { SemanticStates } from "./components/SemanticStates.js";
import { ThemeBrief } from "./components/ThemeBrief.js";
import { ThemeHeader } from "./components/ThemeHeader.js";

function App() {
  const { setDesign } = useDesign();
  const { metalTheme: themeId, setMetalTheme } = useMetalTheme();
  const activeTheme = THEME_DIRECTIONS.find((item) => item.id === themeId);

  useEffect(() => {
    setDesign("metallic");
  }, []);

  return h(
    "div",
    {
      className: "mt-app",
      dataset: { metalTheme: themeId, metalModel: activeTheme.model },
    },
    h(ThemeHeader, {
      themes: THEME_DIRECTIONS,
      activeThemeId: themeId,
      onThemeChange: setMetalTheme,
    }),
    h(
      "main",
      { className: "m-container mt-main" },
      h(CommandHero, { theme: activeTheme }),
      h(MetricsDeck, null),
      h(OperationsPanel, null),
      h(SemanticStates, {
        alerts: SEMANTIC_ALERTS,
        buttons: SEMANTIC_BUTTONS,
        statuses: SEMANTIC_STATUSES,
      }),
      h(ButtonLab, null),
      h(ThemeBrief, { theme: activeTheme }),
    ),
    h(
      "footer",
      { className: "mt-footer" },
      h("span", { ariaHidden: "true" }, "◆"),
      " FluxaWay Metallic · experimental framework design skin",
    ),
  );
}

render(App, document.getElementById("app"));
