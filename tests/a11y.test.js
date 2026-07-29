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
