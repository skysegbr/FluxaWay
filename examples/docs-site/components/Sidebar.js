import { h } from "/dist/nexa.js";

// Hash links, so a plain <a href="#/components/button"> navigates for free —
// no onClick, and middle-click / open-in-new-tab keep working.
export function Sidebar({ groups, path, open, onNavigate }) {
  return h(
    "nav",
    {
      className: `nd-sidebar${open ? " nd-sidebar-open" : ""}`,
      ariaLabel: "Documentation",
    },
    groups.map((group) =>
      h(
        "div",
        { key: group.title, className: "nd-sidebar-group" },
        h(
          "h2",
          { className: "nd-sidebar-heading" },
          group.icon ? h("i", { className: `bi ${group.icon}`, ariaHidden: "true" }) : null,
          group.title,
        ),
        h(
          "ul",
          { className: "nd-sidebar-list" },
          group.items.map((item) =>
            h(
              "li",
              { key: item.path },
              h(
                "a",
                {
                  className: `nd-sidebar-link${item.path === path ? " nd-sidebar-link-active" : ""}`,
                  href: `#${item.path}`,
                  ariaCurrent: item.path === path ? "page" : null,
                  onClick: () => onNavigate?.(),
                },
                item.label,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
