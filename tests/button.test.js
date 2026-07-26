import { h, render } from "../dist/fluxaway.js";
import { Button } from "../dist/fluxaway-components-core.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

function cssRule(selector) {
  const visit = (rules) => {
    for (const rule of rules) {
      if (rule.selectorText === selector) return rule;
      if (rule.cssRules) {
        const nested = visit(rule.cssRules);
        if (nested) return nested;
      }
    }
    return null;
  };

  for (const sheet of document.styleSheets) {
    const found = visit(sheet.cssRules);
    if (found) return found;
  }
  return null;
}

function rgb(value) {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) {
    throw new Error(`expected an rgb color, got ${value}`);
  }
  return channels;
}

function contrast(foreground, background) {
  const luminance = (color) => {
    const linear = rgb(color).map((channel) => {
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

test("Button: maps every variant without regressing the existing classes", async () => {
  const container = mountPoint();
  const variants = ["text", "contained", "tonal", "danger", "outline", "outlined"];

  render(
    () =>
      h(
        "div",
        null,
        variants.map((variant) => h(Button, { key: variant, variant }, variant)),
      ),
    container,
  );
  await flush();

  const buttons = Array.from(container.querySelectorAll("button"));
  assertEqual(buttons.length, variants.length);
  assertEqual(buttons[0].className, "m-button");
  assert(buttons[1].classList.contains("m-button-contained"));
  assert(buttons[2].classList.contains("m-button-tonal"));
  assert(buttons[3].classList.contains("m-button-danger"));
  assert(buttons[4].classList.contains("m-button-outline"));
  assert(buttons[5].classList.contains("m-button-outline"), "outlined remains a compatibility alias");
});

test("Button outline: renders text, leading icons, DOM props and custom classes", async () => {
  const container = mountPoint();

  render(
    () =>
      h(
        "div",
        null,
        h(
          Button,
          {
            id: "clear",
            variant: "outline",
            icon: "close",
            type: "reset",
            className: "search-clear",
            ariaLabel: "Clear active filters",
          },
          "Clear",
        ),
        h(
          Button,
          {
            id: "custom-icon",
            variant: "outline",
            icon: h("i", { className: "test-icon" }, "!"),
          },
          "Review",
        ),
      ),
    container,
  );
  await flush();

  const button = container.querySelector("#clear");
  assert(button.classList.contains("m-button-outline"));
  assert(button.classList.contains("m-button-with-icon"));
  assert(button.classList.contains("search-clear"));
  assertEqual(button.type, "reset");
  assertEqual(button.getAttribute("aria-label"), "Clear active filters");
  assertEqual(button.querySelector(".m-button-icon").textContent, "×");
  assertEqual(button.querySelector(".m-button-icon").getAttribute("aria-hidden"), "true");
  assertEqual(button.textContent, "×Clear");
  assert(container.querySelector("#custom-icon .test-icon"), "accepts a VNode icon");
});

test("Button accent: adds a token-driven leading border and icon emphasis", async () => {
  const container = mountPoint();

  render(
    () => h(
      Button,
      {
        variant: "outline",
        accent: true,
        icon: h("i", { className: "test-kanban-icon" }),
      },
      "Kanban",
    ),
    container,
  );
  await flush();

  const button = container.querySelector("button");
  const accent = cssRule(".m-button-accent");
  const accentIcon = cssRule(".m-button-accent .m-button-icon");

  assert(button.classList.contains("m-button-outline"));
  assert(button.classList.contains("m-button-accent"));
  assert(accent, "accent modifier rule exists");
  assertEqual(accent.style.borderInlineStartWidth, "var(--m-space-1)");
  assertEqual(accent.style.borderInlineStartColor, "var(--m-primary)");
  assertEqual(accent.style.paddingInlineStart, "var(--m-space-3)");
  assert(accentIcon, "accent icon rule exists");
  assertEqual(accentIcon.style.color, "var(--m-primary)");
});

test("Button outline: preserves click/keyboard events and native disabled behavior", async () => {
  const container = mountPoint();
  let clicks = 0;
  let keys = 0;

  render(
    () =>
      h(
        "div",
        null,
        h(Button, {
          id: "enabled-outline",
          variant: "outline",
          onClick: () => { clicks += 1; },
          onKeyDown: (event) => { if (event.key === "Enter") keys += 1; },
        }, "Clear"),
        h(Button, {
          id: "disabled-outline",
          variant: "outline",
          disabled: true,
          onClick: () => { clicks += 1; },
        }, "Clear"),
      ),
    container,
  );
  await flush();

  const enabled = container.querySelector("#enabled-outline");
  const disabled = container.querySelector("#disabled-outline");

  enabled.focus();
  assertEqual(document.activeElement, enabled, "native button is keyboard-focusable");
  enabled.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  enabled.click();
  disabled.click();

  assertEqual(keys, 1, "keyboard events are forwarded");
  assertEqual(clicks, 1, "disabled native button does not dispatch click");
  assertEqual(disabled.disabled, true);
  assertEqual(disabled.getAttribute("disabled"), "");
  assertEqual(getComputedStyle(disabled).cursor, "not-allowed");
});

test("Button: icon-only usage requires and exposes an accessible name", async () => {
  let error;
  try {
    Button({ variant: "outline", icon: "close" });
  } catch (caught) {
    error = caught;
  }
  assert(error instanceof TypeError, "missing accessible name is rejected");
  assert(error.message.includes("ariaLabel"));

  const container = mountPoint();
  render(
    () => h(Button, {
      variant: "outline",
      icon: "close",
      ariaLabel: "Close filter panel",
    }),
    container,
  );
  await flush();

  const button = container.querySelector("button");
  assert(button.classList.contains("m-button-icon-only"));
  assertEqual(button.getAttribute("aria-label"), "Close filter panel");
  assertEqual(button.textContent, "×");
});

test("Button outline: focus, hover and disabled rules use FluxaWay theme tokens", () => {
  const focus = cssRule(".m-button:focus-visible");
  const outlineFocus = cssRule(".m-button-outline:focus-visible");
  const hover = cssRule(".m-button-outline:hover:not(:disabled)");
  const disabled = cssRule(".m-button-outline:disabled");

  assert(focus, "focus-visible rule exists");
  assert(focus.style.outline.includes("var(--m-focus)"), "focus ring uses --m-focus");
  assert(outlineFocus, "outline variant has a contrast-enhanced focus rule");
  assert(outlineFocus.style.outlineColor.includes("var(--m-focus)"));
  assert(outlineFocus.style.outlineColor.includes("var(--m-text)"));
  assert(hover, "enabled hover rule exists");
  assertEqual(hover.style.borderColor, "var(--m-primary)");
  assertEqual(hover.style.background, "var(--m-surface-raised)");
  assert(disabled, "disabled rule exists");
  assertEqual(disabled.style.color, "var(--m-text-muted)");
  assertEqual(disabled.style.background, "var(--m-surface-muted)");
});

test("Button outline: light and dark themes resolve token colors with AA text contrast", async () => {
  const container = mountPoint();

  render(
    () =>
      h(
        "div",
        null,
        h(
          "div",
          { id: "light-theme", dataset: { theme: "light" }, style: { background: "var(--m-bg)" } },
          h(Button, { variant: "outline" }, "Clear filters"),
        ),
        h(
          "div",
          { id: "dark-theme", dataset: { theme: "dark" }, style: { background: "var(--m-bg)" } },
          h(Button, { variant: "outline" }, "Clear filters"),
        ),
      ),
    container,
  );
  await flush();

  const lightRoot = container.querySelector("#light-theme");
  const darkRoot = container.querySelector("#dark-theme");
  const lightButton = lightRoot.querySelector("button");
  const darkButton = darkRoot.querySelector("button");
  const lightStyle = getComputedStyle(lightButton);
  const darkStyle = getComputedStyle(darkButton);

  assertEqual(lightStyle.borderColor, "rgb(203, 214, 224)");
  assertEqual(darkStyle.borderColor, "rgb(51, 65, 85)");
  assert(
    contrast(lightStyle.color, getComputedStyle(lightRoot).backgroundColor) >= 4.5,
    "light theme text meets WCAG AA",
  );
  assert(
    contrast(darkStyle.color, getComputedStyle(darkRoot).backgroundColor) >= 4.5,
    "dark theme text meets WCAG AA",
  );
});
