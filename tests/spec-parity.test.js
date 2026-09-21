// Places where docs/AI_SPEC.md and the code disagreed, found while validating
// the docs site. Each test pins a claim the spec makes, so the two can't drift
// apart again unnoticed.

import { h, render, useForm, usePresence, useState } from "../dist/fluxaway.js";
import { Badge, Button, FormField } from "../dist/fluxaway-components-core.js";
import { Checkbox, NumberInput, Radio } from "../dist/fluxaway-components-forms.js";
import { Menu } from "../dist/fluxaway-components-overlay.js";
import { SwipeableListItem } from "../dist/fluxaway-components-nav.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

// Computed colors come back as `rgb(r, g, b)` or, out of color-mix(), as
// `color(srgb r g b)` with 0–1 channels.
function channels(value) {
  const numbers = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!numbers || numbers.length !== 3) {
    throw new Error(`expected a color, got ${value}`);
  }
  return value.startsWith("color(") ? numbers.map((n) => n * 255) : numbers;
}

function contrast(foreground, background) {
  const luminance = (color) => {
    const linear = channels(color).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };

  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const BADGE_VARIANTS = ["success", "warning", "danger"];

function badgeSamples(scopeProps) {
  return ["light", "dark"].map((theme) =>
    h(
      "div",
      { key: theme, dataset: { theme, scope: theme, ...scopeProps } },
      h(Badge, { dataset: { variant: "plain" } }, "3"),
      BADGE_VARIANTS.map((variant) =>
        h(Badge, { key: variant, className: `m-badge-${variant}`, dataset: { variant } }, "3"),
      ),
    ),
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────

test("Badge: the m-badge-success/-warning/-danger classes exist and read at AA in both themes", async () => {
  const container = mountPoint();
  render(() => h("div", null, badgeSamples()), container);
  await flush();

  const failures = [];
  for (const scope of container.querySelectorAll("[data-scope]")) {
    const plain = getComputedStyle(scope.querySelector('[data-variant="plain"]'));
    for (const variant of BADGE_VARIANTS) {
      const style = getComputedStyle(scope.querySelector(`[data-variant="${variant}"]`));
      const label = `${scope.dataset.scope} ${variant}`;
      if (style.backgroundColor === plain.backgroundColor) failures.push(`${label}: no fill of its own`);
      if (style.color === plain.color) failures.push(`${label}: no text color of its own`);
      const ratio = contrast(style.color, style.backgroundColor);
      if (ratio < 4.5) failures.push(`${label} = ${ratio.toFixed(2)}:1`);
    }
  }
  assertEqual(failures.join("; "), "");
});

test("Badge: the Metallic design keeps the status visible instead of flattening it", async () => {
  const container = mountPoint();
  render(() => h("div", null, badgeSamples({ design: "metallic" })), container);
  await flush();

  const failures = [];
  for (const scope of container.querySelectorAll("[data-scope]")) {
    const plain = getComputedStyle(scope.querySelector('[data-variant="plain"]'));
    const seen = new Set([plain.color]);
    for (const variant of BADGE_VARIANTS) {
      const style = getComputedStyle(scope.querySelector(`[data-variant="${variant}"]`));
      const label = `${scope.dataset.scope} ${variant}`;
      if (seen.has(style.color)) failures.push(`${label}: text color repeats another badge`);
      seen.add(style.color);
      const ratio = contrast(style.color, style.backgroundColor);
      if (ratio < 4.5) failures.push(`${label} = ${ratio.toFixed(2)}:1`);
    }
  }
  assertEqual(failures.join("; "), "");
});

// ── FormField / Checkbox / Radio ────────────────────────────────────────────

test("FormField: used directly without an id, it wires a lone input to the label, help and error", async () => {
  const container = mountPoint();
  render(
    () =>
      h(
        "div",
        null,
        h(FormField, { label: "Name", help: "Optional" }, h("input", { className: "m-field", type: "text" })),
        h(FormField, { label: "City", help: "Optional", error: "Required" }, h("input", { className: "m-field" })),
      ),
    container,
  );
  await flush();

  assertEqual(container.innerHTML.includes("undefined"), false, "no id is built from an undefined");

  const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
  assertEqual(new Set(ids).size, ids.length, "every generated id is unique");

  for (const field of container.querySelectorAll(".m-form-field")) {
    const input = field.querySelector("input");
    const described = input.getAttribute("aria-describedby").split(" ");
    assertEqual(field.querySelector("label").htmlFor, input.id, "the label points at the input");
    assert(input.id.length > 0, "the input received an id");
    assertEqual(described[0], field.querySelector(".m-help").id, "help text describes the input");
  }

  const [first, second] = container.querySelectorAll("input");
  assertEqual(first.getAttribute("aria-invalid"), null, "no error, no aria-invalid");
  assertEqual(second.getAttribute("aria-invalid"), "true");
  assert(
    second.getAttribute("aria-describedby").split(" ").includes(container.querySelector(".m-error").id),
    "error text describes the input",
  );
});

test("FormField: a lone control's own id wins, and an explicit id leaves the children alone", async () => {
  const container = mountPoint();
  render(
    () =>
      h(
        "div",
        null,
        h(FormField, { label: "Own", help: "h" }, h("select", { id: "own-id" }, h("option", null, "a"))),
        h(
          FormField,
          { id: "wrapped-id", label: "Wrapped", help: "h" },
          h("div", { className: "row" }, h("input", { id: "wrapped-id" })),
        ),
        h(FormField, { label: "Unwirable", help: "h" }, h("div", { className: "row" }, h("input", null))),
      ),
    container,
  );
  await flush();

  const [own, wrapped, unwirable] = container.querySelectorAll(".m-form-field");

  assertEqual(own.querySelector("label").htmlFor, "own-id");
  assertEqual(own.querySelector(".m-help").id, "own-id-help");
  assertEqual(own.querySelector("select").getAttribute("aria-describedby"), "own-id-help");

  assertEqual(wrapped.querySelector("label").htmlFor, "wrapped-id");
  assertEqual(wrapped.querySelector(".row").id, "", "an explicit id never lands on the child");

  assertEqual(unwirable.querySelector("label").getAttribute("for"), null, "no `for` pointing at nothing");
  assertEqual(unwirable.querySelector(".row").id, "", "a wrapper is not a labelable control");
  assert(/^fluxaway-\d+-help$/.test(unwirable.querySelector(".m-help").id), "help still gets a unique id");
});

test("Checkbox / Radio: help text without an id no longer emits undefined-help", async () => {
  const container = mountPoint();
  render(
    () =>
      h(
        "div",
        null,
        h(Checkbox, { label: "Terms", help: "Read them" }),
        h(Radio, { label: "Option", name: "opt", help: "Pick one" }),
      ),
    container,
  );
  await flush();

  assertEqual(container.innerHTML.includes("undefined"), false);
  for (const input of container.querySelectorAll("input")) {
    const help = document.getElementById(input.getAttribute("aria-describedby"));
    assert(help?.classList.contains("m-help"), `${input.type}: aria-describedby resolves to its help text`);
  }
});

// ── Menu ────────────────────────────────────────────────────────────────────

function menuWithSubmenu() {
  return h(Menu, {
    trigger: h(Button, null, "File"),
    items: [
      { key: "new", label: "New" },
      {
        key: "recent",
        label: "Open Recent",
        children: [{ key: "a", label: "project-a.js" }, { key: "b", label: "project-b.js" }],
      },
    ],
  });
}

test("Menu: Enter/Space on a parent item opens its submenu and moves focus in", async () => {
  const container = mountPoint();
  render(menuWithSubmenu, container);
  await flush();

  container.querySelector(".m-menu-trigger").click();
  await flush();

  // Enter and Space reach a <button> as a click with detail 0 — what .click()
  // dispatches. A synthetic keydown would not: untrusted keys don't activate.
  const parent = container.querySelectorAll(".m-menu-list > li > .m-menu-button")[1];
  parent.focus();
  parent.click();
  await flush();

  const first = container.querySelector(".m-menu-list-submenu > li > .m-menu-button");
  assertEqual(parent.getAttribute("aria-expanded"), "true");
  assertEqual(document.activeElement, first, "focus moved to the submenu's first item");

  // Hover had it open already: keyboard activation must not toggle it shut.
  parent.focus();
  parent.click();
  await flush();

  assertEqual(parent.getAttribute("aria-expanded"), "true", "a second Enter keeps the submenu open");
  assertEqual(
    document.activeElement,
    container.querySelector(".m-menu-list-submenu > li > .m-menu-button"),
    "and moves focus in again",
  );
});

test("Menu: a pointer click on a parent item still toggles its submenu", async () => {
  const container = mountPoint();
  render(menuWithSubmenu, container);
  await flush();

  container.querySelector(".m-menu-trigger").click();
  await flush();

  const parent = container.querySelectorAll(".m-menu-list > li > .m-menu-button")[1];
  const pointerClick = () => parent.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));

  pointerClick();
  await flush();
  assertEqual(parent.getAttribute("aria-expanded"), "true");

  pointerClick();
  await flush();
  assertEqual(parent.getAttribute("aria-expanded"), "false");
});

// ── Split stylesheets ───────────────────────────────────────────────────────

// A rule typed into the wrong section of fluxaway-ui.css ships in the wrong
// category file — the splitter is lossless by design and can't tell.
test("split CSS: every .m-dialog rule ships in the overlay stylesheet", async () => {
  const names = ["base", "core", "forms", "overlay", "data", "nav", "theme"];
  const sheets = await Promise.all(
    names.map((name) => fetch(`../dist/fluxaway-ui-${name}.css`).then((response) => response.text())),
  );

  // `base` names .m-dialog once, in the shared reduced-motion list; no other
  // component category has any business styling a dialog.
  const strays = names.filter(
    (name, index) => name !== "overlay" && name !== "base" && sheets[index].includes(".m-dialog"),
  );
  assertEqual(strays.join(", "), "");
  assert(sheets[names.indexOf("overlay")].includes(".m-dialog-header-draggable"), "the drag cursor is in overlay");
});

// ── useForm / usePresence ───────────────────────────────────────────────────

test("useForm: field(name, { type: 'checkbox', onInput }) forwards onInput like the other types", async () => {
  const container = mountPoint();
  const calls = [];
  let form;

  function Widget() {
    form = useForm({ initialValues: { terms: false } });
    return h(Checkbox, {
      ...form.field("terms", { type: "checkbox", onInput: () => calls.push("input"), onChange: () => calls.push("change") }),
      label: "Terms",
    });
  }

  render(Widget, container);
  await flush();

  container.querySelector("input").click();
  await flush();

  assertEqual(calls.join(","), "input,change");
  assertEqual(form.values.terms, true);
});

test("usePresence: list items without key, id or getKey warn once instead of colliding silently", async () => {
  const container = mountPoint();
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (message) => warnings.push(String(message));

  try {
    function Widget() {
      const [tick, setTick] = useState(0);
      const keyless = usePresence([{ label: "a" }, { label: "b" }]);
      const keyed = usePresence([{ id: 1 }, { key: "k" }, "plain"]);
      return h("button", { onClick: () => setTick(tick + 1) }, `${keyless.length}/${keyed.length}`);
    }

    render(Widget, container);
    await flush();
    container.querySelector("button").click();
    await flush();
  } finally {
    console.warn = originalWarn;
  }

  const presence = warnings.filter((message) => message.includes("usePresence"));
  assertEqual(presence.length, 1, "two renders, two keyless items, one warning");
  assertEqual(container.querySelector("button").textContent, "1/3", "keyless items collapse; keyed ones don't");
});

// ── NumberInput ─────────────────────────────────────────────────────────────

test("NumberInput: a typed value passes through while editing and is clamped to min/max on blur", async () => {
  const container = mountPoint();
  let currentValue;
  let blurs = 0;

  function Wrapper() {
    const [value, setValue] = useState(5);
    currentValue = value;
    return h(NumberInput, { label: "Qty", min: 0, max: 10, value, onChange: setValue, onBlur: () => { blurs += 1; } });
  }

  render(Wrapper, container);
  await flush();

  const input = () => container.querySelector("input[type=number]");
  const type = (value) => {
    input().value = value;
    input().dispatchEvent(new Event("input", { bubbles: true }));
  };
  const blur = () => input().dispatchEvent(new FocusEvent("blur"));

  type("250");
  await flush();
  assertEqual(currentValue, 250, "typing is never interrupted");

  blur();
  await flush();
  assertEqual(currentValue, 10, "blur clamps to max");

  type("-4");
  await flush();
  blur();
  await flush();
  assertEqual(currentValue, 0, "blur clamps to min");

  type("7");
  await flush();
  blur();
  await flush();
  assertEqual(currentValue, 7, "an in-range value is left alone");
  assertEqual(blurs, 3, "the caller's onBlur still runs");
});

// ── SwipeableListItem ───────────────────────────────────────────────────────

function pointer(type, target, clientX, extra = {}) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      clientX,
      clientY: 10,
      ...extra,
    }),
  );
}

test("SwipeableListItem: a mouse drag reveals the actions, and the drag's click never reaches the row", async () => {
  const container = mountPoint();
  let rowClicks = 0;

  render(
    () =>
      h(
        SwipeableListItem,
        { actions: [{ label: "Delete" }, { label: "Archive" }], actionWidth: 72 },
        h("button", { type: "button", className: "row", onClick: () => { rowClicks += 1; } }, "Row"),
      ),
    container,
  );
  await flush();

  const track = container.querySelector(".m-swipeable-track");
  const row = container.querySelector(".row");

  pointer("pointerdown", row, 300);
  pointer("pointermove", row, 290);
  pointer("pointermove", row, 180);
  await flush();
  assert(track.classList.contains("m-swipeable-swiping"), "the drag is live");

  pointer("pointerup", row, 180);
  row.click();
  await flush();

  assertEqual(track.style.transform, "translateX(-144px)", "past 40% it snaps fully open");
  assertEqual(rowClicks, 0, "the click that ends the drag is swallowed");

  await new Promise((resolve) => setTimeout(resolve, 0));
  row.click();
  assertEqual(rowClicks, 1, "later clicks go through");
});

test("SwipeableListItem: a press that stays inside the slop is a plain click", async () => {
  const container = mountPoint();
  let rowClicks = 0;

  render(
    () =>
      h(
        SwipeableListItem,
        { actions: [{ label: "Delete" }] },
        h("button", { type: "button", className: "row", onClick: () => { rowClicks += 1; } }, "Row"),
      ),
    container,
  );
  await flush();

  const track = container.querySelector(".m-swipeable-track");
  const row = container.querySelector(".row");

  pointer("pointerdown", row, 300);
  pointer("pointermove", row, 297);
  pointer("pointerup", row, 297);
  row.click();
  await flush();

  assertEqual(rowClicks, 1);
  assertEqual(track.style.transform, "translateX(0px)");
  assert(!track.classList.contains("m-swipeable-swiping"));
});
