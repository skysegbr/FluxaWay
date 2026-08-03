import { Fragment, h, render, useCallback, useState } from "/dist/fluxaway.js";
import { Button, IconButton } from "/dist/fluxaway-components-core.js";
import { BottomSheet, Toast } from "/dist/fluxaway-components-overlay.js";
import { BottomNav, FAB, Navbar } from "/dist/fluxaway-components-nav.js";
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

function App() {
  const [tab, setTab]     = useState("home");
  const [menu, setMenu]   = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState(false);

  const openSheet  = useCallback(() => setSheet(true), []);
  const closeSheet = useCallback(() => setSheet(false), []);

  const showToast = useCallback(() => {
    setToast(true);
    setMenu(false);
  }, []);

  const navigate = (nextTab) => {
    setTab(nextTab);
    setMenu(false);
  };

  const bottomItems = TABS.map((item) => ({
    ...item,
    icon: h("i", { className: `bi ${item.icon}`, ariaHidden: "true" }),
  }));

  const navbarItems = TABS.map((item) => ({
    key: item.value,
    label: item.label,
    icon: h("i", { className: `bi ${item.icon}`, ariaHidden: "true" }),
    active: tab === item.value,
    onClick: (event) => {
      event.preventDefault();
      navigate(item.value);
    },
  }));

  const screen =
    tab === "home"     ? h(HomeScreen,     { onOpenSheet: openSheet }) :
    tab === "explore"  ? h(ExploreScreen,  null) :
    tab === "activity" ? h(ActivityScreen, null) :
                         h(ProfileScreen,  null);

  return h(
    "div",
    { className: "m-app mob-app" },

    h(Navbar, {
      brand: h("strong", { className: "mob-navbar-brand" }, "FluxaWay Mobile"),
      items: navbarItems,
      open: menu,
      onToggle: setMenu,
      className: "mob-navbar",
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

    h("main", { className: "m-container mob-main" }, screen),

    h("div", { className: "m-bottom-nav-offset" }),

    h(BottomNav, { items: bottomItems, value: tab, onChange: setTab, className: "mob-bottom-nav" }),

    h(
      FAB,
      { label: "New action", aboveNav: true, className: "mob-fab", onClick: openSheet },
      h("i", { className: "bi bi-plus-lg", ariaHidden: "true" }),
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
