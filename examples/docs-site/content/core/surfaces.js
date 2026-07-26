import { h, Fragment } from "/dist/nexa.js";
import { Card, Divider, Skeleton, EmptyState, Button } from "/dist/nexa-components-core.js";

export const SURFACE_ENTRIES = [
  {
    slug: "card",
    name: "Card",
    category: "core",
    module: "nexa-components-core.js",
    summary:
      "The base surface. Renders an <article> with the m-card class, plus a family of CSS-only " +
      "modifiers for media, glow, pricing and expanding cards.",
    demos: [
      {
        id: "card-basic",
        title: "Basic card",
        render: () =>
          h(
            Card,
            { padded: true },
            h("h3", { style: { marginTop: 0 } }, "Monthly report"),
            h("p", null, "Every metric for June, ready to export."),
            h(Button, { variant: "contained" }, "Download"),
          ),
      },
      {
        id: "card-hover",
        title: "Clickable card",
        note: "m-card-hover adds the pointer cursor plus a hover border and shadow.",
        render: () =>
          h(
            Card,
            { padded: true, className: "m-card-hover", style: { maxWidth: "18rem" } },
            h("h3", { style: { marginTop: 0 } }, "Pipeline"),
            h("p", { style: { marginBottom: 0 } }, "12 runs today, 1 failing."),
          ),
      },
    ],
    props: [
      { name: "padded", type: "boolean", default: "true", description: "Adds the standard inner padding." },
      {
        name: "className",
        type: "string",
        description:
          "Modifier classes: m-card-hover, m-card-media, m-card-glow, m-card-pricing, m-card-float.",
      },
      { name: "children", type: "VNode", description: "Card content." },
    ],
    notes: [
      "The m-card-* variants are pure CSS. When a variant needs a structure Card() does not pass through, write a plain <article className=\"m-card m-card-media\"> instead.",
    ],
  },

  {
    slug: "divider",
    name: "Divider",
    category: "core",
    module: "nexa-components-core.js",
    summary: "A horizontal rule, or an inline vertical separator with role=\"separator\".",
    demos: [
      {
        id: "divider-basic",
        title: "Horizontal and vertical",
        stack: true,
        render: () =>
          h(
            Fragment,
            null,
            h("p", { style: { margin: 0 } }, "Above"),
            h(Divider, null),
            h("p", { style: { margin: 0 } }, "Below"),
            h(
              "p",
              { style: { margin: 0 } },
              "Inline",
              h(Divider, { vertical: true }),
              "separated",
            ),
          ),
      },
    ],
    props: [
      {
        name: "vertical",
        type: "boolean",
        default: "false",
        description: "Renders an inline separator instead of an <hr>.",
      },
    ],
  },

  {
    slug: "skeleton",
    name: "Skeleton",
    category: "core",
    module: "nexa-components-core.js",
    summary: "A shimmering placeholder for content that has not arrived yet.",
    demos: [
      {
        id: "skeleton-basic",
        title: "Shapes",
        stack: true,
        render: () =>
          h(
            Fragment,
            null,
            h(Skeleton, { variant: "circle", width: 48, height: 48 }),
            h(Skeleton, { height: 24, width: "70%" }),
            h(Skeleton, { variant: "text", lines: 3 }),
          ),
      },
    ],
    props: [
      {
        name: "variant",
        type: '"rect" | "text" | "circle"',
        default: '"rect"',
        description: "Shape of the placeholder.",
      },
      { name: "width", type: "number | string", description: "Numbers are treated as px." },
      { name: "height", type: "number | string", description: "Numbers are treated as px." },
      {
        name: "lines",
        type: "number",
        default: "1",
        description: 'With variant "text", stacks N lines and shortens the last one.',
      },
    ],
  },

  {
    slug: "empty-state",
    name: "EmptyState",
    category: "core",
    module: "nexa-components-core.js",
    summary: "The placeholder for an empty list, an unmatched filter or a first-run screen.",
    demos: [
      {
        id: "empty-state-basic",
        title: "With an action",
        stack: true,
        render: () =>
          h(EmptyState, {
            title: "No projects yet",
            description: "Create your first project to see it here.",
            action: h(Button, { variant: "contained" }, "New project"),
          }),
      },
    ],
    props: [
      { name: "title", type: "string", default: '"No results"', description: "Heading." },
      { name: "description", type: "string", description: "Supporting line under the heading." },
      { name: "action", type: "VNode", description: "Call-to-action rendered at the bottom." },
      { name: "children", type: "VNode", description: "Extra body content above the action." },
    ],
  },
];
