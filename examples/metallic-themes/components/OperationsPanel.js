import { h } from "/dist/fluxaway.js";
import { Badge, Card, Progress } from "/dist/fluxaway-components-core.js";
import { ACTIVITY, SYSTEMS } from "../data.js";

export function OperationsPanel() {
  return h(
    "section",
    { className: "mt-operations", ariaLabelledby: "mt-operations-title" },
    h(
      Card,
      { className: "mt-system-card" },
      h(
        "div",
        { className: "mt-section-heading" },
        h("div", null,
          h("p", null, "LIVE READINESS"),
          h("h2", { id: "mt-operations-title" }, "System posture"),
        ),
        h(Badge, { className: "mt-status-badge" }, "NOMINAL"),
      ),
      h(
        "div",
        { className: "mt-system-list" },
        SYSTEMS.map((system) =>
          h(
            "div",
            { key: system.name, className: "mt-system-row" },
            h("div", { className: "mt-system-copy" },
              h("strong", null, system.name),
              h("span", null, system.detail),
            ),
            h("strong", { className: "mt-system-value" }, `${system.value}%`),
            h(Progress, { value: system.value, label: `${system.name} readiness` }),
          ),
        ),
      ),
    ),
    h(
      Card,
      { className: "mt-activity-card" },
      h("div", { className: "mt-section-heading" },
        h("div", null,
          h("p", null, "CONTROL LOG"),
          h("h2", null, "Recent signals"),
        ),
        h("span", { className: "mt-live-pulse", ariaLabel: "Live" }),
      ),
      h(
        "ol",
        { className: "mt-activity-list" },
        ACTIVITY.map((item) =>
          h(
            "li",
            { key: item.time },
            h("time", { dateTime: item.time }, item.time),
            h("span", { className: "mt-activity-marker", ariaHidden: "true" }),
            h("div", null,
              h("strong", null, item.title),
              h("span", null, item.detail),
            ),
          ),
        ),
      ),
    ),
  );
}
