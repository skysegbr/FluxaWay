import { h } from "/dist/fluxaway.js";
import { Badge } from "/dist/fluxaway-components-core.js";

import { ACTIVITY_ITEMS } from "../data.js";

export function ActivityScreen() {
  return h(
    "div",
    { className: "mob-screen" },
    h(
      "header",
      { className: "mob-screen-intro" },
      h("span", { className: "mob-kicker" }, "System pulse"),
      h("h2", null, "Everything is moving."),
      h("p", null, "A compact activity stream built from semantic list and badge primitives."),
    ),
    h(
      "section",
      { className: "mob-activity-card", ariaLabel: "Recent activity" },
      h(
        "div",
        { className: "mob-activity-summary" },
        h("span", null, h("i", { className: "bi bi-activity", ariaHidden: "true" })),
        h("div", null, h("strong", null, "All systems ready"), h("small", null, "5 checks completed today")),
      ),
      h(
        "ul",
        { className: "mob-activity-list" },
        ACTIVITY_ITEMS.map((item) =>
          h(
            "li",
            { key: item.id },
            h("span", { className: "mob-activity-icon", ariaHidden: "true" }, h("i", { className: `bi ${item.icon}` })),
            h("span", { className: "mob-activity-copy" }, h("strong", null, item.text), h("small", null, item.detail)),
            h(Badge, null, item.time),
          ),
        ),
      ),
    ),
  );
}
