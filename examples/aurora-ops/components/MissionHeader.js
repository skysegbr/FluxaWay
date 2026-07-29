import { h } from "/dist/fluxaway.js";
import { Badge, Button } from "/dist/fluxaway-components-core.js";
import { ThemeToggle } from "/dist/fluxaway-components-theme.js";
import { RANGE_OPTIONS } from "../data.js";

export function MissionHeader({
  range,
  busy,
  onRangeChange,
  onRefresh,
  onReplay,
}) {
  return h(
    "header",
    { className: "ao-hero" },
    h("div", { className: "ao-aurora ao-aurora-one", ariaHidden: "true" }),
    h("div", { className: "ao-aurora ao-aurora-two", ariaHidden: "true" }),
    h(
      "div",
      { className: "m-container ao-hero-inner" },
      h(
        "div",
        { className: "ao-brand-row" },
        h(
          "a",
          { className: "ao-brand", href: "./", ariaLabel: "Aurora Ops, início" },
          h("span", { className: "ao-brand-mark", ariaHidden: "true" }, "A"),
          h("span", null, "AURORA", h("small", null, "OPS / ESTAÇÃO 03")),
        ),
        h(
          "div",
          { className: "ao-live" },
          h("span", { className: "ao-live-dot", ariaHidden: "true" }),
          h(Badge, { className: "ao-live-badge" }, "SISTEMAS NOMINAIS"),
        ),
      ),
      h(
        "div",
        { className: "ao-title-row" },
        h(
          "div",
          { className: "ao-title-copy" },
          h("p", { className: "ao-kicker" }, "CENTRO DE COMANDO POLAR · 82°06′S"),
          h("h1", null, "A estação respira", h("br"), "em equilíbrio."),
          h(
            "p",
            { className: "ao-lead" },
            "Energia, habitat e ciência vistos como um único organismo — ",
            "com decisões orientadas pela telemetria das últimas ",
            RANGE_OPTIONS.find((item) => item.id === range)?.label.toLowerCase(),
            ".",
          ),
        ),
        h(
          "div",
          { className: "ao-orbit-card" },
          h("span", { className: "ao-orbit-label" }, "JANELA SOLAR"),
          h("strong", null, "03h 42m"),
          h("span", null, "até o próximo pico"),
          h("div", { className: "ao-orbit-track", ariaHidden: "true" },
            h("span", null),
          ),
        ),
      ),
      h(
        "div",
        { className: "ao-toolbar" },
        h(
          "div",
          { className: "ao-range-group", role: "group", ariaLabel: "Período da telemetria" },
          RANGE_OPTIONS.map((item) =>
            h(
              Button,
              {
                key: item.id,
                variant: item.id === range ? "contained" : "text",
                className: "ao-range-button",
                ariaPressed: String(item.id === range),
                onClick: () => onRangeChange(item.id),
              },
              item.label,
            ),
          ),
        ),
        h(
          "div",
          { className: "ao-toolbar-actions" },
          h(Button, { variant: "text", onClick: onReplay }, "Repetir entrada"),
          h(
            Button,
            {
              variant: "tonal",
              accent: true,
              disabled: busy,
              onClick: onRefresh,
            },
            busy ? "Sincronizando…" : "Sincronizar",
          ),
          h(ThemeToggle, null),
        ),
      ),
    ),
  );
}
