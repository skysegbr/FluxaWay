import { h } from "/dist/fluxaway.js";
import { Navbar } from "/dist/fluxaway-components-nav.js";
import { PaletteSwitcher, ThemeToggle } from "/dist/fluxaway-components-theme.js";
import { EXAMPLE_LINKS, NAV_LINKS } from "../../data.js";
import { ExamplesMenu } from "./ExamplesMenu.js";

function Brand({ onClick } = {}) {
  return h(
    "a",
    { className: "nd-header-brand", href: "#/", ariaLabel: "FluxaWay home", onClick },
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
  );
}

function SearchButton({ onClick }) {
  return h(
    "button",
    {
      type: "button",
      className: "nd-header-search",
      ariaLabel: "Search documentation",
      title: "Search documentation",
      onClick,
    },
    h("i", { className: "bi bi-search", ariaHidden: "true" }),
    h("span", { className: "nd-header-search-label" }, "Search"),
    h("kbd", { className: "nd-header-kbd" }, "Ctrl K"),
  );
}

function MobileHeader({ menuOpen, mobileNavigation, onMenuChange, onOpenSearch }) {
  return h(Navbar, {
    brand: h(Brand, { onClick: () => onMenuChange(false) }),
    open: menuOpen,
    onToggle: onMenuChange,
    className: "nd-mobile-navbar",
    ariaLabel: "Documentation",
    actions: h(
      "div",
      { id: "docs-mobile-navigation", className: "nd-mobile-navigation" },
      h(
        "div",
        { className: "nd-mobile-tools" },
        h(SearchButton, { onClick: onOpenSearch }),
        h(
          "div",
          { className: "nd-mobile-preferences" },
          h(PaletteSwitcher, null),
          h(ThemeToggle, null),
        ),
      ),
      mobileNavigation,
    ),
  });
}

export function DocsHeader({
  path,
  onOpenSearch,
  onMenuChange,
  menuOpen,
  mobile,
  mobileNavigation,
}) {
  if (mobile) {
    return h(MobileHeader, { menuOpen, mobileNavigation, onMenuChange, onOpenSearch });
  }

  return h(
    "header",
    { className: "nd-header" },
    h(Brand, null),
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
      h(ExamplesMenu, { items: EXAMPLE_LINKS }),
    ),
    h(SearchButton, { onClick: onOpenSearch }),
    h(
      "div",
      { className: "nd-header-tools" },
      h(PaletteSwitcher, null),
      h(ThemeToggle, null),
    ),
  );
}
