import { h, render } from "../dist/fluxaway.js";
import { BUTTON_EFFECTS, Button, IconButton } from "../dist/fluxaway-components-core.js";
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

test("Button: exposes nine official interaction effects through one prop", async () => {
  const container = mountPoint();

  render(
    () => h(
      "div",
      null,
      BUTTON_EFFECTS.map((effect) =>
        h(Button, { key: effect, variant: "outline", effect }, effect),
      ),
      h(Button, { effect: "toString" }, "fallback"),
    ),
    container,
  );
  await flush();

  assertEqual(BUTTON_EFFECTS.length, 9);
  BUTTON_EFFECTS.forEach((effect) => {
    const button = container.querySelector(`.m-button-effect-${effect}`);
    assert(button, `${effect} receives its public effect class`);
    assert(button.classList.contains("m-button-effect"));
    assertEqual(button.querySelector(".m-button-label").textContent, effect);
  });
  assert(
    !container.lastElementChild.classList.contains("m-button-effect"),
    "unknown effects are ignored without leaking a class",
  );
});

test("Button effects keep their surface out of the generic hover cascade", () => {
  [
    ".m-button:hover:not(.m-button-effect)",
    ".m-button-contained:hover:not(.m-button-effect)",
    ".m-button-tonal:hover:not(.m-button-effect)",
    ".m-button-danger:hover:not(.m-button-effect)",
    ".m-button-outline:hover:not(:disabled):not(.m-button-effect)",
  ].forEach((selector) => assert(cssRule(selector), `${selector} must exclude effect buttons`));

  const phase = cssRule(".m-button.m-button-effect-phase");
  assert(phase.style.backgroundPosition, "Phase defines a resting gradient position");
  assert(
    phase.style.transition.includes("background-position"),
    "Phase must animate its gradient instead of replacing it on hover",
  );
});

test("FluxaWay typography: keeps interface text readable without flattening hierarchy", () => {
  const root = cssRule(":root");
  const body = cssRule("body");
  const button = cssRule(".m-button");
  const title = cssRule(".m-title");

  assert(root.style.getPropertyValue("--m-font").includes("Segoe UI Variable"));
  assertEqual(body.style.fontKerning, "normal");
  assertEqual(body.style.fontSynthesis, "none");
  assertEqual(button.style.fontWeight, "600", "actions use a clear interface weight");
  assertEqual(title.style.fontWeight, "700", "titles retain a stronger hierarchy");
  assert(parseFloat(title.style.letterSpacing) < 0, "display text keeps compact tracking");
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
  const hover = cssRule(".m-button-outline:hover:not(:disabled):not(.m-button-effect)");
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

// Text on a solid --m-primary / --m-danger fill. Those colors flip from dark (light
// theme) to light (dark theme), so a fixed white read 1.67–2.77:1 in dark. Plain
// class-bearing elements are enough here: this is the stylesheet's contract.

const ON_COLOR_PALETTES = ["default", "violet", "rose", "blue", "amber", "emerald"];

function onColorSamples() {
  const sample = (label, tag, className, wrapperClass) => {
    const node = h(tag, { className, dataset: { contrastSample: label } }, "Aa");
    return wrapperClass ? h("div", { className: wrapperClass }, node) : node;
  };
  const probe = (label, background, color) =>
    h("span", { dataset: { contrastSample: label }, style: { background, color } }, "Aa");

  return [
    h(Button, { variant: "contained", dataset: { contrastSample: "Button contained" } }, "Aa"),
    h(Button, { variant: "danger", dataset: { contrastSample: "Button danger" } }, "Aa"),
    sample("Chip active", "span", "m-chip m-chip-active"),
    sample("FAB", "button", "m-fab"),
    // Gradient from --m-primary-hover to --m-primary: both ends are measured by
    // other samples, so this one only has to use the same text token.
    h("span", { className: "m-card-pricing-badge", dataset: { onPrimaryGradient: "pricing badge" } }, "Aa"),
    sample("card reveal trigger", "button", "m-card-reveal-trigger"),
    sample("Pagination active", "button", "m-pagination-item m-pagination-item-active"),
    sample("page button active", "button", "m-page-btn m-page-btn-active"),
    sample("Tabs pills active", "button", "m-tab m-tab-active", "m-tabs-pills"),
    sample("Stepper done", "span", "m-step-indicator", "m-step-done"),
    sample("DatePicker selected day", "button", "m-datepicker-day m-datepicker-day-selected"),
    sample("BottomNav badge", "span", "m-bottom-nav-badge"),
    sample("Swipeable action", "button", "m-swipeable-action"),
    probe("primary hover fill", "var(--m-primary-hover)", "var(--m-on-primary)"),
    probe("danger hover fill", "var(--m-danger-hover)", "var(--m-on-danger)"),
  ];
}

test("on-primary / on-danger: every palette in both themes keeps AA text on solid fills", async () => {
  const container = mountPoint();

  render(
    () =>
      h(
        "div",
        null,
        ["light", "dark"].flatMap((theme) =>
          ON_COLOR_PALETTES.map((palette) =>
            h(
              "div",
              { key: `${theme}-${palette}`, dataset: { theme, palette, scope: `${theme}/${palette}` } },
              onColorSamples(),
            ),
          ),
        ),
        // A wrapper carrying only data-palette takes that palette's light variant even
        // on a dark page — the dark selector needs both attributes on one element.
        h(
          "div",
          { dataset: { theme: "dark" } },
          ON_COLOR_PALETTES.filter((palette) => palette !== "default").map((palette) =>
            h("div", { key: palette, dataset: { palette, scope: `dark page > ${palette} wrapper` } }, onColorSamples()),
          ),
        ),
      ),
    container,
  );
  await flush();

  const scopes = [...container.querySelectorAll("[data-scope]")];
  assertEqual(scopes.length, 17, "six palettes in two themes, plus five palette-only wrappers");

  const failures = [];
  for (const scope of scopes) {
    const samples = [...scope.querySelectorAll("[data-contrast-sample]")];
    assertEqual(samples.length, 14, `${scope.dataset.scope} renders every sample`);

    const onPrimary = getComputedStyle(scope.querySelector('[data-contrast-sample="primary hover fill"]')).color;
    for (const node of scope.querySelectorAll("[data-on-primary-gradient]")) {
      assertEqual(
        getComputedStyle(node).color,
        onPrimary,
        `${scope.dataset.scope} ${node.dataset.onPrimaryGradient} uses --m-on-primary`,
      );
    }

    for (const node of samples) {
      const style = getComputedStyle(node);
      // A stale class name would leave the fill transparent and the check meaningless.
      assert(
        style.backgroundColor !== "rgba(0, 0, 0, 0)",
        `${scope.dataset.scope} ${node.dataset.contrastSample}: no solid fill resolved`,
      );
      const ratio = contrast(style.color, style.backgroundColor);
      if (ratio < 4.5) {
        failures.push(`${scope.dataset.scope} ${node.dataset.contrastSample} = ${ratio.toFixed(2)}:1`);
      }
    }
  }

  assertEqual(failures.length, 0, `below WCAG AA 4.5:1 — ${failures.join("; ")}`);
});

test("on-primary / on-danger: every rule that sets a fill color also sets its text token", async () => {
  // The invariant app authors are told to follow, held by the stylesheet itself. It also
  // covers the @media (prefers-color-scheme: dark) block, which a page test cannot switch on.
  const missing = [];
  const counts = { "--m-primary": 0, "--m-danger": 0 };
  const pairs = { "--m-primary": "--m-on-primary", "--m-danger": "--m-on-danger" };
  const visit = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules && !rule.style) visit(rule.cssRules);
      if (!rule.style || !rule.selectorText) continue;
      for (const [fill, text] of Object.entries(pairs)) {
        if (!rule.style.getPropertyValue(fill)) continue;
        counts[fill] += 1;
        if (!rule.style.getPropertyValue(text)) missing.push(`${rule.selectorText} sets ${fill} without ${text}`);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    if (sheet.href && sheet.href.endsWith("/dist/fluxaway-ui.css")) visit(sheet.cssRules);
  }

  assertEqual(counts["--m-primary"], 19, "4 theme scopes + 5 palettes in 3 scopes each");
  assertEqual(counts["--m-danger"], 4, "4 theme scopes");
  assertEqual(missing.length, 0, missing.join("; "));
});

// Button with `href` is a real link: it must keep link behavior (new tab, copy
// address, works without JS) while looking exactly like the <button> form.

test("Button href: renders an anchor with the same classes, and no button-only attributes", async () => {
  const container = mountPoint();

  render(
    () =>
      h(
        "div",
        null,
        h(Button, { id: "as-button", variant: "contained" }, "Buy"),
        h(Button, { id: "as-link", variant: "contained", href: "#pricing" }, "Buy"),
        h(Button, { id: "as-blank", href: "https://example.com", target: "_blank" }, "Docs"),
        h(Button, { id: "as-blank-rel", href: "https://example.com", target: "_blank", rel: "author" }, "Docs"),
        h(IconButton, { id: "as-icon-link", label: "Close", href: "#top" }, "x"),
      ),
    container,
  );
  await flush();

  const button = container.querySelector("#as-button");
  const link = container.querySelector("#as-link");

  assertEqual(button.tagName, "BUTTON");
  assertEqual(button.getAttribute("type"), "button");
  assertEqual(link.tagName, "A");
  assertEqual(link.getAttribute("href"), "#pricing", "the URL is passed through untouched");
  assertEqual(link.className, button.className, "both forms carry the same classes");
  assertEqual(link.hasAttribute("type"), false, "type is a <button> attribute");
  assertEqual(link.hasAttribute("role"), false, "an anchor with href already is a link");
  assertEqual(link.hasAttribute("aria-disabled"), false);

  const a = link.getBoundingClientRect();
  const b = button.getBoundingClientRect();
  assert(Math.abs(a.width - b.width) < 0.6 && Math.abs(a.height - b.height) < 0.6, "both forms are the same size");

  assertEqual(container.querySelector("#as-blank").getAttribute("rel"), "noopener noreferrer");
  assertEqual(container.querySelector("#as-blank-rel").getAttribute("rel"), "author", "an explicit rel is kept");

  const iconLink = container.querySelector("#as-icon-link");
  assertEqual(iconLink.tagName, "A", "IconButton forwards href");
  assertEqual(iconLink.getAttribute("aria-label"), "Close");
});

test("Button href: a disabled link drops its href, leaves the tab order and says so", async () => {
  const container = mountPoint();

  render(
    () => h(Button, { id: "link-off", variant: "contained", href: "#pricing", disabled: true }, "Buy"),
    container,
  );
  await flush();

  const link = container.querySelector("#link-off");
  assertEqual(link.tagName, "A");
  assertEqual(link.hasAttribute("href"), false, "nothing left to navigate to");
  assertEqual(link.hasAttribute("disabled"), false, "disabled is not an anchor attribute");
  assertEqual(link.getAttribute("role"), "link", "without href an <a> loses its implicit role");
  assertEqual(link.getAttribute("aria-disabled"), "true");

  link.focus();
  assert(document.activeElement !== link, "a disabled link cannot take focus");
  assertEqual(getComputedStyle(link).pointerEvents, "none");
});
