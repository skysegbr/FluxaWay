import { h, useState } from "/dist/fluxaway.js";
import { Badge } from "/dist/fluxaway-components-core.js";
import { FAB, SpeedDial, SwipeableListItem } from "/dist/fluxaway-components-nav.js";

// The floating / gesture-driven half of the nav category.
export const ACTION_ENTRIES = [
  {
    slug: "fab",
    name: "FAB",
    category: "nav",
    module: "fluxaway-components-nav.js",
    summary: "The floating action button for a screen's single primary action.",
    demos: [
      {
        id: "fab-basic",
        title: "Round and extended",
        render: () =>
          h(
            "div",
            { className: "nd-inline" },
            h(FAB, { label: "Add" }, h("i", { className: "bi bi-plus-lg" })),
            h(FAB, { label: "New task", extended: true }, "New task"),
          ),
      },
    ],
    props: [
      { name: "label", type: "string", description: "Accessible name — required when not extended." },
      {
        name: "extended",
        type: "boolean",
        default: "false",
        description: "Renders a pill with visible text instead of a circle.",
      },
      {
        name: "aboveNav",
        type: "boolean",
        default: "false",
        description: "Lifts the button clear of a BottomNav.",
      },
    ],
  },

  {
    slug: "speed-dial",
    name: "SpeedDial",
    category: "nav",
    module: "fluxaway-components-nav.js",
    summary:
      "A trigger that fans out a row of actions. It owns its open state and closes on outside " +
      "click or after an item is picked.",
    demos: [
      {
        id: "speed-dial-basic",
        title: "Inline and orbit",
        render: () =>
          h(
            "div",
            { className: "nd-inline" },
            h(SpeedDial, {
              label: "Quick actions",
              icon: h("i", { className: "bi bi-plus-lg" }),
              items: [
                { label: "Message", icon: h("i", { className: "bi bi-chat-dots" }) },
                { label: "Share", icon: h("i", { className: "bi bi-share" }) },
              ],
            }),
            h(SpeedDial, {
              label: "Orbit actions",
              orbit: true,
              icon: h("i", { className: "bi bi-three-dots" }),
              items: [
                { label: "Star", icon: h("i", { className: "bi bi-star" }) },
                { label: "Archive", icon: h("i", { className: "bi bi-archive" }) },
              ],
            }),
          ),
      },
    ],
    props: [
      { name: "items", type: "Array<{ label, icon?, onClick? }>", default: "[]", description: "The fanned-out actions." },
      { name: "icon", type: "VNode", description: "Icon of the trigger." },
      {
        name: "label",
        type: "string",
        default: '"More actions"',
        description: "Accessible name of the trigger.",
      },
      {
        name: "orbit",
        type: "boolean",
        default: "false",
        description: "Stacks the items upward instead of inline.",
      },
    ],
  },

  {
    slug: "swipeable-list-item",
    name: "SwipeableListItem",
    category: "nav",
    module: "fluxaway-components-nav.js",
    summary:
      "A row that reveals actions when dragged left — the iOS mail gesture. Drag it with a mouse " +
      "or a finger; releasing past 40% of the action width snaps it open.",
    demos: [
      {
        id: "swipeable-list-item-basic",
        title: "Swipe the row left",
        stack: true,
        render: () => {
          const [log, setLog] = useState(null);

          return h(
            "div",
            { className: "nd-stack" },
            h(
              SwipeableListItem,
              {
                actionWidth: 80,
                actions: [
                  {
                    label: "Done",
                    icon: h("i", { className: "bi bi-check2" }),
                    className: "m-swipeable-action-success",
                    onClick: () => setLog("Done"),
                  },
                  { label: "Delete", icon: h("i", { className: "bi bi-trash" }), onClick: () => setLog("Delete") },
                ],
              },
              h("div", { style: { padding: "0.75rem 1rem" } }, "Ship the 0.19.2 release notes"),
            ),
            log ? h(Badge, null, `Ran: ${log}`) : null,
          );
        },
      },
    ],
    props: [
      { name: "children", type: "VNode", description: "The row content." },
      {
        name: "actions",
        type: "Array<{ label, icon?, onClick?, className?, style? }>",
        default: "[]",
        description:
          "Buttons revealed behind the row. className takes m-swipeable-action-success | -warning | -info; the default is the danger red.",
      },
      { name: "actionWidth", type: "number", default: "72", description: "Width of each action button, in px." },
    ],
  },
];
