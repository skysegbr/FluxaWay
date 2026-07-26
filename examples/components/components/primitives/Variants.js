import { h } from "/dist/nexa.js";

export function Variants() {
  return h(
    "div",
    { className: "demo-section" },
    h("p", { className: "demo-label" }, "Card variant — m-card-hover"),
    h("p", { className: "m-text-xs m-text-muted", style: { marginBottom: "var(--m-space-3)" } }, "m-card-hover (clickable)"),
    h("div", { className: "m-grid-3" },
      ["Monthly report", "Data pipeline", "Sales dashboard"].map((title) =>
        h(
          "article",
          {
            key: title,
            className: "m-card m-card-padded m-card-hover",
            onClick: () => {},
          },
          h("p", { style: { margin: "0 0 var(--m-space-2)", fontWeight: 700 } }, title),
          h("p", { className: "m-text-sm m-text-muted", style: { margin: 0 } }, "Click to open"),
        ),
      ),
    ),
  );
}
