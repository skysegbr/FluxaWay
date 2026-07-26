import { h, useTheme, usePalette, useDesign } from "/dist/nexa.js";
import { Badge } from "/dist/nexa-components-core.js";
import { ThemeToggle, PaletteSwitcher, DesignSwitcher } from "/dist/nexa-components-theme.js";

export const THEME_ENTRIES = [
  {
    slug: "theme-toggle",
    name: "ThemeToggle",
    category: "theme",
    module: "nexa-components-theme.js",
    summary:
      "The light/dark button. It is standalone — it wraps the useTheme hook, which reads and " +
      "writes localStorage and sets data-theme on <html>. No provider to mount.",
    demos: [
      {
        id: "theme-toggle-basic",
        title: "Flip the whole page",
        note: "This is the same control as the one in the header — both stay in sync.",
        render: () => {
          const { theme } = useTheme();

          return h(
            "div",
            { className: "nd-inline" },
            h(ThemeToggle, null),
            h(Badge, null, `data-theme = ${theme}`),
          );
        },
      },
    ],
    props: [
      { name: "className", type: "string", description: "Extra classes for the button." },
    ],
    notes: [
      "Every useTheme() instance stays in sync through a nexa:themechange CustomEvent, so several toggles on one page never disagree.",
      "The accessible name flips with the state: \"Switch to dark theme\" / \"Switch to light theme\".",
    ],
  },

  {
    slug: "palette-switcher",
    name: "PaletteSwitcher",
    category: "theme",
    module: "nexa-components-theme.js",
    summary:
      "A swatch row over the six preset palettes plus a custom color. Independent of the theme — " +
      "each palette ships a light and a dark variant, so the two compose freely.",
    demos: [
      {
        id: "palette-switcher-basic",
        title: "Recolor the system",
        note: "Pick a swatch: every component on this page follows, including the code highlighting.",
        render: () => {
          const { palette, palettes } = usePalette();

          return h(
            "div",
            { className: "nd-stack" },
            h(PaletteSwitcher, null),
            h(Badge, null, `data-palette = ${palette}`),
            h("p", { className: "nd-demo-note" }, `Available: ${palettes.join(", ")}`),
          );
        },
      },
    ],
    props: [
      { name: "className", type: "string", description: "Extra classes for the swatch row." },
    ],
    notes: [
      "Backed by usePalette(), which also exposes setCustomColor(hex): nexa-ui.css derives the hover/soft/secondary/focus shades from --m-primary with color-mix(), so a single hex is enough.",
    ],
  },

  {
    slug: "design-switcher",
    name: "DesignSwitcher",
    category: "theme",
    module: "nexa-components-theme.js",
    summary:
      "Swaps the whole visual skin between the native Nexa look and a Bootstrap 5 one. Same " +
      "markup, same components — only the stylesheet in charge changes.",
    demos: [
      {
        id: "design-switcher-basic",
        title: "Nexa or Bootstrap",
        note: "Only takes visual effect while dist/nexa-bootstrap.css is loaded — this page loads it.",
        render: () => {
          const { design, designs } = useDesign();

          return h(
            "div",
            { className: "nd-stack" },
            h(DesignSwitcher, null),
            h(Badge, null, `data-design = ${design}`),
            h("p", { className: "nd-demo-note" }, `Available: ${designs.join(", ")}`),
          );
        },
      },
    ],
    props: [
      { name: "className", type: "string", description: "Extra classes for the switcher." },
    ],
    notes: [
      "nexa-bootstrap.css is scoped entirely under [data-design=\"bootstrap\"], so it is inert until this switcher (or a manual attribute) turns it on — loading it costs nothing visually.",
      "Composes with useTheme and usePalette: bootstrap skin, dark theme and the rose palette all apply at once.",
    ],
  },
];
