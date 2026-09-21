// Keyboard, focus-management, and ARIA tests for the interactive components
// audited for accessibility: BottomSheet, Dropdown, ContextMenu, Combobox,
// Tooltip, Tabs/TabPanel, Dialog, Drawer.

import { h, render, useState } from "../dist/fluxaway.js";
import {
  BottomSheet,
  Dropdown,
  ContextMenu,
  Combobox,
  Tooltip,
  Tabs,
  TabPanel,
  Dialog,
  Drawer,
  Button,
  Chip,
  Avatar,
  Navbar,
} from "../dist/fluxaway-components.js";
import {
  LineChart as ChartLine,
  BarChart as ChartBar,
  DonutChart as ChartDonut,
  Heatmap as ChartHeatmap,
  ScatterChart as ChartScatter,
  Meter as ChartMeter,
} from "../dist/fluxaway-charts.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

const A11Y_ROWS = [
  { m: "Jan", v: 10 },
  { m: "Feb", v: 20 },
  { m: "Mar", v: 15 },
];

const A11Y_GRID = [
  { day: "Mon", hour: "09", n: 4 },
  { day: "Mon", hour: "12", n: 9 },
];

function keydown(target, key) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

// ── BottomSheet ─────────────────────────────────────────────────────────────

test("BottomSheet: focuses first element on open, traps Tab, restores focus on close", async () => {
  let setOpenFn;
  const container = mountPoint();

  function Wrapper() {
    const [open, setOpen] = useState(false);
    setOpenFn = setOpen;
    return h(
      "div",
      null,
      h("button", { id: "opener" }, "Open"),
      h(
        BottomSheet,
        { open, title: "Sheet", onClose: () => setOpen(false) },
        h("button", null, "First"),
        h("button", null, "Second"),
      ),
    );
  }

  render(Wrapper, container);
  await flush();

  const opener = container.querySelector("#opener");
  opener.focus();

  setOpenFn(true);
  await flush();

  const buttons = Array.from(container.querySelectorAll(".m-bottom-sheet button"));
  assertEqual(buttons.length, 3, "close button + First + Second");
  assertEqual(document.activeElement, buttons[0], "initial focus lands on the first focusable element");

  buttons[buttons.length - 1].focus();
  keydown(document, "Tab");
  assertEqual(document.activeElement, buttons[0], "Tab from the last element wraps to the first");

  keydown(document, "Escape");
  await flush();
  assertEqual(document.activeElement, opener, "Escape closes the sheet and restores focus to the opener");
});

// ── Dropdown ────────────────────────────────────────────────────────────────

test("Dropdown: arrow keys navigate items, Tab closes the menu", async () => {
  const container = mountPoint();

  function Wrapper() {
    return h(Dropdown, {
      id: "menu",
      trigger: "Menu",
      items: [
        { key: "a", label: "Alpha", onClick: () => {} },
        { key: "b", label: "Beta", onClick: () => {} },
      ],
    });
  }

  render(Wrapper, container);
  await flush();

  container.querySelector(".m-dropdown-trigger").click();
  await flush();

  let items = Array.from(container.querySelectorAll(".m-dropdown-menu button"));
  assertEqual(document.activeElement, items[0], "opening focuses the first menu item");

  keydown(document, "ArrowDown");
  items = Array.from(container.querySelectorAll(".m-dropdown-menu button"));
  assertEqual(document.activeElement, items[1], "ArrowDown moves focus to the next item");

  keydown(document, "Tab");
  await flush();
  assertEqual(container.querySelector(".m-dropdown-menu"), null, "Tab closes the dropdown menu");
});

// ── ContextMenu ─────────────────────────────────────────────────────────────

test("ContextMenu: arrow keys navigate items, Escape restores focus to the invoker", async () => {
  let openFn;
  const container = mountPoint();

  function Wrapper() {
    const [state, setState] = useState({ open: false, x: 0, y: 0 });
    openFn = () => setState({ open: true, x: 0, y: 0 });

    return h(
      "div",
      null,
      h("button", { id: "trigger" }, "Trigger"),
      h(ContextMenu, {
        open: state.open,
        x: state.x,
        y: state.y,
        onClose: () => setState((s) => ({ ...s, open: false })),
        items: [
          { key: "a", label: "Alpha", onClick: () => {} },
          { key: "b", label: "Beta", onClick: () => {} },
        ],
      }),
    );
  }

  render(Wrapper, container);
  await flush();

  const trigger = container.querySelector("#trigger");
  trigger.focus();

  openFn();
  await flush();

  let items = Array.from(container.querySelectorAll(".m-context-menu button"));
  assertEqual(document.activeElement, items[0], "opening focuses the first menu item");
  assertEqual(
    container.querySelector(".m-context-menu").getAttribute("aria-label"),
    "Context menu",
    "menu has a default accessible name",
  );

  keydown(document, "ArrowDown");
  items = Array.from(container.querySelectorAll(".m-context-menu button"));
  assertEqual(document.activeElement, items[1], "ArrowDown moves focus to the next item");

  keydown(document, "Escape");
  await flush();
  assertEqual(document.activeElement, trigger, "Escape closes the menu and restores focus to the invoker");
});

// ── Combobox ────────────────────────────────────────────────────────────────

test("Combobox: arrow keys move aria-activedescendant, Enter selects, focus returns to the trigger", async () => {
  const container = mountPoint();

  function Wrapper() {
    const [value, setValue] = useState(undefined);
    return h(Combobox, {
      id: "fruit",
      label: "Fruit",
      value,
      onChange: setValue,
      options: [
        { value: "apple", label: "Apple" },
        { value: "banana", label: "Banana" },
        { value: "cherry", label: "Cherry" },
      ],
    });
  }

  render(Wrapper, container);
  await flush();

  const trigger = container.querySelector("#fruit");
  trigger.click();
  await flush();

  const input = container.querySelector(".m-combobox-search");
  assertEqual(document.activeElement, input, "opening focuses the search input");
  assertEqual(
    input.getAttribute("aria-activedescendant"),
    "fruit-option-apple",
    "the first option is active by default",
  );

  keydown(document, "ArrowDown");
  await flush();
  assertEqual(
    input.getAttribute("aria-activedescendant"),
    "fruit-option-banana",
    "ArrowDown moves the active option",
  );

  keydown(document, "Enter");
  await flush();

  assertEqual(container.querySelector(".m-combobox-dropdown"), null, "Enter closes the dropdown");
  assertEqual(document.activeElement, trigger, "selecting restores focus to the trigger");
  assertEqual(
    container.querySelector(".m-combobox-value").textContent,
    "Banana",
    "Enter selected the active option",
  );
});

// ── Tooltip ─────────────────────────────────────────────────────────────────

test("Tooltip: trigger is described by a real, referenceable bubble; Escape dismisses it", async () => {
  const container = mountPoint();

  function Wrapper() {
    return h(Tooltip, { id: "info", content: "More info" }, h(Button, { id: "trigger" }, "Hover me"));
  }

  render(Wrapper, container);
  await flush();

  const trigger = container.querySelector("#trigger");
  const bubble = container.querySelector(".m-tooltip-bubble");

  assertEqual(bubble.id, "info-bubble");
  assertEqual(bubble.getAttribute("role"), "tooltip");
  assertEqual(bubble.textContent, "More info");
  assertEqual(
    trigger.getAttribute("aria-describedby"),
    "info-bubble",
    "the wrapped trigger is described by the tooltip bubble",
  );

  const wrap = container.querySelector(".m-tooltip-wrap");
  keydown(wrap, "Escape");
  await flush();
  assert(wrap.className.includes("m-tooltip-dismissed"), "Escape marks the tooltip dismissed");
});

// ── Tabs / TabPanel ─────────────────────────────────────────────────────────

test("Tabs: roving tabindex, arrow keys move focus and selection, aria linkage matches panels", async () => {
  const container = mountPoint();

  function Wrapper() {
    const [value, setValue] = useState("a");
    return h(
      "div",
      null,
      h(Tabs, {
        value,
        onChange: setValue,
        items: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
        ],
      }),
      h(TabPanel, { id: "a", activeId: value }, "Panel A"),
      h(TabPanel, { id: "b", activeId: value }, "Panel B"),
      h(TabPanel, { id: "c", activeId: value }, "Panel C"),
    );
  }

  render(Wrapper, container);
  await flush();

  const tabA = container.querySelector("#tab-a");
  const tabB = container.querySelector("#tab-b");

  assertEqual(tabA.getAttribute("tabindex"), "0", "the selected tab is in the tab order");
  assertEqual(tabB.getAttribute("tabindex"), "-1", "unselected tabs are removed from the tab order");
  assertEqual(tabA.getAttribute("aria-controls"), "panel-a");
  assertEqual(container.querySelector("#panel-a").getAttribute("aria-labelledby"), "tab-a");

  tabA.focus();
  keydown(tabA, "ArrowRight");
  await flush();

  assertEqual(document.activeElement.id, "tab-b", "ArrowRight moves focus to the next tab");
  assertEqual(
    container.querySelector("#tab-b").getAttribute("tabindex"),
    "0",
    "moving focus also selects it (automatic activation)",
  );
  assert(container.querySelector("#panel-b"), "the newly selected tab's panel is now rendered");
  assertEqual(container.querySelector("#panel-a"), null, "the previous panel is no longer rendered");
});

// The tablist IS .m-tabs, with the tabs as direct children. The stylesheet once
// styled a .m-tabs-list wrapper no component ever rendered, which left .m-tabs as
// a column and stacked the tabs — against the ArrowLeft/ArrowRight contract above.
test("Tabs: tabs sit in one row, and a narrow strip scrolls sideways without clipping", async () => {
  const container = mountPoint();
  const labels = ["Overview", "Orders", "Customers", "Inventory", "Reports", "Settings"];
  const items = labels.map((label, index) => ({ value: `row-${index}`, label, disabled: index === 5 }));

  render(
    () =>
      h(
        "div",
        null,
        h("div", { id: "tabs-wide", style: { width: "900px" } }, h(Tabs, { value: "row-0", items })),
        h("div", { id: "tabs-narrow", style: { width: "260px" } }, h(Tabs, { value: "row-0", items })),
      ),
    container,
  );
  await flush();

  for (const id of ["tabs-wide", "tabs-narrow"]) {
    const strip = container.querySelector(`#${id} [role="tablist"]`);
    const tabs = [...strip.querySelectorAll('[role="tab"]')];
    const tops = new Set(tabs.map((tab) => Math.round(tab.getBoundingClientRect().top)));

    assertEqual(tabs.length, 6);
    assert(tabs.every((tab) => tab.parentElement === strip), "tabs are direct children of the tablist");
    assertEqual(tops.size, 1, `${id}: every tab shares one row`);
    assert(strip.scrollHeight <= strip.clientHeight, `${id}: the strip never scrolls vertically`);

    const stripBox = strip.getBoundingClientRect();
    const activeBox = strip.querySelector(".m-tab-active").getBoundingClientRect();
    assert(activeBox.bottom <= stripBox.bottom + 0.5, `${id}: the active indicator is not clipped below the strip`);
  }

  const wide = container.querySelector('#tabs-wide [role="tablist"]');
  const narrow = container.querySelector('#tabs-narrow [role="tablist"]');
  assert(wide.scrollWidth <= wide.clientWidth, "a wide strip fits");
  assert(narrow.scrollWidth > narrow.clientWidth, "a narrow strip scrolls sideways instead of wrapping or shrinking");
  assertEqual(getComputedStyle(narrow.querySelector("[disabled]")).opacity, "0.45", "a disabled tab looks disabled");
});

// ── Chip ────────────────────────────────────────────────────────────────────

test("Chip: with onClick it is a focusable toggle button; without one, a static label", async () => {
  const container = mountPoint();
  let submits = 0;

  function Wrapper() {
    const [on, setOn] = useState(false);
    return h(
      "form",
      { onSubmit: (event) => { event.preventDefault(); submits += 1; } },
      h(Chip, { id: "chip-static", active: true }, "Status"),
      h(Chip, { id: "chip-toggle", active: on, onClick: () => setOn(!on) }, "Filter"),
      h(Chip, { id: "chip-radio", role: "radio", ariaChecked: "true", onClick: () => {} }, "Choice"),
      h(Chip, { id: "chip-off", disabled: true, onClick: () => {} }, "Off"),
    );
  }

  render(Wrapper, container);
  await flush();

  const still = container.querySelector("#chip-static");
  assertEqual(still.tagName, "SPAN", "no onClick: a static label, not a control");
  assertEqual(still.hasAttribute("aria-pressed"), false);
  assertEqual(still.tabIndex, -1);

  const toggle = container.querySelector("#chip-toggle");
  assertEqual(toggle.tagName, "BUTTON", "onClick: a real button, reachable and operable by keyboard");
  assertEqual(toggle.tabIndex, 0);
  assertEqual(toggle.getAttribute("aria-pressed"), "false");
  assert(toggle.classList.contains("m-chip"), "keeps the chip class");

  toggle.focus();
  assertEqual(document.activeElement, toggle, "it takes focus");
  toggle.click();
  await flush();
  assertEqual(container.querySelector("#chip-toggle").getAttribute("aria-pressed"), "true", "active is announced as pressed");
  assert(container.querySelector("#chip-toggle").classList.contains("m-chip-active"));
  assertEqual(submits, 0, "type=button: a chip inside a form never submits it");

  const radio = container.querySelector("#chip-radio");
  assertEqual(radio.getAttribute("role"), "radio");
  assertEqual(radio.hasAttribute("aria-pressed"), false, "an explicit role opts out of aria-pressed");

  assertEqual(container.querySelector("#chip-off").disabled, true);
});

// ── Navbar ──────────────────────────────────────────────────────────────────

// The mobile menu is in-flow, so closing it is a layout change. A tapped link
// closes it while the browser is computing the anchor's scroll position; left
// animating, a smooth scroll lands the target off by the menu's height (and
// WebKit abandons the scroll). The end-to-end measurement needs a real tap at a
// phone width; what the suite can hold is the contract that makes it work.
test("Navbar: a tapped link closes the menu without the collapse animation; every other way keeps it", async () => {
  const container = mountPoint();
  render(
    () => h(Navbar, { brand: "Shop", items: [{ label: "Contact", href: "#navbar-instant-target" }] }),
    container,
  );
  await flush();

  const nav = container.querySelector(".m-navbar");
  const toggle = container.querySelector(".m-navbar-toggle");
  const state = () => [nav.classList.contains("m-navbar-open"), nav.classList.contains("m-navbar-instant")].join();

  toggle.click();
  await flush();
  assertEqual(state(), "true,false", "opening animates");

  container.querySelector(".m-navbar-link").click();
  await flush();
  assertEqual(state(), "false,true", "a link closes it in the same frame");

  toggle.click();
  await flush();
  assertEqual(state(), "true,false", "the next opening animates again");

  keydown(document, "Escape");
  await flush();
  assertEqual(state(), "false,false", "Escape keeps the collapse animation");

  toggle.click();
  await flush();
  toggle.click();
  await flush();
  assertEqual(state(), "false,false", "so does the toggle");

  let rule = null;
  const visit = (rules) => {
    for (const candidate of rules) {
      if (candidate.selectorText === ".m-navbar-instant .m-navbar-menu-wrap") rule = candidate;
      if (candidate.cssRules) visit(candidate.cssRules);
    }
  };
  for (const sheet of document.styleSheets) visit(sheet.cssRules);
  assert(rule, "the stylesheet has the instant-close rule");
  assert(rule.style.transition.startsWith("none"), `it turns the transition off, got "${rule.style.transition}"`);

  history.replaceState(null, "", location.pathname + location.search);
});

// From 768px up the menu sits on the bar only while it fits there. Labels,
// brand, actions and font decide that, not a breakpoint, so the bar measures
// itself. The viewport sweep lives in run_browser_tests.py; these hold what it
// cannot see: the width that counts is the bar's own, not the window's, and the
// content can change with no resize at all.
const MANY_LINKS = ["Features", "Catalogue", "About us", "Testimonials", "Contact", "Journal", "Our team"];
const fitItems = (labels) => labels.map((label, index) => ({ label, href: `#fit-${index}` }));

// A ResizeObserver reports on the next frame, and its re-render follows.
const resized = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0))));

function navbarFit(container) {
  const nav = container.querySelector(".m-navbar");
  const links = [...nav.querySelectorAll(".m-navbar-link")].map((link) => link.getBoundingClientRect());
  return {
    height: nav.getBoundingClientRect().height,
    toggle: getComputedStyle(nav.querySelector(".m-navbar-toggle")).display !== "none",
    menu: getComputedStyle(nav.querySelector(".m-navbar-menu-wrap")).visibility,
    lines: new Set(links.map((rect) => Math.round(rect.top))).size,
  };
}

test("Navbar: links that do not fit wait behind the toggle — the bar never wraps, whatever its own width", async () => {
  // Below 768px the stylesheet collapses the bar by itself; nothing to measure.
  if (!window.matchMedia("(min-width: 768px)").matches) return;

  const container = mountPoint();
  container.style.width = "760px";
  render(
    () => h(Navbar, { brand: "Garden Flowers", items: fitItems(MANY_LINKS), actions: h(Button, null, "Sign in") }),
    container,
  );
  await flush();

  let inlineFrom = null;
  for (let width = 760; width <= 1120; width += 40) {
    container.style.width = `${width}px`;
    await resized();
    const fit = navbarFit(container);
    assertEqual(fit.height, 60, `the bar's height at ${width}px`);
    if (fit.toggle) {
      assert(inlineFrom === null, `collapsed again at ${width}px after fitting at ${inlineFrom}px`);
      assertEqual(fit.menu, "hidden", `the closed menu at ${width}px, behind the toggle`);
    } else {
      inlineFrom = inlineFrom ?? width;
      assertEqual(fit.lines, 1, `lines of links at ${width}px`);
      assertEqual(fit.menu, "visible", `the inline menu at ${width}px`);
    }
  }
  assert(inlineFrom !== null && inlineFrom > 760, `seven links went inline from ${inlineFrom}px: never seen not fitting`);

  // Back under: hidden in the same frame, not after a 220ms collapse animation
  // during which the links would still take focus.
  container.style.width = "760px";
  await resized();
  const fit = navbarFit(container);
  assert(fit.toggle && fit.menu === "hidden", `narrow again: toggle=${fit.toggle}, menu ${fit.menu}`);
});

test("Navbar: a bar as wide as its content keeps the links inline", async () => {
  if (!window.matchMedia("(min-width: 768px)").matches) return;

  // Measuring must not take the menu out of flow: in a shrink-to-fit parent the
  // bar would narrow to the brand, find no room, and stay collapsed for good.
  const container = mountPoint();
  container.style.display = "inline-block";
  render(() => h(Navbar, { brand: "Shop", items: fitItems(MANY_LINKS) }), container);
  await flush();
  await resized();

  const fit = navbarFit(container);
  assert(!fit.toggle && fit.lines === 1, `toggle=${fit.toggle}, ${fit.lines} line(s) of links`);
});

test("Navbar: a parent sized by its content can still narrow the bar", async () => {
  if (!window.matchMedia("(min-width: 768px)").matches) return;

  // A grid item is at least as wide as its content. Were the inline links unable
  // to wrap, the bar's minimum width would be the whole row: it would push the
  // column out, measure itself in the room it had just made, and "fit".
  const container = mountPoint();
  container.style.cssText = "display: grid; width: 400px";
  render(() => h("section", null, h(Navbar, { items: fitItems(MANY_LINKS) })), container);
  await flush();
  await resized();

  const nav = container.querySelector(".m-navbar");
  assertEqual(nav.getBoundingClientRect().width, 400, "the bar's width in a 400px grid");
  const fit = navbarFit(container);
  assert(fit.toggle && fit.height === 60, `toggle=${fit.toggle}, height ${fit.height}`);
});

test("Navbar: new labels are measured on the render that brings them, with no resize", async () => {
  if (!window.matchMedia("(min-width: 768px)").matches) return;

  let setLabels;
  const container = mountPoint();
  container.style.width = "600px";

  function Wrapper() {
    const [labels, set] = useState(MANY_LINKS);
    setLabels = set;
    return h(Navbar, { brand: "Garden Flowers", items: fitItems(labels) });
  }

  render(Wrapper, container);
  await flush();
  assert(navbarFit(container).toggle, "seven long links do not fit in 600px");

  // Collapsed, the links are stretched to the bar: no observed box changes size.
  setLabels(MANY_LINKS.map((label) => label.slice(0, 2)));
  await flush();
  let fit = navbarFit(container);
  assert(!fit.toggle && fit.lines === 1 && fit.height === 60, `short labels: toggle=${fit.toggle}, ${fit.lines} line(s)`);

  setLabels(MANY_LINKS);
  await flush();
  fit = navbarFit(container);
  assert(fit.toggle && fit.menu === "hidden" && fit.height === 60, `long labels again: toggle=${fit.toggle}, menu ${fit.menu}`);

  // Measuring after every render must settle, not feed itself. Each reading
  // puts .m-navbar-measuring on and off, so the class attribute counts them —
  // once the observer's first report, which always comes, is behind.
  await resized();
  let readings = 0;
  const watcher = new MutationObserver((records) => {
    readings += records.length;
  });
  watcher.observe(container.querySelector(".m-navbar"), { attributes: true, attributeFilter: ["class"] });
  await resized();
  watcher.disconnect();
  assertEqual(readings, 0, "class changes on a bar that had settled");
});

// ── Avatar ──────────────────────────────────────────────────────────────────

// The recipe AI_SPEC teaches for an avatar that sits next to its written name.
test("Avatar: names itself when alone, and ariaHidden takes it out of the reading order", async () => {
  const container = mountPoint();
  render(
    () =>
      h(
        "div",
        null,
        h(Avatar, { id: "avatar-alone", name: "Ada Lovelace" }),
        h(Avatar, { id: "avatar-beside-text", name: "Ada Lovelace", ariaHidden: "true" }),
        h(Avatar, { id: "avatar-photo-beside-text", name: "Ada Lovelace", src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", ariaHidden: "true" }),
      ),
    container,
  );
  await flush();

  const alone = container.querySelector("#avatar-alone");
  assertEqual(alone.getAttribute("role"), "img");
  assertEqual(alone.getAttribute("aria-label"), "Ada Lovelace");
  assertEqual(alone.hasAttribute("aria-hidden"), false);

  for (const id of ["avatar-beside-text", "avatar-photo-beside-text"]) {
    const hidden = container.querySelector(`#${id}`);
    assertEqual(hidden.getAttribute("aria-hidden"), "true", `${id}: the prop reaches the element`);
    assertEqual(hidden.hasAttribute("role"), false, `${id}: a hidden avatar claims no role`);
    assertEqual(hidden.hasAttribute("aria-label"), false, `${id}: and no label`);
    assert(hidden.classList.contains("m-avatar"), "still drawn as an avatar");
  }
});

// ── Dialog ──────────────────────────────────────────────────────────────────

test("Dialog: focuses first element on open, traps Tab, restores focus on close", async () => {
  let setOpenFn;
  const container = mountPoint();

  function Wrapper() {
    const [open, setOpen] = useState(false);
    setOpenFn = setOpen;
    return h(
      "div",
      null,
      h("button", { id: "opener" }, "Open"),
      h(
        Dialog,
        { open, title: "Confirm", onClose: () => setOpen(false) },
        h("button", null, "First"),
        h("button", null, "Second"),
      ),
    );
  }

  render(Wrapper, container);
  await flush();

  const opener = container.querySelector("#opener");
  opener.focus();

  setOpenFn(true);
  await flush();

  const buttons = Array.from(container.querySelectorAll(".m-dialog button"));
  assertEqual(buttons.length, 3, "close button + First + Second");
  assertEqual(document.activeElement, buttons[0], "initial focus lands on the first focusable element");

  buttons[buttons.length - 1].focus();
  keydown(document, "Tab");
  assertEqual(document.activeElement, buttons[0], "Tab from the last element wraps to the first");

  keydown(document, "Escape");
  await flush();
  assertEqual(document.activeElement, opener, "Escape closes the dialog and restores focus to the opener");
});

// ── Drawer ──────────────────────────────────────────────────────────────────

test("Drawer: focuses first element on open, traps Tab, restores focus on close", async () => {
  let setOpenFn;
  const container = mountPoint();

  function Wrapper() {
    const [open, setOpen] = useState(false);
    setOpenFn = setOpen;
    return h(
      "div",
      null,
      h("button", { id: "opener" }, "Open"),
      h(
        Drawer,
        { open, title: "Menu", onClose: () => setOpen(false) },
        h("button", null, "First"),
        h("button", null, "Second"),
      ),
    );
  }

  render(Wrapper, container);
  await flush();

  const opener = container.querySelector("#opener");
  opener.focus();

  setOpenFn(true);
  await flush();

  const buttons = Array.from(container.querySelectorAll(".m-drawer button"));
  assertEqual(buttons.length, 3, "close button + First + Second");
  assertEqual(document.activeElement, buttons[0], "initial focus lands on the first focusable element");

  buttons[buttons.length - 1].focus();
  keydown(document, "Tab");
  assertEqual(document.activeElement, buttons[0], "Tab from the last element wraps to the first");

  keydown(document, "Escape");
  await flush();
  assertEqual(document.activeElement, opener, "Escape closes the drawer and restores focus to the opener");
});

test("Dialog: does not steal focus from an element already inside it", async () => {
  let setTickFn;

  function App() {
    const [, setTick] = useState(0);
    setTickFn = setTick;
    return h(
      Dialog,
      { open: true, onClose: () => {}, title: "Form" },
      h("input", { id: "dlg-inner-input", type: "text" }),
    );
  }

  const container = mountPoint();
  render(App, container);
  await flush();

  const input = document.getElementById("dlg-inner-input");
  input.focus();
  assertEqual(document.activeElement, input, "expected the input to take focus");

  // A re-render while the user is typing must not move focus back to the
  // dialog's first focusable (the close button).
  setTickFn((t) => t + 1);
  await flush();
  assertEqual(document.activeElement, input, "expected focus to stay on the input after re-render");
});

// ── Charts (fluxaway-charts.js) ─────────────────────────────────────────────
//
// A chart's job is to be readable, and colour alone never satisfies that. What
// is asserted here is the non-visual path: every value reachable without a
// pointer, marks that take focus and announce themselves, and a keyboard route
// through the plot.

test("charts: every form ships a table-view twin, so no value is hover-only", async () => {
  const container = mountPoint();
  render(() => h("div", null,
    h(ChartLine, { data: A11Y_ROWS, x: "m", y: "v", label: "Visits" }),
    h(ChartBar, { data: A11Y_ROWS, x: "m", y: "v" }),
    h(ChartDonut, { data: A11Y_ROWS, x: "m", y: "v" }),
    h(ChartHeatmap, { data: A11Y_GRID, x: "hour", y: "day", value: "n" }),
    h(ChartScatter, { data: A11Y_ROWS, x: "v", y: "v" }),
  ), container);
  await flush();

  const tables = container.querySelectorAll("details.m-chart-table");
  assertEqual(tables.length, 5, "each chart must carry its own table view");
  for (const table of tables) {
    assert(table.querySelector("summary"), "the table twin must be reachable via a summary");
    assert(table.querySelectorAll("tbody tr").length > 0, "the table twin must have rows");
  }
});

test("charts: bar marks are focusable and announce category and value", async () => {
  const container = mountPoint();
  render(() => h(ChartBar, { data: A11Y_ROWS, x: "m", y: "v" }), container);
  await flush();

  const bar = container.querySelector("path.m-chart-bar");
  assertEqual(bar.getAttribute("tabindex"), "0");
  const label = bar.getAttribute("aria-label");
  assert(label.includes("Jan"), `the mark must name its category, got ${label}`);
  assert(label.includes("10"), `the mark must announce its value, got ${label}`);

  // focus must surface the same readout hover does
  bar.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
  await flush();
  assert(container.querySelector(".m-chart-tooltip"), "focus must open the readout");
});

test("charts: donut arcs and heatmap cells are focusable with their own labels", async () => {
  const container = mountPoint();
  render(() => h("div", null,
    h(ChartDonut, { data: A11Y_ROWS, x: "m", y: "v" }),
    h(ChartHeatmap, { data: A11Y_GRID, x: "hour", y: "day", value: "n" }),
  ), container);
  await flush();

  for (const selector of ["path.m-chart-arc", "rect.m-heat-cell"]) {
    const mark = container.querySelector(selector);
    assertEqual(mark.getAttribute("tabindex"), "0", `${selector} must be focusable`);
    assert(mark.getAttribute("aria-label"), `${selector} must carry an aria-label`);
  }
});

test("charts: the line plot is keyboard-navigable across the x-axis", async () => {
  const container = mountPoint();
  render(() => h(ChartLine, { data: A11Y_ROWS, x: "m", y: "v" }), container);
  await flush();

  const svg = container.querySelector("svg.m-chart-svg");
  assertEqual(svg.getAttribute("tabindex"), "0", "the plot itself must be reachable by Tab");

  keydown(svg, "ArrowRight");
  await flush();
  const first = container.querySelector(".m-chart-tooltip-title").textContent;
  keydown(svg, "ArrowRight");
  await flush();
  const second = container.querySelector(".m-chart-tooltip-title").textContent;
  assert(first !== second, "arrow keys must move the readout along the axis");
});

test("charts: the tooltip is a live region, so the readout is announced", async () => {
  const container = mountPoint();
  render(() => h(ChartBar, { data: A11Y_ROWS, x: "m", y: "v" }), container);
  await flush();

  container.querySelector("path.m-chart-bar")
    .dispatchEvent(new FocusEvent("focus", { bubbles: true }));
  await flush();

  const tooltip = container.querySelector(".m-chart-tooltip");
  assertEqual(tooltip.getAttribute("role"), "status");
  assertEqual(tooltip.getAttribute("aria-live"), "polite");
});

test("charts: the Meter exposes its value through ARIA, not just a filled bar", async () => {
  const container = mountPoint();
  render(() => h(ChartMeter, { label: "Seats", value: 30, max: 200 }), container);
  await flush();

  const meter = container.querySelector('[role="meter"]');
  assertEqual(meter.getAttribute("aria-valuenow"), "30");
  assertEqual(meter.getAttribute("aria-valuemin"), "0");
  assertEqual(meter.getAttribute("aria-valuemax"), "200");
  assertEqual(meter.getAttribute("aria-label"), "Seats");
});

test("charts: decorative chrome is hidden from assistive tech", async () => {
  const container = mountPoint();
  render(() => h(ChartLine, { data: A11Y_ROWS, x: "m", y: "v" }), container);
  await flush();

  // Gridlines and axis ticks repeat what the table already says.
  for (const selector of [".m-chart-grid", ".m-chart-axis-y", ".m-chart-axis-x"]) {
    const node = container.querySelector(selector);
    assertEqual(node.getAttribute("aria-hidden"), "true", `${selector} must be aria-hidden`);
  }
});
