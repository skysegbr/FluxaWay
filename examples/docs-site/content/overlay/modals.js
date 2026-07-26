import { h, useState } from "/dist/nexa.js";
import { Button } from "/dist/nexa-components-core.js";
import { Dialog, Drawer, BottomSheet } from "/dist/nexa-components-overlay.js";

export const MODAL_ENTRIES = [
  {
    slug: "dialog",
    name: "Dialog",
    category: "overlay",
    module: "nexa-components-overlay.js",
    summary:
      "A modal window. It is fully controlled — you hold the open flag — and it traps focus, " +
      "closes on Escape and on a backdrop click.",
    demos: [
      {
        id: "dialog-basic",
        title: "Confirmation",
        note: "actions render in the footer; pass any vdom you like.",
        render: () => {
          const [open, setOpen] = useState(false);

          return h(
            "div",
            null,
            h(Button, { variant: "contained", onClick: () => setOpen(true) }, "Delete project"),
            h(
              Dialog,
              {
                open,
                title: "Delete this project?",
                onClose: () => setOpen(false),
                actions: [
                  h(Button, { key: "cancel", onClick: () => setOpen(false) }, "Cancel"),
                  h(
                    Button,
                    { key: "ok", variant: "danger", onClick: () => setOpen(false) },
                    "Delete",
                  ),
                ],
              },
              h("p", null, "Every run, artifact and log will be removed. This cannot be undone."),
            ),
          );
        },
      },
      {
        id: "dialog-sizes",
        title: "Sizes and dragging",
        note: "draggable lets the user move the dialog by its header — useful over a canvas.",
        render: () => {
          const [size, setSize] = useState(null);

          return h(
            "div",
            { className: "nd-inline" },
            h(Button, { variant: "tonal", onClick: () => setSize("sm") }, "Small"),
            h(Button, { variant: "tonal", onClick: () => setSize("lg") }, "Large"),
            h(
              Dialog,
              {
                open: size !== null,
                size,
                draggable: true,
                title: `A ${size ?? ""} draggable dialog`,
                onClose: () => setSize(null),
                actions: h(Button, { variant: "contained", onClick: () => setSize(null) }, "Done"),
              },
              h("p", null, "Drag the header to move this window."),
            ),
          );
        },
      },
    ],
    props: [
      { name: "open", type: "boolean", default: "false", description: "Whether the dialog is shown." },
      { name: "onClose", type: "() => void", description: "Called by Escape, the backdrop and the close button." },
      { name: "title", type: "string", description: "Header text; also the accessible name." },
      { name: "actions", type: "VNode | VNode[]", description: "Footer content, usually buttons." },
      { name: "size", type: '"sm" | "lg"', description: "Width preset. Omit for the default width." },
      {
        name: "draggable",
        type: "boolean",
        default: "false",
        description: "Lets the user drag the dialog by its header.",
      },
      {
        name: "closeLabel",
        type: "string",
        default: '"Close"',
        description: "Accessible name of the × button.",
      },
    ],
    notes: [
      "Focus moves into the dialog on open and returns to the trigger on close; Tab is trapped while it is open.",
    ],
  },

  {
    slug: "drawer",
    name: "Drawer",
    category: "overlay",
    module: "nexa-components-overlay.js",
    summary: "A panel that slides in from an edge — filters, details, a side form.",
    demos: [
      {
        id: "drawer-basic",
        title: "Either side",
        render: () => {
          const [side, setSide] = useState(null);

          return h(
            "div",
            { className: "nd-inline" },
            h(Button, { variant: "tonal", onClick: () => setSide("left") }, "Open left"),
            h(Button, { variant: "tonal", onClick: () => setSide("right") }, "Open right"),
            h(
              Drawer,
              {
                open: side !== null,
                side: side ?? "left",
                width: 320,
                title: "Filters",
                onClose: () => setSide(null),
              },
              h("p", null, "Anything can live in here — a form, a list, a detail view."),
              h(Button, { variant: "contained", onClick: () => setSide(null) }, "Apply"),
            ),
          );
        },
      },
    ],
    props: [
      { name: "open", type: "boolean", default: "false", description: "Whether the drawer is shown." },
      { name: "side", type: '"left" | "right"', default: '"left"', description: "Edge it slides from." },
      { name: "width", type: "number", default: "280", description: "Panel width in px." },
      { name: "title", type: "string", description: "Header text." },
      { name: "onClose", type: "() => void", description: "Called by Escape, the backdrop and the close button." },
    ],
  },

  {
    slug: "bottom-sheet",
    name: "BottomSheet",
    category: "overlay",
    module: "nexa-components-overlay.js",
    summary: "The mobile-native pattern: a sheet that rises from the bottom edge of the screen.",
    demos: [
      {
        id: "bottom-sheet-basic",
        title: "Action sheet",
        render: () => {
          const [open, setOpen] = useState(false);

          return h(
            "div",
            null,
            h(Button, { variant: "contained", onClick: () => setOpen(true) }, "Open sheet"),
            h(
              BottomSheet,
              { open, title: "Share this run", onClose: () => setOpen(false) },
              h("p", null, "Sheets suit short, focused choices on a phone."),
              h(Button, { variant: "tonal", onClick: () => setOpen(false) }, "Copy link"),
            ),
          );
        },
      },
    ],
    props: [
      { name: "open", type: "boolean", description: "Whether the sheet is shown." },
      { name: "title", type: "string", description: "Header text." },
      { name: "onClose", type: "() => void", description: "Called by Escape and the backdrop." },
      { name: "children", type: "VNode", description: "Sheet content." },
    ],
  },
];
