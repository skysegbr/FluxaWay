import { h, useState } from "/dist/fluxaway.js";
import { Alert, Card, Chip } from "/dist/fluxaway-components-core.js";

import { BREAKPOINTS, EXPLORE_FILTERS } from "../data.js";

export function ExploreScreen() {
  const [active, setActive] = useState("all");

  return h(
    "div",
    { className: "mob-screen" },
    h(
      "header",
      { className: "mob-screen-intro" },
      h("span", { className: "mob-kicker" }, "Layout explorer"),
      h("h2", null, "One grid, every screen."),
      h("p", null, "Resize the browser to watch mobile-first columns grow into a spacious dashboard."),
    ),
    h(
      "div",
      { className: "m-cluster mob-filter-row" },
      EXPLORE_FILTERS.map((filter) =>
        h(Chip, { key: filter, active: active === filter, onClick: () => setActive(filter) }, filter),
      ),
    ),
    h(
      Alert,
      { variant: "info", title: "12-column grid", className: "mob-grid-alert" },
      "Start with m-col-12, then add only the wider breakpoints you need.",
    ),
    h(
      "div",
      { className: "mob-section-head m-mt-6" },
      h("div", null, h("span", null, "Live scale"), h("h2", null, "Breakpoint map")),
      h("i", { className: "bi bi-aspect-ratio", ariaHidden: "true" }),
    ),
    h(
      "div",
      { className: "m-row mob-breakpoint-grid" },
      BREAKPOINTS.map((breakpoint) =>
        h(
          "div",
          { key: breakpoint.label, className: "m-col-6 m-col-md-3 m-mb-3" },
          h(
            Card,
            { padded: true, className: "mob-breakpoint-card" },
            h("span", { className: "mob-breakpoint-icon", ariaHidden: "true" }, h("i", { className: "bi bi-display" })),
            h("code", { className: "mob-breakpoint-label" }, breakpoint.label),
            h("p", { className: "m-text-muted m-mb-0" }, breakpoint.desc),
          ),
        ),
      ),
    ),
  );
}
