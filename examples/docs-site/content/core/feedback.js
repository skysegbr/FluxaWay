import { h, Fragment, useState } from "/dist/fluxaway.js";
import { Alert, Badge, Chip, Spinner, Progress, Button } from "/dist/fluxaway-components-core.js";

export const FEEDBACK_ENTRIES = [
  {
    slug: "alert",
    name: "Alert",
    category: "core",
    module: "fluxaway-components-core.js",
    summary: "An inline message box for status, validation results and warnings.",
    demos: [
      {
        id: "alert-variants",
        title: "Variants",
        stack: true,
        render: () =>
          h(
            Fragment,
            null,
            h(Alert, { variant: "info", title: "Heads up" }, "The nightly export finished."),
            h(Alert, { variant: "success" }, "Settings saved."),
            h(Alert, { variant: "warning" }, "Your API key expires in 3 days."),
            h(Alert, { variant: "danger", title: "Upload failed" }, "The file exceeds 10 MB."),
          ),
      },
    ],
    props: [
      {
        name: "variant",
        type: '"info" | "success" | "warning" | "danger"',
        default: '"info"',
        description: "Color and icon of the alert.",
      },
      { name: "title", type: "string", description: "Optional bold heading above the body." },
      { name: "children", type: "VNode | string", description: "Alert body." },
    ],
  },

  {
    slug: "badge",
    name: "Badge",
    category: "core",
    module: "fluxaway-components-core.js",
    summary: "A small count or status label. Color comes from a modifier class, not a prop.",
    demos: [
      {
        id: "badge-basic",
        title: "Colors",
        render: () =>
          h(
            Fragment,
            null,
            h(Badge, null, "New"),
            h(Badge, { className: "m-badge-success" }, "Active"),
            h(Badge, { className: "m-badge-warning" }, "Pending"),
            h(Badge, { className: "m-badge-danger" }, "3"),
          ),
      },
    ],
    props: [
      {
        name: "className",
        type: "string",
        description: "Extra classes — m-badge-success | -warning | -danger tint the badge.",
      },
      { name: "children", type: "VNode | string", description: "Badge content." },
    ],
  },

  {
    slug: "chip",
    name: "Chip",
    category: "core",
    module: "fluxaway-components-core.js",
    summary: "A toggleable tag, typically used for filters. The active state is yours to hold.",
    demos: [
      {
        id: "chip-filters",
        title: "Filter row",
        render: () => {
          const [picked, setPicked] = useState("Design");
          const tags = ["Design", "Engineering", "Marketing"];

          return h(
            "div",
            { className: "nd-inline" },
            tags.map((tag) =>
              h(
                Chip,
                { key: tag, active: tag === picked, onClick: () => setPicked(tag) },
                tag,
              ),
            ),
          );
        },
      },
    ],
    props: [
      { name: "active", type: "boolean", default: "false", description: "Renders the selected style." },
      { name: "onClick", type: "(event) => void", description: "Click handler." },
      { name: "children", type: "VNode | string", description: "Chip label." },
    ],
  },

  {
    slug: "spinner",
    name: "Spinner",
    category: "core",
    module: "fluxaway-components-core.js",
    summary: "An indeterminate loading indicator with a built-in accessible label.",
    demos: [
      {
        id: "spinner-basic",
        title: "Loading",
        render: () =>
          h(
            Fragment,
            null,
            h(Spinner, null),
            h(Spinner, { label: "Fetching orders" }),
          ),
      },
    ],
    props: [
      {
        name: "label",
        type: "string",
        default: '"Loading"',
        description: "Accessible name announced to screen readers.",
      },
    ],
  },

  {
    slug: "progress",
    name: "Progress",
    category: "core",
    module: "fluxaway-components-core.js",
    summary: "A determinate progress bar driven by value and max.",
    demos: [
      {
        id: "progress-basic",
        title: "Controlled value",
        stack: true,
        render: () => {
          const [value, setValue] = useState(40);

          return h(
            "div",
            { className: "nd-stack" },
            h(Progress, { value, label: `Upload ${value}%` }),
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: "tonal", onClick: () => setValue(Math.max(0, value - 20)) }, "-20"),
              h(Button, { variant: "tonal", onClick: () => setValue(Math.min(100, value + 20)) }, "+20"),
            ),
          );
        },
      },
    ],
    props: [
      { name: "value", type: "number", default: "0", description: "Current progress." },
      { name: "max", type: "number", default: "100", description: "Value that counts as complete." },
      { name: "label", type: "string", description: "Accessible name for the bar." },
    ],
  },
];
