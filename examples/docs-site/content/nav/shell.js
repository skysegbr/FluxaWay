import { h, useState } from "/dist/fluxaway.js";
import { Badge, Button, IconButton } from "/dist/fluxaway-components-core.js";
import { Navbar, AppBar, BottomNav } from "/dist/fluxaway-components-nav.js";

export const SHELL_ENTRIES = [
  {
    slug: "navbar",
    name: "Navbar",
    category: "nav",
    module: "fluxaway-components-nav.js",
    summary:
      "The desktop top bar: a brand, a link list that collapses behind a burger on small screens, " +
      "and an actions slot on the right.",
    demos: [
      {
        id: "navbar-basic",
        title: "Brand, links and actions",
        stack: true,
        note: "Resize the window — below the breakpoint the links move into a burger menu.",
        render: () =>
          h(Navbar, {
            brand: h("strong", null, "⬡ Acme"),
            items: [
              { label: "Overview", href: "#/components/navbar", active: true },
              { label: "Reports", href: "#/components/navbar" },
              { label: "Settings", href: "#/components/navbar" },
            ],
            actions: [h(Button, { key: "new", variant: "contained" }, "New review")],
          }),
      },
    ],
    props: [
      { name: "brand", type: "VNode | string", description: "Left-hand brand slot." },
      {
        name: "items",
        type: "Array<{ label, href?, onClick?, active?, key? }>",
        default: "[]",
        description: "Navigation links.",
      },
      { name: "actions", type: "VNode | VNode[]", description: "Right-hand slot — buttons, switchers, avatars." },
      { name: "open", type: "boolean", description: "Controlled burger state. Omit for uncontrolled." },
      { name: "defaultOpen", type: "boolean", default: "false", description: "Burger open on first render." },
    ],
  },

  {
    slug: "app-bar",
    name: "AppBar",
    category: "nav",
    module: "fluxaway-components-nav.js",
    summary:
      "The mobile-style header: a leading slot (back arrow, menu), a title, and trailing actions. " +
      "Respects the top safe-area inset.",
    demos: [
      {
        id: "app-bar-basic",
        title: "Leading and actions",
        stack: true,
        render: () =>
          h(AppBar, {
            title: "Inbox",
            leading: h(IconButton, { label: "Back" }, h("i", { className: "bi bi-chevron-left" })),
            actions: [
              h(IconButton, { key: "search", label: "Search" }, h("i", { className: "bi bi-search" })),
              h(IconButton, { key: "more", label: "More" }, h("i", { className: "bi bi-three-dots-vertical" })),
            ],
          }),
      },
    ],
    props: [
      { name: "title", type: "string | VNode", description: "Header title." },
      { name: "leading", type: "VNode", description: "Slot before the title — usually a back or menu button." },
      { name: "actions", type: "VNode | VNode[]", description: "Trailing action slot." },
    ],
  },

  {
    slug: "bottom-nav",
    name: "BottomNav",
    category: "nav",
    module: "fluxaway-components-nav.js",
    summary:
      "The phone tab bar, pinned to the bottom edge with safe-area padding. Controlled through " +
      "value and onChange.",
    demos: [
      {
        id: "bottom-nav-basic",
        title: "Four destinations",
        stack: true,
        note: "In a real app this sits fixed at the bottom of the viewport; here it is inline.",
        render: () => {
          const [tab, setTab] = useState("home");

          return h(
            "div",
            { className: "nd-stack" },
            h(BottomNav, {
              value: tab,
              onChange: setTab,
              items: [
                { value: "home", label: "Home", icon: h("i", { className: "bi bi-house" }) },
                { value: "explore", label: "Explore", icon: h("i", { className: "bi bi-compass" }) },
                { value: "activity", label: "Activity", icon: h("i", { className: "bi bi-bell" }), badge: 3 },
                { value: "profile", label: "Profile", icon: h("i", { className: "bi bi-person" }) },
              ],
            }),
            h(Badge, null, `Active: ${tab}`),
          );
        },
      },
    ],
    props: [
      {
        name: "items",
        type: "Array<{ value, label, icon?, badge? }>",
        default: "[]",
        description: "The destinations. badge renders a small counter over the icon.",
      },
      { name: "value", type: "string", description: "Active destination." },
      { name: "onChange", type: "(value: string) => void", description: "Called with the chosen value." },
    ],
  },
];
