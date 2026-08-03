import { h, useEffect, useRef, useState } from "/dist/fluxaway.js";

const linksIn = (menu) => [...(menu?.querySelectorAll('[role="menuitem"]') ?? [])];

export function ExamplesMenu({ items }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const focusLast = useRef(false);

  useEffect(() => {
    if (!open) return undefined;

    const links = linksIn(menuRef.current);
    queueMicrotask(() => (focusLast.current ? links.at(-1) : links[0])?.focus());

    const closeFromOutside = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        setOpen(false);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

      event.preventDefault();
      const menuLinks = linksIn(menuRef.current);
      const current = menuLinks.indexOf(document.activeElement);
      let next = current;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = menuLinks.length - 1;
      if (event.key === "ArrowDown") next = (current + 1) % menuLinks.length;
      if (event.key === "ArrowUp") next = (current - 1 + menuLinks.length) % menuLinks.length;
      menuLinks[next]?.focus();
    };

    document.addEventListener("mousedown", closeFromOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", closeFromOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const show = (last = false) => {
    focusLast.current = last;
    setOpen(true);
  };

  return h(
    "div",
    { ref: wrapRef, className: "nd-header-examples" },
    h(
      "button",
      {
        ref: triggerRef,
        type: "button",
        className: "nd-header-link nd-header-examples-trigger",
        ariaHaspopup: "menu",
        ariaExpanded: open ? "true" : "false",
        ariaControls: "docs-examples-menu",
        onClick: () => (open ? setOpen(false) : show()),
        onKeyDown: (event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            show(event.key === "ArrowUp");
          }
        },
      },
      "Examples",
      h("i", {
        className: `bi bi-chevron-${open ? "up" : "down"}`,
        ariaHidden: "true",
      }),
    ),
    open
      ? h(
          "ul",
          { ref: menuRef, id: "docs-examples-menu", className: "nd-header-examples-menu", role: "menu" },
          items.map((item) =>
            h(
              "li",
              { key: item.href, role: "none" },
              h(
                "a",
                {
                  className: "nd-header-example-link",
                  href: item.href,
                  role: "menuitem",
                  onClick: () => setOpen(false),
                },
                item.label,
                h("i", { className: "bi bi-arrow-up-right", ariaHidden: "true" }),
              ),
            ),
          ),
        )
      : null,
  );
}
