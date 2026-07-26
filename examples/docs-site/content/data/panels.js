import { h, useState } from "/dist/fluxaway.js";
import { Badge, Button } from "/dist/fluxaway-components-core.js";
import { Stat, StatGrid, TreeView, Accordion, Collapse } from "/dist/fluxaway-components-data.js";

const TREE = [
  {
    id: "src",
    label: "components",
    children: [
      { id: "button", label: "Button.js" },
      { id: "button-css", label: "Button.css" },
      {
        id: "cards",
        label: "cards",
        children: [
          { id: "card-media", label: "CardMedia.js" },
          { id: "card-glow", label: "CardGlow.js" },
        ],
      },
    ],
  },
  { id: "app", label: "app.js" },
  { id: "data", label: "data.js" },
];

export const PANEL_ENTRIES = [
  {
    slug: "stat",
    name: "Stat",
    category: "data",
    module: "fluxaway-components-data.js",
    summary:
      "A KPI tile: big value, small label, and an optional delta that colors itself from its " +
      "leading sign.",
    demos: [
      {
        id: "stat-basic",
        title: "Value, delta and icon",
        note: 'A delta starting with "-" turns red on its own — you do not pass a direction.',
        render: () =>
          h(
            StatGrid,
            null,
            h(Stat, {
              value: "17,816",
              label: "Matching recalls",
              icon: h("i", { className: "bi bi-clipboard-pulse" }),
            }),
            h(Stat, { value: "2,580", label: "Ongoing", delta: "+12%" }),
            h(Stat, { value: "R$ 47k", label: "Budget", delta: "-3%", help: "vs. last month" }),
          ),
      },
    ],
    props: [
      { name: "value", type: "string | number", description: "The headline number." },
      { name: "label", type: "string", description: "Caption under the value." },
      { name: "delta", type: "string", description: 'Change indicator, e.g. "+12%". A leading "-" colors it down.' },
      { name: "icon", type: "VNode", description: "Decorative leading icon." },
      { name: "help", type: "string", description: "Extra context line." },
    ],
  },

  {
    slug: "stat-grid",
    name: "StatGrid",
    category: "data",
    module: "fluxaway-components-data.js",
    summary: "The auto-fit wrapper for a row of Stat tiles. No props beyond children.",
    demos: [
      {
        id: "stat-grid-basic",
        title: "Responsive row",
        note: "Tiles reflow into as many columns as the container fits.",
        render: () =>
          h(
            StatGrid,
            null,
            h(Stat, { value: "12", label: "Runs today" }),
            h(Stat, { value: "1", label: "Failing", delta: "-1" }),
            h(Stat, { value: "98.6%", label: "Uptime", delta: "+0.2%" }),
            h(Stat, { value: "1.4s", label: "p95 latency" }),
          ),
      },
    ],
    props: [{ name: "children", type: "VNode", description: "The Stat tiles." }],
  },

  {
    slug: "tree-view",
    name: "TreeView",
    category: "data",
    module: "fluxaway-components-data.js",
    summary:
      "A WAI-ARIA tree for hierarchical data. Expansion can be uncontrolled or controlled; " +
      "selection is always controlled.",
    demos: [
      {
        id: "tree-view-basic",
        title: "File tree",
        stack: true,
        render: () => {
          const [selected, setSelected] = useState("button");

          return h(
            "div",
            { className: "nd-stack" },
            h(TreeView, {
              items: TREE,
              defaultExpanded: ["src"],
              selected,
              onSelect: setSelected,
              ariaLabel: "Project files",
            }),
            h(Badge, null, `Selected: ${selected}`),
          );
        },
      },
    ],
    props: [
      {
        name: "items",
        type: "Array<{ id, label, icon?, children? }>",
        default: "[]",
        description: "The tree. A node with children becomes a branch.",
      },
      { name: "defaultExpanded", type: "string[]", default: "[]", description: "Ids open on first render." },
      { name: "expanded", type: "string[]", description: "Controlled expansion — pair with onExpandedChange." },
      { name: "selected", type: "string", description: "Id of the selected node." },
      { name: "onSelect", type: "(id: string) => void", description: "Called when a node is chosen." },
      { name: "ariaLabel", type: "string", default: '"Tree"', description: "Accessible name of the tree." },
    ],
    notes: [
      "Keyboard follows the ARIA pattern with a roving tabindex over the visible nodes: Up/Down walk, Right expands or enters, Left collapses or climbs, Home/End jump, Enter/Space select.",
    ],
  },

  {
    slug: "accordion",
    name: "Accordion",
    category: "data",
    module: "fluxaway-components-data.js",
    summary:
      "Grouped collapsible panels. One open at a time by default; multiple lets several stay open.",
    demos: [
      {
        id: "accordion-basic",
        title: "Single open (uncontrolled)",
        stack: true,
        render: () =>
          h(Accordion, {
            defaultOpen: "faq-1",
            items: [
              { key: "faq-1", title: "What is FluxaWay?", children: h("p", null, "A no-build, ESM-native framework.") },
              { key: "faq-2", title: "Does it need a bundler?", children: h("p", null, "No. Plain ES modules over HTTP.") },
              { key: "faq-3", title: "A disabled panel", children: h("p", null, "Never seen."), disabled: true },
            ],
          }),
      },
      {
        id: "accordion-controlled",
        title: "Controlled and multiple",
        stack: true,
        render: () => {
          const [open, setOpen] = useState(["a"]);

          return h(
            "div",
            { className: "nd-stack" },
            h(Accordion, {
              multiple: true,
              open,
              onToggle: (_key, nextKeys) => setOpen(nextKeys),
              items: [
                { key: "a", title: "Build", children: h("p", null, "Nothing to build.") },
                { key: "b", title: "Test", children: h("p", null, "Python plus a real browser.") },
                { key: "c", title: "Deploy", children: h("p", null, "Copy the folder anywhere.") },
              ],
            }),
            h(Badge, null, `Open: ${open.join(", ") || "none"}`),
          );
        },
      },
    ],
    props: [
      {
        name: "items",
        type: "Array<{ key, title, children, disabled? }>",
        default: "[]",
        description: "The panels.",
      },
      { name: "multiple", type: "boolean", default: "false", description: "Allows several panels open at once." },
      { name: "defaultOpen", type: "key | key[]", description: "Initially open panels (uncontrolled)." },
      { name: "open", type: "key | key[]", description: "Controlled open set. Omit for uncontrolled." },
      {
        name: "onToggle",
        type: "(key, nextOpenKeys) => void",
        description: "Receives the toggled key and the resulting open set.",
      },
    ],
  },

  {
    slug: "collapse",
    name: "Collapse",
    category: "data",
    module: "fluxaway-components-data.js",
    summary:
      "A single collapsible section, animated with the grid-template-rows 0fr → 1fr trick so it " +
      "grows to its real content height without a hard-coded max-height.",
    demos: [
      {
        id: "collapse-basic",
        title: "With a badge and actions",
        stack: true,
        render: () =>
          h(
            Collapse,
            {
              title: "Run history",
              defaultOpen: true,
              badge: h(Badge, null, "4"),
              actions: h(Button, { variant: "text" }, "Refresh"),
            },
            h("p", null, "Any content fits here — a table, a form, a chart."),
          ),
      },
    ],
    props: [
      { name: "title", type: "string", description: "Header text of the toggle." },
      { name: "defaultOpen", type: "boolean", default: "false", description: "Open on first render (uncontrolled)." },
      { name: "open", type: "boolean", description: "Controlled open state." },
      { name: "onToggle", type: "(open: boolean) => void", description: "Called when the header is activated." },
      { name: "badge", type: "VNode", description: "Slot on the right of the header, before actions." },
      { name: "actions", type: "VNode", description: "Header controls that do not toggle the panel." },
    ],
  },
];
