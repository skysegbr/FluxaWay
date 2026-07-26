import { h, useEffect, useRef, useState } from "/dist/nexa.js";

// Hash links, so a plain <a href="#/components/button"> navigates for free —
// no onClick, and middle-click / open-in-new-tab keep working.
export function Sidebar({ groups, path, onNavigate, id, mobile = false }) {
  const boxRef = useRef(null);
  const activeRef = useRef(null);
  const activeGroup = groups.find((group) => group.items.some((item) => item.path === path))?.title;
  const [expanded, setExpanded] = useState(() => new Set(["Introduction", activeGroup]));

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
      id,
      className: `nd-sidebar${mobile ? " nd-sidebar-mobile" : ""}`,
      ariaLabel: "Documentation",
    },
    groups.map((group) =>
      h(
        "details",
        {
          key: group.title,
          className: "nd-sidebar-group",
          open: expanded.has(group.title) || group.title === activeGroup,
          onToggle: (event) => {
            const isOpen = event.currentTarget.open;
            setExpanded((current) => {
              const next = new Set(current);
              if (isOpen) next.add(group.title);
              else next.delete(group.title);
              return next;
            });
          },
        },
        h(
          "summary",
          { className: "nd-sidebar-heading" },
          group.icon ? h("i", { className: `bi ${group.icon}`, ariaHidden: "true" }) : null,
          h("span", null, group.title),
          h("i", { className: "bi bi-chevron-down nd-sidebar-caret", ariaHidden: "true" }),
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
