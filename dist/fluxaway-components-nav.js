/*!
 * FluxaWay — UI component library, `nav` category: navigation (Tabs, Navbar, AppBar, Stepper, FAB, ...).
 * Part of the no-build FluxaWay framework — NOT React; see the AI/LLM notice
 * in ./fluxaway-components-core.js and https://github.com/skysegbr/FluxaWay
 * Import only the categories you use, or everything via ./fluxaway-components.js.
 */
import { h, useEffect, useRef, useState, useMemo, useId } from "./fluxaway.js";
import { hasChildren, joinClasses } from "./fluxaway-components-util.js";
import { IconButton } from "./fluxaway-components-core.js";

export function Tabs({ value, onChange, items = [], className = "" } = {}) {
  const enabled = items.map((item, index) => index).filter((index) => !items[index].disabled);

  const onKeyDown = (event, index) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (enabled.length === 0) {
      return;
    }

    const pos = enabled.indexOf(index);
    let nextPos;

    if (event.key === "Home") {
      nextPos = 0;
    } else if (event.key === "End") {
      nextPos = enabled.length - 1;
    } else {
      const direction = event.key === "ArrowRight" ? 1 : -1;
      nextPos = (pos + direction + enabled.length) % enabled.length;
    }

    const nextItem = items[enabled[nextPos]];
    onChange?.(nextItem.value);
    queueMicrotask(() => document.getElementById(`tab-${nextItem.value}`)?.focus());
  };

  return h(
    "div",
    { className: joinClasses("m-tabs", className), role: "tablist" },
    items.map((item, index) =>
      h(
        "button",
        {
          key: item.value,
          id: `tab-${item.value}`,
          type: "button",
          className: joinClasses("m-tab", item.value === value && "m-tab-active"),
          role: "tab",
          ariaSelected: item.value === value ? "true" : "false",
          ariaControls: `panel-${item.value}`,
          tabIndex: item.value === value ? 0 : -1,
          disabled: item.disabled,
          onClick: () => onChange?.(item.value),
          onKeyDown: (event) => onKeyDown(event, index),
        },
        item.label,
      ),
    ),
  );
}


// ── Navbar ─────────────────────────────────────────────────

export function Navbar({
  brand,
  items = [],
  actions,
  defaultOpen = false,
  open,
  onToggle,
  openMenuLabel = "Open menu",
  closeMenuLabel = "Close menu",
  className = "",
  ...props
} = {}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  // The mobile menu is in-flow on purpose: it pushes the page down instead of
  // covering it. That makes closing it a layout change, and a tapped link closes
  // it at the very moment the browser computes where to scroll for the anchor.
  // Left animating, the menu is still open when that position is taken, then
  // shrinks under the scroll: with `scroll-behavior: smooth` the target lands off
  // by the menu's height in Chromium and Firefox, and WebKit abandons the scroll.
  // So a link closes the menu with no transition — the re-render runs in a
  // microtask, before the click's default action — while the toggle, Escape and
  // an outside press keep the animation.
  const [closedByLink, setClosedByLink] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const menuId = useId();
  const navRef = useRef(null);

  const setOpen = (next) => {
    if (open === undefined) setInternalOpen(next);
    onToggle?.(next);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    // Every opening starts animated again, however the previous one ended.
    setClosedByLink(false);

    const onMouseDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const hasMenu = items.length > 0 || hasChildren(actions);

  return h(
    "nav",
    {
      ...props,
      ref: navRef,
      className: joinClasses("m-navbar", isOpen && "m-navbar-open", closedByLink && !isOpen && "m-navbar-instant", className),
    },
    hasChildren(brand) && h("div", { className: "m-navbar-brand" }, brand),
    hasMenu &&
      h(
        "button",
        {
          type: "button",
          className: "m-navbar-toggle",
          onClick: () => setOpen(!isOpen),
          ariaExpanded: isOpen ? "true" : "false",
          ariaControls: menuId,
          ariaLabel: isOpen ? closeMenuLabel : openMenuLabel,
        },
        h("span", { className: "m-navbar-toggle-icon", ariaHidden: "true" }),
      ),
    hasMenu &&
      h(
        "div",
        { className: "m-navbar-menu-wrap" },
        h(
          "div",
          { className: "m-navbar-menu-inner" },
          h(
            "div",
            { id: menuId, className: "m-navbar-menu" },
            items.length > 0 &&
              h(
                "ul",
                { className: "m-navbar-nav", role: "list" },
                items.map((item, i) =>
                  h(
                    "li",
                    { key: item.key ?? i },
                    h(
                      "a",
                      {
                        className: joinClasses(
                          "m-navbar-link",
                          item.active && "m-navbar-link-active",
                        ),
                        href: item.href || "#",
                        onClick: (event) => {
                          setClosedByLink(true);
                          setOpen(false);
                          item.onClick?.(event);
                        },
                        ariaCurrent: item.active ? "page" : undefined,
                      },
                      item.icon && h("span", { className: "m-navbar-link-icon", ariaHidden: "true" }, item.icon),
                      item.label,
                    ),
                  ),
                ),
              ),
            hasChildren(actions) && h("div", { className: "m-navbar-actions" }, actions),
          ),
        ),
      ),
  );
}

// ── Mobile components ──────────────────────────────────────

export function AppBar({
  title,
  leading,
  actions,
  className = "",
  ...props
} = {}) {
  return h(
    "header",
    { ...props, className: joinClasses("m-app-bar", className) },
    leading,
    h("h1", { className: "m-app-bar-title" }, title),
    actions && h("div", { className: "m-app-bar-actions" }, actions),
  );
}

export function BottomNav({ items = [], value, onChange, className = "" } = {}) {
  return h(
    "nav",
    { className: joinClasses("m-bottom-nav", className), role: "navigation" },
    items.map((item) =>
      h(
        "button",
        {
          key: item.value,
          type: "button",
          className: joinClasses(
            "m-bottom-nav-item",
            value === item.value && "m-bottom-nav-item-active",
          ),
          onClick: () => onChange?.(item.value),
          ariaLabel: item.label,
          ariaCurrent: value === item.value ? "page" : undefined,
        },
        h(
          "span",
          { className: "m-bottom-nav-icon" },
          item.icon,
          item.badge != null &&
            h("span", { className: "m-bottom-nav-badge" }, item.badge),
        ),
        h("span", null, item.label),
      ),
    ),
  );
}

export function FAB({
  label,
  extended = false,
  aboveNav = false,
  children,
  className = "",
  ...props
} = {}) {
  return h(
    "button",
    {
      ...props,
      type: "button",
      className: joinClasses(
        "m-fab",
        extended && "m-fab-extended",
        aboveNav && "m-fab-above-nav",
        className,
      ),
      ariaLabel: extended ? undefined : label,
      title: extended ? undefined : label,
    },
    children,
    extended && label,
  );
}

// Trigger + expanding row of IconButtons. `orbit: true` stacks the items
// upward above the trigger instead of inline to the side.
export function SpeedDial({
  icon,
  label = "More actions",
  items = [],
  orbit = false,
  className = "",
  ...props
} = {}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return h(
    "div",
    {
      ...props,
      ref: rootRef,
      className: joinClasses("m-speeddial", orbit && "m-speeddial-orbit", open && "is-open", className),
    },
    h(
      IconButton,
      {
        label,
        variant: "contained",
        className: "m-speeddial-trigger",
        onClick: () => setOpen((v) => !v),
      },
      icon,
    ),
    h(
      "div",
      { className: "m-speeddial-menu", role: "menu" },
      items.map((item, i) =>
        h(
          IconButton,
          {
            key: item.key ?? i,
            label: item.label,
            variant: "tonal",
            className: "m-speeddial-item",
            style: { transitionDelay: open ? `${(items.length - i) * 40}ms` : "0ms" },
            onClick: (e) => {
              item.onClick?.(e);
              setOpen(false);
            },
          },
          item.icon,
        ),
      ),
    ),
  );
}

// Horizontal travel, in px, before a press counts as a swipe rather than a tap.
const SWIPE_SLOP = 6;

export function SwipeableListItem({
  children,
  actions = [],
  actionWidth = 72,
  className = "",
  ...props
} = {}) {
  const trackRef   = useRef(null);
  const startXRef  = useRef(null);
  const currentRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const maxOffset = useMemo(() => actions.length * actionWidth, [actions.length, actionWidth]);

  const settle = (x) => {
    const snapped = x < -(maxOffset * 0.4) ? -maxOffset : 0;
    currentRef.current = snapped;
    setOffset(snapped);
    setSwiping(false);
  };

  // Pointer events cover mouse, pen and touch in one path. `.m-swipeable` sets
  // `touch-action: pan-y`, so a vertical pan still scrolls the page (the browser
  // then sends pointercancel) while horizontal travel is delivered here.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let pointerId = null;
    let downX = 0;
    let dragging = false;
    let suppressClick = false;

    const onPointerDown = (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      pointerId = e.pointerId;
      downX = e.clientX;
      dragging = false;
      suppressClick = false;
    };

    const finish = () => {
      if (pointerId === null) return;
      pointerId = null;
      startXRef.current = null;
      if (!dragging) return;
      dragging = false;
      // A mouse or pen drag still ends in a click on the row; swallow that one
      // so a swipe never activates the row's own content. The click is
      // dispatched right after pointerup, before this timer runs.
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      settle(currentRef.current);
    };

    const onPointerMove = (e) => {
      if (e.pointerId !== pointerId) return;

      // A mouse has no implicit capture: released outside the row before the
      // drag began, its pointerup never arrives here.
      if (e.pointerType === "mouse" && e.buttons === 0) {
        finish();
        return;
      }

      if (!dragging) {
        // A press only becomes a swipe past a small slop, so taps and clicks on
        // the row's content keep working. Capture starts here rather than on
        // pointerdown: capturing a plain press retargets its click to the track.
        if (Math.abs(e.clientX - downX) < SWIPE_SLOP) return;
        dragging = true;
        startXRef.current = e.clientX;
        setSwiping(true);
        try {
          el.setPointerCapture(pointerId);
        } catch {
          // The pointer is already gone — the drag still works without capture.
        }
        return;
      }

      const dx = e.clientX - startXRef.current;
      const next = Math.min(0, Math.max(-maxOffset, currentRef.current + dx));
      startXRef.current = e.clientX;
      currentRef.current = next;
      setOffset(next);
    };

    const onPointerEnd = (e) => {
      if (e.pointerId === pointerId) finish();
    };

    const onClickCapture = (e) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("pointerdown",   onPointerDown);
    el.addEventListener("pointermove",   onPointerMove);
    el.addEventListener("pointerup",     onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
    el.addEventListener("click",         onClickCapture, true);

    return () => {
      el.removeEventListener("pointerdown",   onPointerDown);
      el.removeEventListener("pointermove",   onPointerMove);
      el.removeEventListener("pointerup",     onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
      el.removeEventListener("click",         onClickCapture, true);
    };
  }, [maxOffset]);

  const close = () => { currentRef.current = 0; setOffset(0); };

  return h(
    "div",
    { ...props, className: joinClasses("m-swipeable", className) },
    h(
      "div",
      {
        ref: trackRef,
        className: joinClasses("m-swipeable-track", swiping && "m-swipeable-swiping"),
        style: { transform: `translateX(${offset}px)` },
      },
      children,
    ),
    h(
      "div",
      { className: "m-swipeable-actions", style: { width: `${maxOffset}px` } },
      actions.map((action, i) =>
        h("button", {
          key: action.key ?? i,
          type: "button",
          className: joinClasses("m-swipeable-action", action.className),
          style: { width: `${actionWidth}px`, ...action.style },
          onClick: () => { close(); action.onClick?.(); },
        }, action.icon ?? action.label),
      ),
    ),
  );
}


// TabPanel — companion to Tabs; only renders when id === activeId
export function TabPanel({ id, activeId, className = "", children, ...props } = {}) {
  if (id !== activeId) return null;
  return h(
    "div",
    {
      ...props,
      id: `panel-${id}`,
      className: joinClasses("m-tab-panel", className),
      role: "tabpanel",
      ariaLabelledby: `tab-${id}`,
      tabIndex: 0,
    },
    children,
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
//
// Props:
//   steps        [{ label, description? }]
//   activeStep   index of the current step (0-based)
//   orientation  "horizontal" | "vertical" (default "horizontal")

export function Stepper({ steps = [], activeStep = 0, orientation = "horizontal", className = "", ...props } = {}) {
  return h("ol", { ...props, className: joinClasses("m-stepper", `m-stepper-${orientation}`, className) },
    steps.map((step, i) => {
      const done    = i < activeStep;
      const current = i === activeStep;
      return h("li", {
        key:       i,
        className: joinClasses("m-step", done && "m-step-done", current && "m-step-current"),
      },
        h("div", { className: "m-step-indicator" },
          done
            ? h("span", { className: "m-step-check", ariaHidden: "true" }, "✓")
            : h("span", { className: "m-step-number" }, i + 1),
        ),
        h("div", { className: "m-step-content" },
          h("span", { className: "m-step-label" }, step.label),
          step.description && h("span", { className: "m-step-desc" }, step.description),
        ),
        i < steps.length - 1 && h("div", { className: "m-step-line", ariaHidden: "true" }),
      );
    }),
  );
}

// ── Breadcrumb ───────────────────────────────────────────────

export function Breadcrumb({
  items = [],
  separator = "/",
  ariaLabel = "Breadcrumb",
  className = "",
  ...props
} = {}) {
  const last = items.length - 1;

  return h(
    "nav",
    { ...props, ariaLabel, className },
    h(
      "ol",
      { className: "m-breadcrumb" },
      items.map((item, index) =>
        h(
          "li",
          // item.key ?? index (not href/label): several crumbs can share the
          // same placeholder href, and duplicate keys corrupt reconciliation.
          { key: item.key ?? index, className: "m-breadcrumb-item" },
          index > 0 && h("span", { className: "m-breadcrumb-sep", ariaHidden: "true" }, separator),
          index === last || (!item.href && !item.onClick)
            ? h("span", { ariaCurrent: index === last ? "page" : undefined }, item.icon, item.label)
            : h(
                "a",
                { className: "m-breadcrumb-link", href: item.href, onClick: item.onClick },
                item.icon,
                item.label,
              ),
        ),
      ),
    ),
  );
}
