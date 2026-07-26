import { h, useState, usePresence, useVirtualList, useTranslation, useContextMenu } from "/dist/fluxaway.js";
import { Badge, Button } from "/dist/fluxaway-components-core.js";
import { ContextMenu } from "/dist/fluxaway-components-overlay.js";

const ROWS = Array.from({ length: 5000 }, (_, i) => ({ id: i, label: `Row ${i + 1}` }));

export const LIST_HOOK_ENTRIES = [
  {
    slug: "use-presence",
    name: "usePresence",
    category: "hooks-ui",
    module: "fluxaway.js",
    signature: "const { mounted, exiting } = usePresence(open, { duration })",
    summary:
      "Keeps an element mounted while its exit animation plays. FluxaWay removes a DOM node the instant " +
      "its vnode disappears, so without this a CSS exit transition never gets to run.",
    demos: [
      {
        id: "use-presence-boolean",
        title: "Boolean form",
        stack: true,
        note: "Pair the exiting class with a CSS transition of the same duration.",
        render: () => {
          const [open, setOpen] = useState(true);
          const { mounted, exiting } = usePresence(open, { duration: 300 });

          return h(
            "div",
            { className: "nd-stack" },
            h(Button, { variant: "contained", onClick: () => setOpen(!open) }, open ? "Hide" : "Show"),
            mounted
              ? h(
                  "div",
                  { className: `nd-presence${exiting ? " nd-presence-exit" : ""}` },
                  "I fade out before I am removed",
                )
              : null,
          );
        },
      },
      {
        id: "use-presence-list",
        title: "List form",
        stack: true,
        note: "Exiting items keep their position, and re-adding one mid-exit cancels the exit.",
        render: () => {
          const [items, setItems] = useState([
            { id: 1, label: "Ship the release notes" },
            { id: 2, label: "Review the changelog" },
            { id: 3, label: "Tag 0.19.2" },
          ]);
          const rows = usePresence(items, { duration: 300, getKey: (item) => item.id });

          return h(
            "div",
            { className: "nd-stack" },
            rows.map(({ key, item, exiting }) =>
              h(
                "div",
                { key, className: `nd-presence${exiting ? " nd-presence-exit" : ""}` },
                item.label,
                h(
                  Button,
                  {
                    variant: "text",
                    onClick: () => setItems((list) => list.filter((row) => row.id !== item.id)),
                  },
                  "Remove",
                ),
              ),
            ),
            items.length === 0
              ? h(
                  Button,
                  {
                    variant: "tonal",
                    onClick: () => setItems([{ id: 1, label: "Ship the release notes" }]),
                  },
                  "Put one back",
                )
              : null,
          );
        },
      },
    ],
    params: [
      {
        name: "source",
        type: "boolean | T[]",
        description: "A flag (single element) or a list (collection). The return shape follows.",
      },
      { name: "duration", type: "number", default: "300", description: "How long removal is delayed, in ms." },
      {
        name: "getKey",
        type: "(item) => key",
        default: "item.key ?? item.id ?? item",
        description: "List form only: identity of each item.",
      },
    ],
    returns: [
      {
        name: "{ mounted, exiting }",
        type: "object",
        description: "Boolean form: whether to render, and whether it is on its way out.",
      },
      {
        name: "[{ key, item, exiting }]",
        type: "array",
        description: "List form: one entry per visible item, including those still exiting.",
      },
    ],
  },

  {
    slug: "use-virtual-list",
    name: "useVirtualList",
    category: "hooks-ui",
    module: "fluxaway.js",
    signature: "const { containerRef, virtualItems, totalHeight } = useVirtualList(items, { itemHeight })",
    summary:
      "Renders only the rows in view, so a 5,000-row list costs the DOM about a dozen nodes. Every " +
      "row must have the same fixed height.",
    demos: [
      {
        id: "use-virtual-list-basic",
        title: "5,000 rows, a handful of nodes",
        stack: true,
        render: () => {
          const { containerRef, virtualItems, totalHeight } = useVirtualList(ROWS, { itemHeight: 36 });

          return h(
            "div",
            { className: "nd-stack" },
            h(Badge, null, `${ROWS.length} rows · ${virtualItems.length} in the DOM`),
            h(
              "div",
              { ref: containerRef, className: "nd-virtual" },
              h(
                "div",
                { style: { height: `${totalHeight}px`, position: "relative" } },
                virtualItems.map(({ index, item, offsetTop }) =>
                  h(
                    "div",
                    {
                      key: index,
                      className: "nd-virtual-row",
                      style: { position: "absolute", top: `${offsetTop}px`, height: "36px" },
                    },
                    item.label,
                  ),
                ),
              ),
            ),
          );
        },
      },
    ],
    params: [
      { name: "items", type: "T[]", description: "The full list." },
      { name: "itemHeight", type: "number", description: "Fixed row height in px — required." },
      { name: "overscan", type: "number", default: "3", description: "Extra rows rendered above and below the window." },
    ],
    returns: [
      { name: "containerRef", type: "Ref", description: "Attach to the scrollable wrapper." },
      {
        name: "virtualItems",
        type: "Array<{ item, index, offsetTop }>",
        description: "The visible slice. Position each row yourself with top: offsetTop.",
      },
      { name: "totalHeight", type: "number", description: "Height of the spacer that keeps the scrollbar honest." },
      { name: "startIndex / endIndex", type: "number", description: "Bounds of the current window." },
    ],
  },
];
