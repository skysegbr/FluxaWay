const MODULE_BY_CATEGORY = {
  core: "fluxaway-components-core.js",
  forms: "fluxaway-components-forms.js",
  overlay: "fluxaway-components-overlay.js",
  data: "fluxaway-components-data.js",
  nav: "fluxaway-components-nav.js",
  theme: "fluxaway-components-theme.js",
  "hooks-state": "fluxaway.js",
  "hooks-data": "fluxaway.js",
  "hooks-routing": "fluxaway.js",
  "hooks-theming": "fluxaway.js",
  "hooks-ui": "fluxaway.js",
  "hooks-device": "fluxaway.js",
};

function group(category, source, rows) {
  return rows.map(([name, slug]) => ({
    name,
    slug,
    category,
    source,
    module: MODULE_BY_CATEGORY[category],
  }));
}

export const ENTRY_META = [
  ...group("core", "core/buttons", [
    ["Button", "button"], ["IconButton", "icon-button"],
  ]),
  ...group("core", "core/surfaces", [
    ["Card", "card"], ["Divider", "divider"], ["Skeleton", "skeleton"],
    ["EmptyState", "empty-state"],
  ]),
  ...group("core", "core/feedback", [
    ["Alert", "alert"], ["Badge", "badge"], ["Chip", "chip"],
    ["Spinner", "spinner"], ["Progress", "progress"],
  ]),
  ...group("core", "core/identity", [
    ["Avatar", "avatar"], ["AvatarGroup", "avatar-group"], ["FormField", "form-field"],
  ]),
  ...group("forms", "forms/text", [
    ["TextField", "text-field"], ["Textarea", "textarea"], ["NumberInput", "number-input"],
  ]),
  ...group("forms", "forms/choice", [
    ["Select", "select"], ["Checkbox", "checkbox"], ["Radio", "radio"],
    ["RadioGroup", "radio-group"], ["Switch", "switch"],
  ]),
  ...group("forms", "forms/range", [
    ["Slider", "slider"], ["RangeSlider", "range-slider"],
  ]),
  ...group("forms", "forms/advanced", [
    ["Combobox", "combobox"], ["DatePicker", "date-picker"], ["TimePicker", "time-picker"],
    ["FileDropZone", "file-drop-zone"], ["CodeEditor", "code-editor"],
  ]),
  ...group("overlay", "overlay/modals", [
    ["Dialog", "dialog"], ["Drawer", "drawer"], ["BottomSheet", "bottom-sheet"],
  ]),
  ...group("overlay", "overlay/menus", [
    ["Dropdown", "dropdown"], ["Menu", "menu"], ["ContextMenu", "context-menu"],
  ]),
  ...group("overlay", "overlay/anchored", [
    ["Tooltip", "tooltip"], ["Popover", "popover"],
    ["CommandPalette", "command-palette"],
  ]),
  ...group("overlay", "overlay/toasts", [
    ["Toast", "toast"], ["ToastStack", "toast-stack"],
  ]),
  ...group("data", "data/tables", [
    ["Table", "table"], ["DataTable", "data-table"], ["Pagination", "pagination"],
  ]),
  ...group("data", "data/panels", [
    ["Stat", "stat"], ["StatGrid", "stat-grid"], ["TreeView", "tree-view"],
    ["Accordion", "accordion"], ["Collapse", "collapse"],
  ]),
  ...group("nav", "nav/tabs", [
    ["Tabs", "tabs"], ["TabPanel", "tab-panel"], ["Breadcrumb", "breadcrumb"],
    ["Stepper", "stepper"],
  ]),
  ...group("nav", "nav/shell", [
    ["Navbar", "navbar"], ["AppBar", "app-bar"], ["BottomNav", "bottom-nav"],
  ]),
  ...group("nav", "nav/actions", [
    ["FAB", "fab"], ["SpeedDial", "speed-dial"],
    ["SwipeableListItem", "swipeable-list-item"],
  ]),
  ...group("theme", "theme/switchers", [
    ["ThemeToggle", "theme-toggle"], ["PaletteSwitcher", "palette-switcher"],
    ["DesignSwitcher", "design-switcher"],
  ]),
  ...group("hooks-state", "hooks/state", [
    ["useState", "use-state"], ["useReducer", "use-reducer"],
    ["useEffect", "use-effect"], ["useRef", "use-ref"],
  ]),
  ...group("hooks-state", "hooks/memoization", [
    ["useMemo", "use-memo"], ["useCallback", "use-callback"], ["useId", "use-id"],
    ["useErrorBoundary", "use-error-boundary"],
  ]),
  ...group("hooks-data", "hooks/data", [
    ["useForm", "use-form"], ["useFetch", "use-fetch"],
    ["useLocalStorage", "use-local-storage"],
  ]),
  ...group("hooks-data", "hooks/queues", [
    ["useToast", "use-toast"], ["useHistory", "use-history"],
    ["useWebSocket", "use-web-socket"],
  ]),
  ...group("hooks-routing", "hooks/routing", [
    ["useRouter", "use-router"], ["useRoutes", "use-routes"],
  ]),
  ...group("hooks-theming", "hooks/theming", [
    ["useTheme", "use-theme"], ["usePalette", "use-palette"], ["useDesign", "use-design"],
  ]),
  ...group("hooks-ui", "hooks/ui", [
    ["useDebounce", "use-debounce"], ["useThrottle", "use-throttle"],
    ["useMediaQuery", "use-media-query"],
    ["useIntersectionObserver", "use-intersection-observer"], ["useHead", "use-head"],
  ]),
  ...group("hooks-ui", "hooks/lists", [
    ["usePresence", "use-presence"], ["useVirtualList", "use-virtual-list"],
  ]),
  ...group("hooks-ui", "hooks/misc", [
    ["useTranslation", "use-translation"], ["useContextMenu", "use-context-menu"],
  ]),
  ...group("hooks-device", "hooks/device", [
    ["useSwipe", "use-swipe"], ["useLongPress", "use-long-press"],
    ["useNetworkStatus", "use-network-status"], ["useOrientation", "use-orientation"],
    ["useVibrate", "use-vibrate"],
  ]),
  ...group("addons", "addons/motion", [["useTimeline", "fluxaway-motion"]]),
  ...group("addons", "addons/zoom", [["ZoomStage", "zoom-stage"]]),
  ...group("addons", "addons/canvas", [["PipelineCanvas", "pipeline-canvas"]]),
  ...group("addons", "addons/editor", [["FullCodeEditor", "full-code-editor"]]),
];

export const CATEGORIES = [
  { key: "hooks-state", title: "Hooks · State", icon: "bi-braces" },
  { key: "hooks-data", title: "Hooks · Data", icon: "bi-database" },
  { key: "hooks-routing", title: "Hooks · Routing", icon: "bi-signpost" },
  { key: "hooks-theming", title: "Hooks · Theming", icon: "bi-brush" },
  { key: "hooks-ui", title: "Hooks · UI", icon: "bi-magic" },
  { key: "hooks-device", title: "Hooks · Device", icon: "bi-phone" },
  { key: "core", title: "Core", icon: "bi-box-seam" },
  { key: "forms", title: "Forms", icon: "bi-input-cursor-text" },
  { key: "overlay", title: "Overlay", icon: "bi-layers" },
  { key: "data", title: "Data", icon: "bi-table" },
  { key: "nav", title: "Navigation", icon: "bi-signpost-split" },
  { key: "theme", title: "Theme", icon: "bi-palette" },
  { key: "addons", title: "Add-ons", icon: "bi-puzzle" },
];
