import { h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { ThemeToggle } from "/dist/fluxaway-components-theme.js";

export function MindmapToolbar({ nodeCount, onReset }) {
  return h(
    "header",
    { className: "mm-topbar" },
    h(
      "div",
      { className: "mm-topbar-brand" },
      h("i", { className: "bi-diagram-3" }),
      h("span", null, "Mindmap"),
    ),
    h("p", { className: "mm-topbar-hint" }, "Double-click a card to edit · drag to move · hover for actions"),
    h(
      "div",
      { className: "mm-topbar-actions" },
      h("span", { className: "mm-topbar-count" }, `${nodeCount} idea${nodeCount === 1 ? "" : "s"}`),
      h(ThemeToggle, null),
      h(Button, { variant: "tonal", onClick: onReset }, "Reset demo"),
    ),
  );
}
