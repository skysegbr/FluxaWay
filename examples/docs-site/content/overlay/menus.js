import { h, useContextMenu } from "/dist/nexa.js";
import { Button } from "/dist/nexa-components-core.js";
import { Dropdown, Menu, ContextMenu } from "/dist/nexa-components-overlay.js";

export const MENU_ITEMS = [
  { label: "Rename", icon: h("i", { className: "bi bi-pencil" }) },
  { label: "Duplicate", icon: h("i", { className: "bi bi-copy" }) },
  { divider: true },
  { label: "Delete", icon: h("i", { className: "bi bi-trash" }), danger: true },
];

export const MENU_ENTRIES = [
  {
    slug: "dropdown",
    name: "Dropdown",
    category: "overlay",
    module: "nexa-components-overlay.js",
    summary:
      "A trigger plus a list of actions. It owns its own open state and closes on outside click, " +
      "on Escape and after an item runs.",
    demos: [
      {
        id: "dropdown-basic",
        title: "Action list",
        note: "An item with divider: true renders a separator instead of a button.",
        render: () =>
          h(Dropdown, {
            id: "row-actions",
            trigger: h(Button, { variant: "outline" }, "Actions ▾"),
            items: MENU_ITEMS,
          }),
      },
    ],
    props: [
      { name: "trigger", type: "VNode", description: "The element that opens the menu." },
      {
        name: "items",
        type: "Array<{ label, icon?, onClick?, danger?, disabled?, divider? }>",
        default: "[]",
        description: "The actions to render.",
      },
      { name: "align", type: '"left" | "right"', default: '"left"', description: "Which edge the panel aligns to." },
      { name: "id", type: "string", description: "Base id, used to wire aria-controls." },
    ],
    notes: [
      "Opening focuses the first item; arrow keys walk the list, Escape closes and returns focus to the trigger.",
    ],
  },

  {
    slug: "menu",
    name: "Menu",
    category: "overlay",
    module: "nexa-components-overlay.js",
    summary:
      "Dropdown's bigger sibling: the same shape, plus flyout submenus — an item nests a " +
      "children array, any number of levels deep.",
    demos: [
      {
        id: "menu-nested",
        title: "Nested submenu",
        render: () =>
          h(Menu, {
            trigger: h(Button, { variant: "tonal" }, "File ▾"),
            items: [
              { label: "New file" },
              {
                label: "Export as",
                children: [{ label: "PNG" }, { label: "SVG" }, { label: "PDF" }],
              },
              { divider: true },
              { label: "Close", danger: true },
            ],
          }),
      },
    ],
    props: [
      { name: "trigger", type: "VNode", description: "The element that opens the menu." },
      {
        name: "items",
        type: "Array<{ label, icon?, onClick?, children?, danger?, disabled?, divider? }>",
        default: "[]",
        description: "An item with a children array becomes a flyout submenu.",
      },
      { name: "align", type: '"left" | "right"', default: '"left"', description: "Alignment of the root panel." },
    ],
    notes: [
      "Per level: ArrowUp/Down move between siblings, ArrowRight (or Enter) opens a submenu and focuses its first item, ArrowLeft closes it and climbs back. Escape and Tab close the whole menu.",
    ],
  },

  {
    slug: "context-menu",
    name: "ContextMenu",
    category: "overlay",
    module: "nexa-components-overlay.js",
    summary:
      "A right-click menu positioned at the pointer. Pair it with the useContextMenu hook, which " +
      "holds the open flag and the x/y coordinates.",
    demos: [
      {
        id: "context-menu-basic",
        title: "Right-click a row",
        stack: true,
        render: () => {
          const { menu, openMenu, closeMenu } = useContextMenu();

          return h(
            "div",
            {
              className: "nd-contextzone",
              onContextMenu: openMenu,
            },
            "Right-click anywhere in this box",
            h(ContextMenu, {
              open: menu.open,
              x: menu.x,
              y: menu.y,
              onClose: closeMenu,
              ariaLabel: "Row actions",
              items: MENU_ITEMS,
            }),
          );
        },
      },
    ],
    props: [
      { name: "open", type: "boolean", default: "false", description: "Whether the menu is shown." },
      { name: "x", type: "number", default: "0", description: "Viewport x of the pointer." },
      { name: "y", type: "number", default: "0", description: "Viewport y of the pointer." },
      { name: "items", type: "Array<MenuItem>", default: "[]", description: "Same item shape as Dropdown." },
      { name: "onClose", type: "() => void", description: "Called on Escape, outside click and after an item runs." },
      {
        name: "ariaLabel",
        type: "string",
        default: '"Context menu"',
        description: "Accessible name of the menu.",
      },
    ],
  },
];
