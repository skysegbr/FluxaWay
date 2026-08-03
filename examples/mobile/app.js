import { Fragment, h, render, useCallback, useState } from "/dist/fluxaway.js";
import { Button, IconButton } from "/dist/fluxaway-components-core.js";
import { BottomSheet, Drawer, Toast } from "/dist/fluxaway-components-overlay.js";
import { AppBar, BottomNav, FAB } from "/dist/fluxaway-components-nav.js";
import { ThemeToggle } from "/dist/fluxaway-components-theme.js";

import { HomeScreen }     from "./components/HomeScreen.js";
import { ExploreScreen }  from "./components/ExploreScreen.js";
import { ActivityScreen } from "./components/ActivityScreen.js";
import { ProfileScreen }  from "./components/ProfileScreen.js";

const TABS = [
  { value: "home", label: "Home", icon: "bi-house-door", description: "Overview and gestures" },
  { value: "explore", label: "Explore", icon: "bi-compass", description: "Responsive building blocks" },
  { value: "activity", label: "Activity", icon: "bi-activity", description: "Recent framework events", badge: 3 },
  { value: "profile", label: "Profile", icon: "bi-person", description: "Device and account status" },
];

const TITLES = {
  home:     "FluxaWay Mobile",
  explore:  "Explore",
  activity: "Activity",
  profile:  "Profile",
};

function App() {
  const [tab, setTab]     = useState("home");
  const [menu, setMenu]   = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState(false);

  const openSheet  = useCallback(() => setSheet(true), []);
  const closeSheet = useCallback(() => setSheet(false), []);

  const showToast = useCallback(() => setToast(true), []);

  const navigate = (nextTab) => {
    setTab(nextTab);
    setMenu(false);
  };

  const bottomItems = TABS.map((item) => ({
    ...item,
    icon: h("i", { className: `bi ${item.icon}`, ariaHidden: "true" }),
  }));

  const screen =
    tab === "home"     ? h(HomeScreen,     { onOpenSheet: openSheet }) :
    tab === "explore"  ? h(ExploreScreen,  null) :
    tab === "activity" ? h(ActivityScreen, null) :
                         h(ProfileScreen,  null);

  return h(
    "div",
    { className: "m-app mob-app" },

    h(AppBar, {
      title: TITLES[tab],
      className: "mob-app-bar",
      leading: h(
        IconButton,
        {
          label: menu ? "Close navigation" : "Open navigation",
          className: `mob-menu-trigger${menu ? " m-navbar-open" : ""}`,
          ariaExpanded: menu ? "true" : "false",
          ariaControls: "mobile-navigation",
          onClick: () => setMenu((open) => !open),
        },
        h("span", { className: "m-navbar-toggle-icon", ariaHidden: "true" }),
      ),
      actions: h(
        Fragment,
        null,
        h(ThemeToggle, null),
        h(
          IconButton,
          { label: "Notification", className: "mob-notification", onClick: showToast },
          h("i", { className: "bi bi-bell", ariaHidden: "true" }),
        ),
      ),
    }),

    h("div", { className: "m-app-bar-offset" }),

    h("main", { className: "m-container mob-main" }, screen),

    h("div", { className: "m-bottom-nav-offset" }),

    h(BottomNav, { items: bottomItems, value: tab, onChange: setTab, className: "mob-bottom-nav" }),

    h(
      FAB,
      { label: "New action", aboveNav: true, className: "mob-fab", onClick: openSheet },
      h("i", { className: "bi bi-plus-lg", ariaHidden: "true" }),
    ),

    h(
      Drawer,
      {
        id: "mobile-navigation",
        open: menu,
        side: "left",
        width: "min(86vw, 340px)",
        title: "FluxaWay Mobile",
        closeLabel: "Close navigation",
        className: "mob-drawer",
        onClose: () => setMenu(false),
      },
      h(
        "div",
        { className: "mob-drawer-intro" },
        h("span", { className: "mob-drawer-mark", ariaHidden: "true" }, "FW"),
        h(
          "div",
          null,
          h("strong", null, "Ready for the road"),
          h("span", null, "A complete mobile shell, no build step."),
        ),
      ),
      h("p", { className: "mob-drawer-label" }, "Navigate"),
      h(
        "nav",
        { className: "mob-drawer-nav", ariaLabel: "Mobile example" },
        TABS.map((item) =>
          h(
            "button",
            {
              key: item.value,
              type: "button",
              className: `mob-drawer-link${tab === item.value ? " is-active" : ""}`,
              ariaCurrent: tab === item.value ? "page" : null,
              onClick: () => navigate(item.value),
            },
            h("i", { className: `bi ${item.icon}`, ariaHidden: "true" }),
            h(
              "span",
              null,
              h("strong", null, item.label),
              h("small", null, item.description),
            ),
            item.badge ? h("span", { className: "mob-drawer-badge" }, item.badge) : null,
          ),
        ),
      ),
      h(
        "div",
        { className: "mob-drawer-tip" },
        h("i", { className: "bi bi-lightning-charge", ariaHidden: "true" }),
        h("span", null, "AppBar, Drawer and BottomNav share the same reactive state."),
      ),
    ),

    h(BottomSheet, { open: sheet, title: "Available actions", onClose: closeSheet },
      h(
        "div",
        { className: "m-stack mob-sheet-actions" },
        h("p", { className: "m-text-muted m-m-0" }, "Bottom sheets keep important actions within thumb reach."),
        h(Button, { variant: "contained", className: "m-button-full", onClick: closeSheet }, "Create workspace"),
        h(Button, { variant: "tonal", className: "m-button-full", onClick: closeSheet }, "Not now"),
      ),
    ),

    h(Toast, {
      open: toast,
      variant: "success",
      title: "Notification",
      message: "Your mobile workspace is up to date.",
      duration: 3000,
      onClose: () => setToast(false),
    }),
  );
}

render(App, document.getElementById("app"));
