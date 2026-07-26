import { h, useState, useTranslation, useContextMenu } from "/dist/fluxaway.js";
import { Badge, Button } from "/dist/fluxaway-components-core.js";
import { ContextMenu } from "/dist/fluxaway-components-overlay.js";

// Smaller UI helpers: i18n and the context-menu state holder.
export const MISC_HOOK_ENTRIES = [
  {
    slug: "use-translation",
    name: "useTranslation",
    category: "hooks-ui",
    module: "fluxaway.js",
    signature: "const { t } = useTranslation(dict)",
    summary: "Minimal i18n: a dictionary and a t() that interpolates {named} placeholders.",
    demos: [
      {
        id: "use-translation-basic",
        title: "Switching dictionaries",
        stack: true,
        render: () => {
          const [lang, setLang] = useState("en");
          const dicts = {
            en: { hello: "Hello, {name}!", items: "{count} items in the cart" },
            pt: { hello: "Olá, {name}!", items: "{count} itens no carrinho" },
          };
          const { t } = useTranslation(dicts[lang]);

          return h(
            "div",
            { className: "nd-stack" },
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: lang === "en" ? "contained" : "tonal", onClick: () => setLang("en") }, "EN"),
              h(Button, { variant: lang === "pt" ? "contained" : "tonal", onClick: () => setLang("pt") }, "PT"),
            ),
            h(Badge, null, t("hello", { name: "Ada" })),
            h(Badge, null, t("items", { count: 3 })),
          );
        },
      },
    ],
    params: [{ name: "dict", type: "Record<string, string>", default: "{}", description: "Key to template map." }],
    returns: [
      {
        name: "t",
        type: "(key, vars?) => string",
        description: "Looks the key up and fills {placeholders}. An unknown placeholder is left as-is.",
      },
    ],
  },

  {
    slug: "use-context-menu",
    name: "useContextMenu",
    category: "hooks-ui",
    module: "fluxaway.js",
    signature: "const { menu, openMenu, closeMenu } = useContextMenu()",
    summary: "Holds the open flag and pointer coordinates for the ContextMenu component.",
    demos: [
      {
        id: "use-context-menu-basic",
        title: "Right-click anywhere in the box",
        stack: true,
        render: () => {
          const { menu, openMenu, closeMenu } = useContextMenu();

          return h(
            "div",
            { className: "nd-contextzone", onContextMenu: openMenu },
            `menu.open = ${menu.open} · x=${Math.round(menu.x)} y=${Math.round(menu.y)}`,
            h(ContextMenu, {
              open: menu.open,
              x: menu.x,
              y: menu.y,
              onClose: closeMenu,
              items: [{ label: "Rename" }, { divider: true }, { label: "Delete", danger: true }],
            }),
          );
        },
      },
    ],
    returns: [
      { name: "menu", type: "{ open, x, y }", description: "State to spread into ContextMenu." },
      { name: "openMenu", type: "(event) => void", description: "Wire to onContextMenu; it preventDefaults for you." },
      { name: "closeMenu", type: "() => void", description: "Closes the menu." },
    ],
  },
];
