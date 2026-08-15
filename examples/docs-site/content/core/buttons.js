import { h, Fragment, useTheme } from "/dist/fluxaway.js";
import { Button, IconButton } from "/dist/fluxaway-components-core.js";

export const BUTTON_ENTRIES = [
  {
    slug: "button",
    name: "Button",
    category: "core",
    module: "fluxaway-components-core.js",
    summary:
      "The standard action trigger. Five variants, an optional leading icon and an accent " +
      "modifier that follows the active palette.",
    demos: [
      {
        id: "button-variants",
        title: "Variants",
        note: "outline is the canonical name; outlined stays as a compatibility alias.",
        render: () =>
          h(
            Fragment,
            null,
            h(Button, null, "Text"),
            h(Button, { variant: "contained" }, "Contained"),
            h(Button, { variant: "tonal" }, "Tonal"),
            h(Button, { variant: "outline" }, "Outline"),
            h(Button, { variant: "danger" }, "Danger"),
          ),
      },
      {
        id: "button-icons",
        title: "Icons and accent",
        note:
          "icon takes the built-in \"close\" or any vnode. accent adds a palette-colored " +
          "leading border, and pairs especially well with outline.",
        render: () =>
          h(
            Fragment,
            null,
            h(Button, { variant: "outline", icon: "close" }, "Clear filters"),
            h(Button, { variant: "outline", accent: true }, "Accent"),
            h(
              Button,
              { variant: "tonal", icon: h("i", { className: "bi bi-download" }) },
              "Download",
            ),
          ),
      },
      {
        id: "button-states",
        title: "States and submit",
        note: "An icon-only Button requires ariaLabel or ariaLabelledby — it throws without one.",
        render: () =>
          h(
            Fragment,
            null,
            h(Button, { variant: "contained", disabled: true }, "Disabled"),
            h(Button, { variant: "contained", type: "submit" }, "Submit"),
            h(Button, { variant: "outline", icon: "close", ariaLabel: "Dismiss" }),
          ),
      },
      {
        id: "button-local-metallic",
        title: "Cobalt on buttons only",
        note:
          "Load fluxaway-metallic.css after the component CSS, then scope data-design and " +
          "data-metal-theme to a wrapper containing only the buttons that should become Cobalt.",
        code: `import { h, loadCSS, useTheme } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

await loadCSS("/dist/fluxaway-metallic.css");

function CobaltButtons() {
  const { theme } = useTheme();

  return h(
    "div",
    {
      className: "m-cluster",
      dataset: {
        design: "metallic",
        metalTheme: "cobalt",
        theme,
      },
    },
    h(Button, { variant: "contained" }, "Deploy"),
    h(Button, { variant: "tonal" }, "Review"),
    h(Button, { variant: "outline" }, "Cancel"),
  );
}`,
        render: () => {
          const { theme } = useTheme();

          return h(
            "div",
            {
              className: "m-cluster",
              dataset: {
                design: "metallic",
                metalTheme: "cobalt",
                theme,
              },
            },
            h(Button, { variant: "contained" }, "Deploy"),
            h(Button, { variant: "tonal" }, "Review"),
            h(Button, { variant: "outline" }, "Cancel"),
          );
        },
      },
    ],
    props: [
      {
        name: "variant",
        type: '"text" | "contained" | "tonal" | "outline" | "danger"',
        default: '"text"',
        description: "Visual weight of the button.",
      },
      {
        name: "icon",
        type: 'VNode | "close"',
        description: "Leading icon. The string \"close\" renders the built-in glyph.",
      },
      {
        name: "accent",
        type: "boolean",
        default: "false",
        description: "Adds a --m-primary leading border and emphasizes the icon.",
      },
      {
        name: "type",
        type: '"button" | "submit" | "reset"',
        default: '"button"',
        description: "Native button type.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Disables the control and drops the hover styling.",
      },
      {
        name: "ariaLabel",
        type: "string",
        description: "Accessible name. Required when the button renders only an icon.",
      },
      {
        name: "onClick",
        type: "(event) => void",
        description: "Click handler; any other on* prop is forwarded as a listener too.",
      },
    ],
    notes: [
      "Every unlisted prop is spread onto the underlying <button>, so name, form, value and data attributes pass straight through.",
      "Design scoping is descendant-based. A local Metallic wrapper affects every FluxaWay component inside it, so keep only the controls that should share that material in the wrapper.",
    ],
  },

  {
    slug: "icon-button",
    name: "IconButton",
    category: "core",
    module: "fluxaway-components-core.js",
    summary: "A round, icon-only button. The label prop is its accessible name and is required.",
    demos: [
      {
        id: "icon-button-basic",
        title: "Variants",
        render: () =>
          h(
            Fragment,
            null,
            h(IconButton, { label: "Edit" }, h("i", { className: "bi bi-pencil" })),
            h(IconButton, { label: "Star", variant: "contained" }, h("i", { className: "bi bi-star" })),
            h(IconButton, { label: "Remove", variant: "danger" }, h("i", { className: "bi bi-trash" })),
            h(IconButton, { label: "Locked", disabled: true }, h("i", { className: "bi bi-lock" })),
          ),
      },
    ],
    props: [
      { name: "label", type: "string", description: "aria-label for the button. Required." },
      {
        name: "variant",
        type: '"text" | "contained" | "tonal" | "outline" | "danger"',
        default: '"tonal"',
        description: "Same variant scale as Button.",
      },
      {
        name: "children",
        type: "VNode | string",
        description: "The icon itself — a bootstrap-icons <i>, an SVG, or plain text.",
      },
    ],
  },
];
