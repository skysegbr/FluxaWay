// FluxaWay Docs — a Bootstrap-style documentation site for the FluxaWay design
// system, built with the framework itself. app.js only orchestrates: routing,
// the shell layout and shared UI state. Page content lives in content/.

import {
  h,
  render,
  useState,
  useRouter,
  useRoutes,
  useEffect,
  useRef,
  useMediaQuery,
} from "/dist/fluxaway.js";
import { DocsHeader } from "./components/shell/DocsHeader.js";
import { Sidebar } from "./components/shell/Sidebar.js";
import { SearchPalette } from "./components/shell/SearchPalette.js";
import { SIDEBAR_GROUPS } from "./content/catalog.js";

const ROUTE_FALLBACK = h(
  "div",
  { className: "nd-route-state", ariaLive: "polite" },
  "Loading documentation…",
);

const ROUTES = [
  {
    path: "/",
    lazy: () => import("./components/HomePage.js"),
    css: [
      "./components/HomePage.css",
      "./components/reference/CodeBlock.css",
    ],
    fallback: ROUTE_FALLBACK,
  },
  {
    path: "/getting-started",
    lazy: () => import("./components/GuidePage.js"),
    css: [
      "./components/GuidePage.css",
      "./components/reference/reference.css",
    ],
    fallback: ROUTE_FALLBACK,
  },
  {
    path: "/ai-security",
    lazy: () => import("./components/AiGuidePage.js"),
    css: [
      "./components/AiGuidePage.css",
      "./components/reference/reference.css",
    ],
    fallback: ROUTE_FALLBACK,
  },
  {
    path: "/source/:slug",
    lazy: () => import("./components/SourceDocumentPage.js"),
    css: [
      "/dist/fluxaway-ui-forms.css",
      "/assets/codemirror/codemirror.min.css",
      "./components/SourceDocumentPage.css",
      "./components/reference/reference.css",
    ],
    fallback: ROUTE_FALLBACK,
  },
  {
    path: "/css/:slug",
    lazy: () => import("./components/reference/ReferenceRoute.js"),
    css: [
      "./components/reference/reference.css",
      "./components/reference/CssReference.css",
    ],
    fallback: ROUTE_FALLBACK,
  },
  {
    path: "/components/:slug",
    lazy: () => import("./components/reference/ReferenceRoute.js"),
    css: [
      "/dist/fluxaway-ui-nav.css",
      "./components/reference/reference.css",
    ],
    fallback: ROUTE_FALLBACK,
  },
  {
    path: "/addons/:slug",
    lazy: () => import("./components/reference/ReferenceRoute.js"),
    css: [
      "/dist/fluxaway-ui-nav.css",
      "./components/reference/reference.css",
    ],
    fallback: ROUTE_FALLBACK,
  },
  {
    path: "*",
    lazy: () => import("./components/NotFoundPage.js"),
    css: "./components/reference/ReferencePage.css",
    fallback: ROUTE_FALLBACK,
  },
];

function App() {
  const { path, navigate } = useRouter();
  const page = useRoutes(ROUTES);
  const mobile = useMediaQuery("(max-width: 900px)");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initialRoute = useRef(true);
  const routeHeadingText = useRef(null);

  // A new page starts at the top and moves keyboard/screen-reader focus to its
  // heading. Lazy routes can briefly leave the previous h1 mounted, so observe
  // the main landmark until its heading text actually changes.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);

    const main = document.getElementById("docs-content");
    let focusFrame;
    let observer;

    const captureInitialHeading = () => {
      const heading = main?.querySelector("h1");
      if (!heading) return false;
      routeHeadingText.current = heading.textContent;
      return true;
    };

    if (initialRoute.current) {
      initialRoute.current = false;
      if (!captureInitialHeading() && main) {
        observer = new MutationObserver(() => {
          if (captureInitialHeading()) observer.disconnect();
        });
        observer.observe(main, { childList: true, subtree: true });
      }
      return () => observer?.disconnect();
    }

    const previousHeadingText = routeHeadingText.current;
    const focusNewHeading = () => {
      const heading = main?.querySelector("h1");
      if (!heading || heading.textContent === previousHeadingText) return false;
      routeHeadingText.current = heading.textContent;
      observer?.disconnect();
      focusFrame = requestAnimationFrame(() => {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      });
      return true;
    };

    if (!focusNewHeading() && main) {
      observer = new MutationObserver(focusNewHeading);
      observer.observe(main, { childList: true, subtree: true, characterData: true });
    }

    return () => {
      observer?.disconnect();
      if (focusFrame) cancelAnimationFrame(focusFrame);
    };
  }, [path]);

  const goTo = (target) => {
    setSearchOpen(false);
    navigate(target);
  };

  return h(
    "div",
    { className: "nd-app" },
    h(
      "a",
      {
        className: "nd-skip-link",
        href: "#docs-content",
        onClick: (event) => {
          event.preventDefault();
          document.getElementById("docs-content")?.focus();
        },
      },
      "Skip to content",
    ),

    h(DocsHeader, {
      path,
      mobile,
      menuOpen,
      onOpenSearch: () => {
        setMenuOpen(false);
        setSearchOpen(true);
      },
      onMenuChange: setMenuOpen,
      mobileNavigation: mobile
        ? h(Sidebar, {
            groups: SIDEBAR_GROUPS,
            path,
            mobile: true,
            onNavigate: () => setMenuOpen(false),
          })
        : null,
    }),

    h(
      "div",
      { className: "nd-shell" },
      mobile
        ? null
        : h(Sidebar, {
            groups: SIDEBAR_GROUPS,
            path,
            onNavigate: () => setMenuOpen(false),
          }),
      h("main", { id: "docs-content", className: "nd-main", tabIndex: -1 }, page),
    ),

    h(SearchPalette, {
      open: searchOpen,
      onOpen: () => setSearchOpen(true),
      onClose: () => setSearchOpen(false),
      onNavigate: goTo,
    }),
  );
}

render(App, document.getElementById("app"));
