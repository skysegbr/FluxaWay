import { h } from "/dist/nexa.js";
import { ThemeToggle, PaletteSwitcher } from "/dist/nexa-components-theme.js";
import { NAV_LINKS } from "../../data.js";

export function DocsHeader({ path, onOpenSearch, onToggleMenu, menuOpen, mobile }) {
  return h(
    "header",
    { className: "nd-header" },
    h(
      "button",
      {
        type: "button",
        className: "nd-header-burger",
        ariaLabel: "Toggle navigation",
        ariaExpanded: menuOpen ? "true" : "false",
        ariaControls: "docs-mobile-navigation",
        onClick: onToggleMenu,
      },
      h("i", { className: "bi bi-list", ariaHidden: "true" }),
    ),

    h(
      "a",
      { className: "nd-header-brand", href: "#/", ariaLabel: "FluxaWay home" },
      h("img", {
        className: "nd-header-logo nd-header-logo-light",
        src: "/assets/brand/fluxaway-logo.svg",
        alt: "",
        width: 139,
        height: 32,
      }),
      h("img", {
        className: "nd-header-logo nd-header-logo-dark",
        src: "/assets/brand/fluxaway-logo-dark.svg",
        alt: "",
        width: 139,
        height: 32,
      }),
    ),

    h(
      "nav",
      { className: "nd-header-nav", ariaLabel: "Sections" },
      NAV_LINKS.map((link) =>
        h(
          "a",
          {
            key: link.href,
            className: `nd-header-link${path.startsWith(link.match ?? link.href.slice(1)) ? " nd-header-link-active" : ""}`,
            href: link.href,
            ...(link.external ? { target: "_blank", rel: "noreferrer" } : {}),
          },
          link.label,
        ),
      ),
    ),

    h(
      "button",
      {
        type: "button",
        className: "nd-header-search",
        ariaLabel: "Search documentation",
        title: "Search documentation",
        onClick: onOpenSearch,
      },
      h("i", { className: "bi bi-search", ariaHidden: "true" }),
      h("span", { className: "nd-header-search-label" }, "Search"),
      h("kbd", { className: "nd-header-kbd" }, "Ctrl K"),
    ),

    h(
      "div",
      { className: "nd-header-tools" },
      mobile ? null : h(PaletteSwitcher, null),
      h(ThemeToggle, null),
    ),
  );
}
