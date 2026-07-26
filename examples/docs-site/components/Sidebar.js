import { h, useEffect, useRef } from "/dist/nexa.js";

// Hash links, so a plain <a href="#/components/button"> navigates for free —
// no onClick, and middle-click / open-in-new-tab keep working.
export function Sidebar({ groups, path, open, onNavigate }) {
  const boxRef = useRef(null);
  const activeRef = useRef(null);

  // With six categories the list is taller than the viewport, so arriving from
  // the palette (or a deep link) would leave the current page scrolled out of
  // sight. scrollTop is set directly rather than via scrollIntoView, which
  // would also scroll the window.
  useEffect(() => {
    const box = boxRef.current;
    const link = activeRef.current;
    if (!box || !link) return;

    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;

    if (top < box.scrollTop || bottom > box.scrollTop + box.clientHeight) {
      box.scrollTop = Math.max(0, top - box.clientHeight / 2);
    }
  }, [path]);

  return h(
    "nav",
    {
      ref: boxRef,
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
                  ref: item.path === path ? activeRef : null,
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
