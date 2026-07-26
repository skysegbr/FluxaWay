import { h, useState, useTheme, usePalette, useDesign } from "/dist/fluxaway.js";
import { Badge, Button, Card } from "/dist/fluxaway-components-core.js";

export const THEMING_HOOK_ENTRIES = [
  {
    slug: "use-theme",
    name: "useTheme",
    category: "hooks-theming",
    module: "fluxaway.js",
    signature: "const { theme, setTheme, toggleTheme } = useTheme()",
    summary:
      "Light/dark, without a provider. It reads and writes localStorage(\"nexa-theme\") and sets " +
      "data-theme on <html> directly.",
    demos: [
      {
        id: "use-theme-basic",
        title: "Toggling the page",
        stack: true,
        render: () => {
          const { theme, setTheme, toggleTheme } = useTheme();

          return h(
            "div",
            { className: "nd-stack" },
            h(Badge, null, `theme = ${theme}`),
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: "contained", onClick: toggleTheme }, "Toggle"),
              h(Button, { variant: "tonal", onClick: () => setTheme("light") }, "Force light"),
              h(Button, { variant: "tonal", onClick: () => setTheme("dark") }, "Force dark"),
            ),
          );
        },
      },
    ],
    returns: [
      { name: "theme", type: '"light" | "dark"', description: "The active theme." },
      { name: "setTheme", type: "(theme) => void", description: "Sets it explicitly." },
      { name: "toggleTheme", type: "() => void", description: "Flips between the two." },
    ],
    notes: [
      "Several useTheme() instances stay in sync through a nexa:themechange CustomEvent — the header toggle and this demo never disagree.",
      "It reads a browser global during render, so it cannot run in a non-browser SSR pass.",
    ],
  },

  {
    slug: "use-palette",
    name: "usePalette",
    category: "hooks-theming",
    module: "fluxaway.js",
    signature: "const { palette, palettes, setPalette, customColor, setCustomColor } = usePalette()",
    summary:
      "Six preset accent palettes plus any custom hex. Independent of the theme: each palette ships " +
      "a light and a dark variant, so the two compose freely.",
    demos: [
      {
        id: "use-palette-basic",
        title: "Recoloring from a hex",
        stack: true,
        note: "fluxaway-ui.css derives the hover/soft/secondary/focus shades from --m-primary with color-mix(), so one hex is enough.",
        render: () => {
          const { palette, palettes, setPalette, setCustomColor } = usePalette();
          const [hex, setHex] = useState("#ff6600");

          return h(
            "div",
            { className: "nd-stack" },
            h(Badge, null, `palette = ${palette}`),
            h(
              "div",
              { className: "nd-inline" },
              palettes.map((name) =>
                h(Button, { key: name, variant: name === palette ? "contained" : "tonal", onClick: () => setPalette(name) }, name),
              ),
            ),
            h(
              "div",
              { className: "nd-inline" },
              h("input", {
                type: "color",
                value: hex,
                ariaLabel: "Custom accent color",
                onInput: (event) => setHex(event.target.value),
              }),
              h(Button, { variant: "outline", accent: true, onClick: () => setCustomColor(hex) }, "Apply custom"),
            ),
          );
        },
      },
    ],
    returns: [
      {
        name: "palette",
        type: '"default" | "violet" | "rose" | "blue" | "amber" | "emerald" | "custom"',
        description: "Active palette.",
      },
      { name: "palettes", type: "string[]", description: "The full list — build a picker from it." },
      { name: "setPalette", type: "(name) => void", description: "No-op if the name is not in palettes." },
      { name: "customColor", type: "string", description: "The stored custom hex, if any." },
      {
        name: "setCustomColor",
        type: "(hex) => void",
        description: 'Accepts "#rgb" or "#rrggbb", switches palette to "custom" and writes --m-primary inline on <html>. Invalid hex is ignored.',
      },
    ],
  },

  {
    slug: "use-design",
    name: "useDesign",
    category: "hooks-theming",
    module: "fluxaway.js",
    signature: "const { design, designs, setDesign } = useDesign()",
    summary:
      "Swaps the visual skin between the native FluxaWay look and a Bootstrap 5 one, by setting " +
      "data-design on <html>.",
    demos: [
      {
        id: "use-design-basic",
        title: "Two skins, one markup",
        stack: true,
        render: () => {
          const { design, designs, setDesign } = useDesign();

          return h(
            "div",
            { className: "nd-stack" },
            h(Badge, null, `design = ${design}`),
            h(
              "div",
              { className: "nd-inline" },
              designs.map((name) =>
                h(Button, { key: name, variant: name === design ? "contained" : "tonal", onClick: () => setDesign(name) }, name),
              ),
            ),
            h(Card, { padded: true }, h("p", { style: { margin: 0 } }, "This card follows the active skin.")),
          );
        },
      },
    ],
    returns: [
      { name: "design", type: '"nexa" | "bootstrap"', description: "Active skin." },
      { name: "designs", type: "string[]", description: "The full list." },
      { name: "setDesign", type: "(name) => void", description: "Switches skin and persists the choice." },
    ],
    notes: [
      '"bootstrap" only takes visual effect when dist/fluxaway-bootstrap.css is also loaded. That stylesheet is scoped under [data-design="bootstrap"], so it is inert until then.',
      "Composes freely with useTheme and usePalette — bootstrap skin, dark theme and the rose palette all apply at once.",
    ],
  },
];
