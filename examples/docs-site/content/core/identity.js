import { h, Fragment } from "/dist/fluxaway.js";
import { Avatar, AvatarGroup, FormField } from "/dist/fluxaway-components-core.js";

export const IDENTITY_ENTRIES = [
  {
    slug: "avatar",
    name: "Avatar",
    category: "core",
    module: "fluxaway-components-core.js",
    summary:
      "A user picture with an initials fallback derived from name whenever there is no src.",
    demos: [
      {
        id: "avatar-sizes",
        title: "Sizes",
        render: () =>
          h(
            Fragment,
            null,
            h(Avatar, { name: "Ada Lovelace", size: "xs" }),
            h(Avatar, { name: "Ada Lovelace", size: "sm" }),
            h(Avatar, { name: "Ada Lovelace", size: "md" }),
            h(Avatar, { name: "Grace Hopper", size: "lg" }),
            h(Avatar, { name: "Alan Turing", size: "xl" }),
          ),
      },
      {
        id: "avatar-image",
        title: "With an image",
        note: "alt defaults to empty — decorative avatars stay silent for screen readers.",
        render: () =>
          h(Avatar, {
            src: "/assets/brand/fluxaway-app-icon.svg",
            alt: "FluxaWay",
            name: "FluxaWay",
            size: "lg",
          }),
      },
    ],
    props: [
      { name: "src", type: "string", description: "Image URL. Without it, initials from name are used." },
      { name: "alt", type: "string", default: '""', description: "Alt text for the image." },
      { name: "name", type: "string", description: "Full name — the initials source." },
      {
        name: "size",
        type: '"xs" | "sm" | "md" | "lg" | "xl"',
        default: '"md"',
        description: "Diameter, from 24px to 72px.",
      },
    ],
  },

  {
    slug: "avatar-group",
    name: "AvatarGroup",
    category: "core",
    module: "fluxaway-components-core.js",
    summary: "An overlapping stack of avatars; everything past max collapses into a +N bubble.",
    demos: [
      {
        id: "avatar-group-basic",
        title: "Overflow",
        render: () =>
          h(AvatarGroup, {
            max: 3,
            avatars: [
              { name: "Ada Lovelace" },
              { name: "Grace Hopper" },
              { name: "Alan Turing" },
              { name: "Edsger Dijkstra" },
              { name: "Barbara Liskov" },
            ],
          }),
      },
    ],
    props: [
      {
        name: "avatars",
        type: "Array<{ name?, src?, alt? }>",
        default: "[]",
        description: "Avatar descriptors, in display order.",
      },
      { name: "max", type: "number", default: "4", description: "How many render before the +N bubble." },
      {
        name: "size",
        type: '"xs" | "sm" | "md" | "lg" | "xl"',
        default: '"md"',
        description: "Applied to every avatar in the group.",
      },
    ],
  },

  {
    slug: "form-field",
    name: "FormField",
    category: "core",
    module: "fluxaway-components-core.js",
    summary:
      "The label + control + help/error wrapper every form component is built on. Reach for it " +
      "directly when you need a native input the library does not wrap.",
    demos: [
      {
        id: "form-field-basic",
        title: "Wrapping a native input",
        stack: true,
        render: () =>
          h(
            Fragment,
            null,
            h(
              FormField,
              { label: "Workspace", help: "Lowercase letters and dashes." },
              h("input", { className: "m-field", type: "text", placeholder: "acme-team" }),
            ),
            h(
              FormField,
              { label: "Seats", error: "Must be at least 1", required: true },
              h("input", { className: "m-field", type: "number", value: "0" }),
            ),
          ),
      },
    ],
    props: [
      {
        name: "id",
        type: "string",
        description: "Ties the label to the control. Generated with useId when omitted.",
      },
      { name: "label", type: "string", description: "Field label." },
      { name: "help", type: "string", description: "Hint under the control; hidden while error is set." },
      { name: "error", type: "string", description: "Error message; also flips the control styling." },
      { name: "required", type: "boolean", default: "false", description: "Renders the required marker." },
    ],
    notes: [
      "Since 0.16.0 the id is auto-generated with useId, so the label stays programmatically associated even when you pass no id.",
    ],
  },
];
