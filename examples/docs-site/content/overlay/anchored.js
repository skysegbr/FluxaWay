import { h, useState } from "/dist/fluxaway.js";
import { Button, Badge } from "/dist/fluxaway-components-core.js";
import { Tooltip, Popover, CommandPalette } from "/dist/fluxaway-components-overlay.js";

// Overlays anchored to a trigger (or to the viewport, for the palette) rather
// than the pointer — see menus.js for the pointer/list family.
export const ANCHORED_ENTRIES = [
  {
    slug: "tooltip",
    name: "Tooltip",
    category: "overlay",
    module: "fluxaway-components-overlay.js",
    summary: "A short text hint on hover and on keyboard focus. Text only — never interactive content.",
    demos: [
      {
        id: "tooltip-positions",
        title: "Positions",
        render: () =>
          h(
            "div",
            { className: "nd-inline" },
            h(Tooltip, { content: "Above", position: "top" }, h(Button, { variant: "tonal" }, "Top")),
            h(Tooltip, { content: "Below", position: "bottom" }, h(Button, { variant: "tonal" }, "Bottom")),
            h(Tooltip, { content: "To the right", position: "right" }, h(Button, { variant: "tonal" }, "Right")),
          ),
      },
    ],
    props: [
      { name: "content", type: "string", description: "The hint text." },
      {
        name: "position",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"top"',
        description: "Side the bubble appears on.",
      },
      { name: "children", type: "VNode", description: "The trigger the tooltip describes." },
    ],
    notes: [
      "With a single element child, the tooltip's id is cloned onto it as aria-describedby automatically. Escape dismisses it.",
    ],
  },

  {
    slug: "popover",
    name: "Popover",
    category: "overlay",
    module: "fluxaway-components-overlay.js",
    summary:
      "An anchored panel for arbitrary interactive content — the middle ground between Tooltip " +
      "(text) and Dropdown (action list). It is not modal, so Tab is not trapped.",
    demos: [
      {
        id: "popover-basic",
        title: "Filter panel",
        render: () =>
          h(
            Popover,
            {
              id: "filters",
              trigger: h(Button, { variant: "outline" }, "Filters"),
              placement: "bottom",
              title: "Filter results",
            },
            h("p", { style: { marginTop: 0 } }, "Any interactive content fits here."),
            h(Button, { variant: "contained" }, "Apply"),
          ),
      },
    ],
    props: [
      { name: "trigger", type: "VNode", description: "The element that opens the panel." },
      {
        name: "placement",
        type: '"top" | "bottom" | "left" | "right"',
        default: '"bottom"',
        description: "Side the panel opens on.",
      },
      { name: "title", type: "string", description: "Optional panel heading." },
      { name: "children", type: "VNode", description: "Panel content." },
    ],
  },

  {
    slug: "command-palette",
    name: "CommandPalette",
    category: "overlay",
    module: "fluxaway-components-overlay.js",
    summary:
      "The Ctrl/Cmd+K launcher. Controlled like Dialog — it only handles what happens while it " +
      "is open, so the global shortcut is yours to bind. This very site uses it for search.",
    demos: [
      {
        id: "command-palette-basic",
        title: "Filtering commands",
        note: "Filtering is a substring match over label, hint, section and keywords.",
        render: () => {
          const [open, setOpen] = useState(false);
          const [last, setLast] = useState(null);

          return h(
            "div",
            { className: "nd-inline" },
            h(Button, { variant: "contained", onClick: () => setOpen(true) }, "Open palette"),
            last ? h(Badge, null, `Ran: ${last}`) : null,
            h(CommandPalette, {
              open,
              onClose: () => setOpen(false),
              commands: [
                { id: "new", label: "New file", section: "Files", hint: "Ctrl+N", onSelect: () => setLast("New file") },
                { id: "open", label: "Open project", section: "Files", onSelect: () => setLast("Open project") },
                {
                  id: "theme",
                  label: "Toggle theme",
                  section: "View",
                  keywords: ["dark", "light"],
                  onSelect: () => setLast("Toggle theme"),
                },
              ],
            }),
          );
        },
      },
    ],
    props: [
      { name: "open", type: "boolean", default: "false", description: "Whether the palette is shown." },
      { name: "onClose", type: "() => void", description: "Called on Escape, backdrop click and after a command runs." },
      {
        name: "commands",
        type: "Array<{ id, label, section?, hint?, keywords?, onSelect }>",
        default: "[]",
        description: "Everything the search filters over.",
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Type a command…"',
        description: "Placeholder of the input.",
      },
      {
        name: "emptyLabel",
        type: "string",
        default: '"No matching commands"',
        description: "Shown when nothing matches.",
      },
    ],
    notes: [
      "The input keeps focus and drives the list through aria-activedescendant: ArrowUp/Down move the active option, Enter runs it, Escape closes.",
    ],
  },
];
