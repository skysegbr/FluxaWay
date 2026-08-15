import { h, useTheme, usePalette, useDesign } from "/dist/fluxaway.js";
import { useMetalTheme } from "/dist/fluxaway-metallic.js";
import { Badge, Button } from "/dist/fluxaway-components-core.js";
import { Menu } from "/dist/fluxaway-components-overlay.js";
import { ThemeToggle, PaletteSwitcher, DesignSwitcher } from "/dist/fluxaway-components-theme.js";

export const THEME_ENTRIES = [
  {
    slug: "theme-toggle",
    name: "ThemeToggle",
    category: "theme",
    module: "fluxaway-components-theme.js",
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
      "Every useTheme() instance stays in sync through a fluxaway:themechange CustomEvent, so several toggles on one page never disagree.",
      "The accessible name flips with the state: \"Switch to dark theme\" / \"Switch to light theme\".",
    ],
  },

  {
    slug: "palette-switcher",
    name: "PaletteSwitcher",
    category: "theme",
    module: "fluxaway-components-theme.js",
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
      "Backed by usePalette(), which also exposes setCustomColor(hex): fluxaway-ui.css derives the hover/soft/secondary/focus shades from --m-primary with color-mix(), so a single hex is enough.",
    ],
  },

  {
    slug: "design-switcher",
    name: "DesignSwitcher",
    category: "theme",
    module: "fluxaway-components-theme.js",
    summary:
      "Swaps the whole visual skin between native FluxaWay, Bootstrap 5 and the experimental " +
      "Metallic system. Same markup and components — only the material language changes.",
    demos: [
      {
        id: "design-switcher-basic",
        title: "FluxaWay, Bootstrap or Metallic",
        note: "This page loads both optional skins, so each selection takes effect immediately.",
        render: () => {
          const { design, designs } = useDesign();
          const { metalTheme, metalThemes, setMetalTheme } = useMetalTheme();

          return h(
            "div",
            { className: "nd-stack" },
            h(DesignSwitcher, null),
            h(Badge, null, `data-design = ${design}`),
            h("p", { className: "nd-demo-note" }, `Available: ${designs.join(", ")}`),
            design === "metallic" && h(
              "div",
              { className: "nd-inline", role: "group", ariaLabel: "Metallic finish" },
              metalThemes.map((name) => h(
                Button,
                {
                  key: name,
                  variant: name === metalTheme ? "contained" : "outline",
                  ariaPressed: String(name === metalTheme),
                  onClick: () => setMetalTheme(name),
                },
                name,
              )),
            ),
          );
        },
      },
      {
        id: "design-switcher-menu",
        title: "Compact header menu",
        note:
          "Use this composition when three exclusive design chips consume too much header space. " +
          "The active design stays visible; Metallic keeps its finish as a separate dependent choice.",
        render: () => {
          const labels = {
            fluxaway: "FluxaWay",
            bootstrap: "Bootstrap",
            metallic: "Metallic",
          };
          const { design, designs, setDesign } = useDesign();
          const { metalTheme, metalThemes, setMetalTheme } = useMetalTheme();

          return h(
            "div",
            { className: "nd-stack" },
            h(
              "div",
              { className: "nd-inline" },
              h(Menu, {
                id: "design-menu-demo",
                trigger: h(
                  Button,
                  {
                    variant: "outline",
                    ariaLabel: `Design: ${labels[design] ?? design}`,
                  },
                  `Design: ${labels[design] ?? design} ▾`,
                ),
                items: designs.map((name) => ({
                  key: name,
                  label: labels[name] ?? name,
                  icon: name === design ? "✓" : undefined,
                  onClick: () => setDesign(name),
                })),
              }),
              design === "metallic" && h(Menu, {
                id: "metal-finish-menu-demo",
                trigger: h(
                  Button,
                  {
                    variant: "outline",
                    ariaLabel: `Metallic finish: ${metalTheme}`,
                  },
                  `${metalTheme} ▾`,
                ),
                items: metalThemes.map((name) => ({
                  key: name,
                  label: name,
                  icon: name === metalTheme ? "✓" : undefined,
                  onClick: () => setMetalTheme(name),
                })),
              }),
            ),
            h(Badge, null, `data-design = ${design}`),
          );
        },
      },
    ],
    props: [
      { name: "className", type: "string", description: "Extra classes for the switcher." },
    ],
    notes: [
      "Optional skins are scoped under their data-design value, so loading them does not alter the default FluxaWay presentation.",
      "Metallic uses useMetalTheme() for its seven material finishes. Light/dark still composes normally; accent palettes remain the responsibility of the FluxaWay and Bootstrap designs.",
      "The compact menu is a composition of Menu, Button and useDesign(); it does not replace DesignSwitcher or add a new prop to it.",
    ],
  },
];
