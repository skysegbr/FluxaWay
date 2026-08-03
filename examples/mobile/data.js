// Static data for the mobile demo screens.

export const FEATURES = [
  { id: 1, icon: "bi-phone", title: "Mobile shell", body: "Navbar, BottomNav, BottomSheet and FAB work together." },
  { id: 2, icon: "bi-grid-3x3-gap", title: "Responsive grid", body: "Twelve mobile-first columns grow naturally into tablet layouts." },
  { id: 3, icon: "bi-moon-stars", title: "Dark mode", body: "System preference and the manual toggle share one source of truth." },
  { id: 4, icon: "bi-hand-index-thumb", title: "Gesture hooks", body: "Swipe, long press, vibration and orientation need no plug-in." },
  { id: 5, icon: "bi-bounding-box", title: "Safe areas", body: "Notches and Dynamic Island insets are built into the shell tokens." },
  { id: 6, icon: "bi-universal-access", title: "Touch targets", body: "Interactive controls preserve comfortable 44px hit areas." },
];

export const ACTIVITY_ITEMS = [
  { id: 1, icon: "bi-check2-circle", text: "Mobile navigation connected", detail: "Navbar and bottom tabs share state", time: "now" },
  { id: 2, icon: "bi-moon-stars", text: "Dark mode synchronized", detail: "Preference stored locally", time: "2m" },
  { id: 3, icon: "bi-grid", text: "Responsive grid measured", detail: "Four breakpoints are ready", time: "5m" },
  { id: 4, icon: "bi-hand-index-thumb", text: "Gesture hooks attached", detail: "Swipe and long press are listening", time: "10m" },
  { id: 5, icon: "bi-shield-check", text: "Safe-area check passed", detail: "Viewport insets applied", time: "15m" },
];

export const EXPLORE_FILTERS = ["all", "ui", "hooks", "css", "mobile"];

export const BREAKPOINTS = [
  { label: "sm >=576px", desc: "Small tablets" },
  { label: "md >=768px", desc: "Tablets" },
  { label: "lg >=992px", desc: "Desktop" },
  { label: "xl >=1200px", desc: "Wide desktop" },
];
