// Nexa Docs — a Bootstrap-style documentation site for the Nexa design system,
// built with Nexa itself. app.js only orchestrates: routing, the shell layout
// and the shared open/closed UI state. Every page's content lives in content/.

import { h, render, useState, useRouter, useEffect } from "/dist/nexa.js";
import { DocsHeader } from "./components/DocsHeader.js";
import { Sidebar } from "./components/Sidebar.js";
import { SearchPalette } from "./components/SearchPalette.js";
import { HomePage } from "./components/HomePage.js";
import { GuidePage } from "./components/GuidePage.js";
import { ComponentPage } from "./components/ComponentPage.js";
import { NotFoundPage } from "./components/NotFoundPage.js";
import { SIDEBAR_GROUPS, entryFor } from "./content/index.js";

function App() {
  const { path, navigate } = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // A new page should start at the top, not wherever the previous one was.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);
  }, [path]);

  const goTo = (target) => {
    setSearchOpen(false);
    navigate(target);
  };

  return h(
    "div",
    { className: "nd-app" },

    h(DocsHeader, {
      path,
      menuOpen,
      onOpenSearch: () => setSearchOpen(true),
      onToggleMenu: () => setMenuOpen(!menuOpen),
    }),

    h(
      "div",
      { className: "nd-shell" },
      h(Sidebar, {
        groups: SIDEBAR_GROUPS,
        path,
        open: menuOpen,
        onNavigate: () => setMenuOpen(false),
      }),
      h("main", { className: "nd-main" }, routeTo(path)),
    ),

    h(SearchPalette, {
      open: searchOpen,
      onOpen: () => setSearchOpen(true),
      onClose: () => setSearchOpen(false),
      onNavigate: goTo,
    }),
  );
}

function routeTo(path) {
  if (path === "/" || path === "") return h(HomePage);
  if (path === "/getting-started") return h(GuidePage);

  if (path.startsWith("/components/")) {
    const entry = entryFor(path.slice("/components/".length));
    if (entry) return h(ComponentPage, { entry });
  }

  return h(NotFoundPage, { path });
}

render(App, document.getElementById("app"));
