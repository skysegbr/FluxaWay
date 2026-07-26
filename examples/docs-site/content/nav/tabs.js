import { h, useState } from "/dist/nexa.js";
import { Tabs, TabPanel, Breadcrumb, Stepper } from "/dist/nexa-components-nav.js";

export const TAB_ENTRIES = [
  {
    slug: "tabs",
    name: "Tabs",
    category: "nav",
    module: "nexa-components-nav.js",
    summary:
      "A WAI-ARIA tablist. Controlled: you hold the active value and pair it with TabPanel to " +
      "render the matching content.",
    imports: "Tabs, TabPanel",
    demos: [
      {
        id: "tabs-basic",
        title: "Tabs and panels",
        stack: true,
        note: "Arrow keys move between tabs, Home/End jump to the ends — disabled tabs are skipped.",
        render: () => {
          const [tab, setTab] = useState("overview");

          return h(
            "div",
            { className: "nd-stack" },
            h(Tabs, {
              value: tab,
              onChange: setTab,
              items: [
                { value: "overview", label: "Overview" },
                { value: "delivery", label: "Delivery" },
                { value: "finance", label: "Finance" },
                { value: "audit", label: "Audit", disabled: true },
              ],
            }),
            h(TabPanel, { id: "overview", activeId: tab }, h("p", null, "Twelve runs today, one failing.")),
            h(TabPanel, { id: "delivery", activeId: tab }, h("p", null, "Next release ships on Friday.")),
            h(TabPanel, { id: "finance", activeId: tab }, h("p", null, "R$ 47k committed of R$ 60k.")),
          );
        },
      },
    ],
    props: [
      {
        name: "items",
        type: "Array<{ value, label, icon?, disabled? }>",
        default: "[]",
        description: "The tabs, in display order.",
      },
      { name: "value", type: "string", description: "value of the active tab." },
      { name: "onChange", type: "(value: string) => void", description: "Called with the newly selected value." },
    ],
    notes: [
      "TabPanel takes { id, activeId } and renders nothing unless they match, so panels cost nothing while hidden. It wires aria-labelledby back to the tab automatically.",
    ],
  },

  {
    slug: "tab-panel",
    name: "TabPanel",
    category: "nav",
    module: "nexa-components-nav.js",
    summary:
      "The content half of Tabs. It renders its children only while id === activeId, and returns " +
      "null otherwise — no hidden DOM left behind.",
    demos: [
      {
        id: "tab-panel-basic",
        title: "One panel at a time",
        stack: true,
        render: () => {
          const [tab, setTab] = useState("json");

          return h(
            "div",
            { className: "nd-stack" },
            h(Tabs, {
              value: tab,
              onChange: setTab,
              items: [
                { value: "json", label: "JSON" },
                { value: "table", label: "Table" },
              ],
            }),
            h(TabPanel, { id: "json", activeId: tab }, h("pre", null, '{ "ok": true }')),
            h(TabPanel, { id: "table", activeId: tab }, h("p", null, "A table would go here.")),
          );
        },
      },
    ],
    props: [
      { name: "id", type: "string", description: "Identity of this panel — matched against activeId." },
      { name: "activeId", type: "string", description: "The currently selected tab value." },
      { name: "children", type: "VNode", description: "Panel content." },
    ],
  },

  {
    slug: "breadcrumb",
    name: "Breadcrumb",
    category: "nav",
    module: "nexa-components-nav.js",
    summary:
      "The trail to the current page. The last crumb renders as plain text with aria-current, " +
      "never as a link.",
    demos: [
      {
        id: "breadcrumb-basic",
        title: "Trail",
        stack: true,
        render: () =>
          h(Breadcrumb, {
            items: [
              { label: "Home", href: "#/" },
              { label: "Components", href: "#/components/button" },
              { label: "Breadcrumb" },
            ],
          }),
      },
      {
        id: "breadcrumb-separator",
        title: "Custom separator",
        stack: true,
        render: () =>
          h(Breadcrumb, {
            separator: "›",
            items: [{ label: "Docs", href: "#/" }, { label: "Nav" }, { label: "Breadcrumb" }],
          }),
      },
    ],
    props: [
      {
        name: "items",
        type: "Array<{ label, href?, onClick?, icon?, key? }>",
        default: "[]",
        description: "The trail. A crumb without href or onClick renders as text.",
      },
      { name: "separator", type: "string", default: '"/"', description: "Character drawn between crumbs." },
      { name: "ariaLabel", type: "string", default: '"Breadcrumb"', description: "Accessible name of the nav." },
    ],
    notes: [
      "Crumbs are keyed by item.key ?? index rather than by href — several crumbs can legitimately share a placeholder href, and duplicate keys corrupt reconciliation.",
    ],
  },

  {
    slug: "stepper",
    name: "Stepper",
    category: "nav",
    module: "nexa-components-nav.js",
    summary: "Progress through a multi-step flow. Steps before the active one are marked done.",
    demos: [
      {
        id: "stepper-basic",
        title: "Horizontal",
        stack: true,
        render: () => {
          const [step, setStep] = useState(1);
          const steps = [
            { label: "Account", description: "Who you are" },
            { label: "Workspace", description: "Where you work" },
            { label: "Invite", description: "Who joins you" },
          ];

          return h(
            "div",
            { className: "nd-stack" },
            h(Stepper, { steps, activeStep: step }),
            h(
              "div",
              { className: "nd-inline" },
              h("button", { className: "m-button", onClick: () => setStep(Math.max(0, step - 1)) }, "Back"),
              h(
                "button",
                { className: "m-button m-button-contained", onClick: () => setStep(Math.min(2, step + 1)) },
                "Next",
              ),
            ),
          );
        },
      },
      {
        id: "stepper-vertical",
        title: "Vertical",
        stack: true,
        render: () =>
          h(Stepper, {
            orientation: "vertical",
            activeStep: 2,
            steps: [
              { label: "Queued" },
              { label: "Building" },
              { label: "Deploying", description: "Rolling out to 3 regions" },
              { label: "Live" },
            ],
          }),
      },
    ],
    props: [
      {
        name: "steps",
        type: "Array<{ label, description? }>",
        default: "[]",
        description: "The steps, in order.",
      },
      { name: "activeStep", type: "number", default: "0", description: "Zero-based index of the current step." },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Layout direction.",
      },
    ],
  },
];
