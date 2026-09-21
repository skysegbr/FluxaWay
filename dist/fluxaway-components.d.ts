/*!
 * FluxaWay — TypeScript declarations for the component library.
 * This app's frontend uses the FluxaWay framework (NOT React):
 * https://github.com/skysegbr/FluxaWay — full AI reference:
 * https://raw.githubusercontent.com/skysegbr/FluxaWay/main/docs/AI_SPEC.md
 */
/**
 * Type declarations for /dist/fluxaway-components.js
 *
 * All 61 component functions. Signatures derived from the actual source.
 * The runtime is split into six category modules (fluxaway-components-core.js,
 * -forms.js, -overlay.js, -data.js, -nav.js, -theme.js) re-exported by the
 * fluxaway-components.js barrel; each category ships its own .d.ts re-exporting
 * the matching subset of these declarations.
 */

import type { VNode, Ref, ToastItem } from "./fluxaway.js";

/** Convenience alias — every component accepts arbitrary extra props via spread. */
type ExtraProps = Record<string, unknown>;

// ── Button ─────────────────────────────────────────────────────────────────

export declare const BUTTON_EFFECTS: readonly [
  "reflection",
  "edge",
  "split",
  "aperture",
  "charge",
  "corners",
  "pulse",
  "phase",
  "conductor",
];

export type ButtonEffect = (typeof BUTTON_EFFECTS)[number];

export declare function Button(props?: {
  variant?: "text" | "contained" | "tonal" | "danger" | "outline" | "outlined";
  icon?: VNode;
  accent?: boolean;
  effect?: ButtonEffect;
  className?: string;
  /** Ignored when `href` is set. */
  type?: "button" | "submit" | "reset";
  /**
   * Renders `<a>` instead of `<button>`, with the same classes. Passed through
   * untouched — wrap untrusted URLs in `safeUrl()`.
   */
  href?: string;
  /** With `href`. `"_blank"` gets `rel="noopener noreferrer"` unless `rel` is given. */
  target?: string;
  rel?: string;
  /** On a link this drops the `href` and sets `role="link"` + `aria-disabled="true"`. */
  disabled?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── IconButton ─────────────────────────────────────────────────────────────

export declare function IconButton(props?: {
  label: string;
  variant?: "text" | "contained" | "tonal" | "danger" | "outline" | "outlined";
  effect?: ButtonEffect;
  /** Forwarded to `Button`: renders `<a>` instead of `<button>`. */
  href?: string;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Card ───────────────────────────────────────────────────────────────────

export declare function Card(props?: {
  className?: string;
  padded?: boolean;
  children?: VNode;
} & ExtraProps): VNode;

// ── Alert ──────────────────────────────────────────────────────────────────

export declare function Alert(props?: {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Badge ──────────────────────────────────────────────────────────────────

export declare function Badge(props?: {
  /** Status variants are classes: `"m-badge-success"`, `"m-badge-warning"` or `"m-badge-danger"`. */
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Chip ───────────────────────────────────────────────────────────────────

/**
 * A static label, or — when `onClick` is given — a toggle rendered as
 * `<button type="button" aria-pressed>`, reachable and operable by keyboard.
 * Passing your own `role` (e.g. `"radio"` with `ariaChecked`) turns `aria-pressed` off.
 */
export declare function Chip(props?: {
  /** Filled style; announced as `aria-pressed` when the chip is a button. */
  active?: boolean;
  /** Makes the chip a `<button>`. Without it the chip is a non-focusable `<span>`. */
  onClick?: (event: MouseEvent) => void;
  /** Only meaningful together with `onClick`. */
  disabled?: boolean;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── FormField ──────────────────────────────────────────────────────────────

/**
 * Label + control + help/error wrapper. Without `id`, a single labelable child
 * (`input`, `select`, `textarea`, `button`…) is wired automatically: it keeps its
 * own `id` or receives a generated one, and gets `aria-describedby`/`aria-invalid`.
 * With any other child, pass the same `id` here and to the control.
 */
export declare function FormField(props?: {
  /** The control's id — links the label's `for` and names the help/error elements. */
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── TextField ──────────────────────────────────────────────────────────────

export declare function TextField(props?: {
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

// ── Textarea ───────────────────────────────────────────────────────────────

export declare function Textarea(props?: {
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

// ── Select ─────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export declare function Select(props?: {
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  options?: SelectOption[];
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  className?: string;
  inputClassName?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Checkbox ───────────────────────────────────────────────────────────────

export declare function Checkbox(props?: {
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

// ── Tabs ───────────────────────────────────────────────────────────────────

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export declare function Tabs(props?: {
  value?: string;
  onChange?: (value: string) => void;
  items?: TabItem[];
  className?: string;
}): VNode;

// ── Spinner ────────────────────────────────────────────────────────────────

export declare function Spinner(props?: {
  label?: string;
  className?: string;
} & ExtraProps): VNode;

// ── Dialog ─────────────────────────────────────────────────────────────────

export declare function Dialog(props?: {
  open?: boolean;
  id?: string;
  title?: string;
  closeLabel?: string;
  onClose?: () => void;
  actions?: VNode;
  size?: "sm" | "lg" | "xl" | string;
  draggable?: boolean;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── EmptyState ─────────────────────────────────────────────────────────────

export declare function EmptyState(props?: {
  title?: string;
  description?: string;
  action?: VNode;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Table ──────────────────────────────────────────────────────────────────

export interface TableColumn<R = Record<string, unknown>> {
  key: string;
  header: string;
  align?: "left" | "right";
  sortable?: boolean;
  render?: (row: R, index: number) => VNode;
}

export interface TableSort {
  key: string | null;
  dir: "asc" | "desc";
}

export declare function Table<R extends Record<string, unknown> = Record<string, unknown>>(
  props?: {
    columns?: TableColumn<R>[];
    rows?: R[];
    getRowKey?: (row: R, index: number) => string | number;
    emptyTitle?: string;
    emptyDescription?: string;
    sortable?: boolean;
    defaultSort?: TableSort;
    onSort?: (sort: TableSort) => void;
    className?: string;
  } & ExtraProps,
): VNode;

// ── Toast ──────────────────────────────────────────────────────────────────

export declare function Toast(props?: {
  open?: boolean;
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: VNode;
  /** Accessible name of the dismiss button. Default `"Dismiss"`. */
  closeLabel?: string;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Progress ───────────────────────────────────────────────────────────────

export declare function Progress(props?: {
  value?: number;
  max?: number;
  label?: string;
  className?: string;
} & ExtraProps): VNode;

// ── Drawer ─────────────────────────────────────────────────────────────────

export declare function Drawer(props?: {
  open?: boolean;
  id?: string;
  side?: "left" | "right";
  width?: number | string;
  title?: string;
  closeLabel?: string;
  onClose?: () => void;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Dropdown ───────────────────────────────────────────────────────────────

export interface DropdownItem {
  key?: string | number;
  label?: string;
  icon?: VNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export declare function Dropdown(props?: {
  id?: string;
  trigger?: VNode;
  items?: DropdownItem[];
  align?: "left" | "right";
  className?: string;
} & ExtraProps): VNode;

// ── Tooltip ────────────────────────────────────────────────────────────────

export declare function Tooltip(props?: {
  content?: string;
  position?: "top" | "bottom" | "left" | "right";
  /** Prefix for the generated tooltip bubble id (`${id}-bubble`). Defaults to "fluxaway-tooltip". */
  id?: string;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Pagination ─────────────────────────────────────────────────────────────

export declare function Pagination(props?: {
  page?: number;
  total?: number;
  siblings?: number;
  onChange?: (page: number) => void;
  /** Accessible name of the nav landmark. Default `"Pagination"`. */
  ariaLabel?: string;
  /** Default `"Previous page"`. */
  previousLabel?: string;
  /** Default `"Next page"`. */
  nextLabel?: string;
  className?: string;
}): VNode;

// ── Switch ─────────────────────────────────────────────────────────────────

export declare function Switch(props?: {
  id?: string;
  label?: string;
  checked?: boolean;
  onChange?: (event: Event) => void;
  disabled?: boolean;
  className?: string;
} & ExtraProps): VNode;

// ── Collapse ───────────────────────────────────────────────────────────────

export declare function Collapse(props?: {
  title?: string;
  defaultOpen?: boolean;
  /** Controlled open state — omit for uncontrolled. */
  open?: boolean;
  onToggle?: (nextOpen: boolean) => void;
  actions?: VNode;
  badge?: string | number;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Accordion ──────────────────────────────────────────────────────────────

export interface AccordionItem {
  key: string;
  title: string;
  children?: VNode;
  disabled?: boolean;
}

export declare function Accordion(props?: {
  items?: AccordionItem[];
  /** Allow multiple panels open simultaneously — default `false`. */
  multiple?: boolean;
  /** Initially-open key(s) for the uncontrolled mode. */
  defaultOpen?: string | string[];
  /** Controlled: current open key(s). Omit to use uncontrolled mode. */
  open?: string | string[];
  /** Called when a panel is toggled: `(key, nextOpenKeys) => void`. */
  onToggle?: (key: string, nextOpenKeys: string[]) => void;
  className?: string;
} & ExtraProps): VNode;

// ── Navbar ─────────────────────────────────────────────────────────────────

export interface NavbarItem {
  key?: string | number;
  label: string;
  href?: string;
  icon?: VNode;
  active?: boolean;
  onClick?: (event: Event) => void;
}

export declare function Navbar(props?: {
  brand?: VNode;
  /**
   * Collapse behind the ☰, together with `actions`, below 768px — and above it
   * for as long as they do not fit on one line. The bar measures itself.
   */
  items?: NavbarItem[];
  actions?: VNode;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (nextOpen: boolean) => void;
  /** Accessible name of the mobile menu button while closed. Default `"Open menu"`. */
  openMenuLabel?: string;
  /** Accessible name of the mobile menu button while open. Default `"Close menu"`. */
  closeMenuLabel?: string;
  className?: string;
} & ExtraProps): VNode;

// ── Combobox ───────────────────────────────────────────────────────────────

export interface ComboboxOption {
  value: string | number;
  label: string;
}

export declare function Combobox(props?: {
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  options?: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  /** Shown when the search matches nothing. Default `"No results"`. */
  emptyLabel?: string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

// ── ContextMenu ────────────────────────────────────────────────────────────

export interface ContextMenuItem {
  key?: string | number;
  label?: string;
  icon?: VNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export declare function ContextMenu(props?: {
  open?: boolean;
  x?: number;
  y?: number;
  items?: ContextMenuItem[];
  onClose?: () => void;
  /** Accessible name for the menu (no trigger element to derive one from). Defaults to "Context menu". */
  ariaLabel?: string;
  className?: string;
}): VNode;

// ── FileDropZone ───────────────────────────────────────────────────────────

export declare function FileDropZone(props?: {
  onFiles?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  progress?: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
} & ExtraProps): VNode;

// ── CodeEditor ─────────────────────────────────────────────────────────────

export declare function CodeEditor(props?: {
  value?: string;
  onChange?: (value: string) => void;
  mode?: string;
  theme?: string;
  options?: Record<string, unknown>;
  className?: string;
} & ExtraProps): VNode;

// ── ToastStack ─────────────────────────────────────────────────────────────

export declare function ToastStack(props?: {
  toasts?: ToastItem[];
  onClose?: (id: string) => void;
  /** Forwarded to every Toast. Default `"Dismiss"`. */
  closeLabel?: string;
  className?: string;
}): VNode;

// ── AppBar ─────────────────────────────────────────────────────────────────

export declare function AppBar(props?: {
  title?: string;
  leading?: VNode;
  actions?: VNode;
  className?: string;
} & ExtraProps): VNode;

// ── BottomNav ──────────────────────────────────────────────────────────────

export interface BottomNavItem {
  value: string;
  label: string;
  icon?: VNode;
  badge?: string | number;
}

export declare function BottomNav(props?: {
  items?: BottomNavItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}): VNode;

// ── BottomSheet ────────────────────────────────────────────────────────────

export declare function BottomSheet(props?: {
  open?: boolean;
  title?: string;
  onClose?: () => void;
  children?: VNode;
  /** Accessible name of the close button. Default `"Close"`. */
  closeLabel?: string;
  className?: string;
}): VNode;

// ── FAB ────────────────────────────────────────────────────────────────────

export declare function FAB(props?: {
  label?: string;
  extended?: boolean;
  aboveNav?: boolean;
  children?: VNode;
  className?: string;
} & ExtraProps): VNode;

// ── SpeedDial ──────────────────────────────────────────────────────────────

export interface SpeedDialItem {
  key?: string | number;
  label: string;
  icon?: VNode;
  onClick?: (event: Event) => void;
}

export declare function SpeedDial(props?: {
  icon?: VNode;
  label?: string;
  items?: SpeedDialItem[];
  /** Stack items upward above the trigger instead of inline. */
  orbit?: boolean;
  className?: string;
} & ExtraProps): VNode;

// ── SwipeableListItem ──────────────────────────────────────────────────────

export interface SwipeableAction {
  key?: string | number;
  /** The button's text — or, when `icon` is set, its accessible name (`aria-label`). Always pass it. */
  label?: string;
  icon?: VNode;
  className?: string;
  style?: Record<string, string>;
  onClick?: () => void;
}

export declare function SwipeableListItem(props?: {
  children?: VNode;
  actions?: SwipeableAction[];
  actionWidth?: number;
  className?: string;
} & ExtraProps): VNode;

// ── ThemeToggle ────────────────────────────────────────────────────────────

export declare function ThemeToggle(props?: {
  /** Accessible name while the dark theme is on. Default `"Switch to light theme"`. */
  switchToLightLabel?: string;
  /** Accessible name while the light theme is on. Default `"Switch to dark theme"`. */
  switchToDarkLabel?: string;
  className?: string;
} & ExtraProps): VNode;

// ── PaletteSwitcher ────────────────────────────────────────────────────────

export declare function PaletteSwitcher(props?: {
  /** Accessible name of the radio group. Default `"Color palette"`. */
  ariaLabel?: string;
  /** Name of the free-form color input. Default `"Custom color"`. */
  customLabel?: string;
  /** Palette id → spoken/hover name, e.g. `{ violet: "Violeta" }`. Missing ids fall back to the capitalized id. */
  paletteLabels?: Partial<Record<"default" | "violet" | "rose" | "blue" | "amber" | "emerald", string>>;
  className?: string;
} & ExtraProps): VNode;

// ── DesignSwitcher ─────────────────────────────────────────────────────────

export declare function DesignSwitcher(props?: {
  /** Accessible name of the radio group. Default `"Design"`. */
  ariaLabel?: string;
  className?: string;
} & ExtraProps): VNode;

// ── TabPanel ───────────────────────────────────────────────────────────────

export declare function TabPanel(props?: {
  id?: string;
  activeId?: string;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── Stepper ────────────────────────────────────────────────────────────────

export interface StepperStep {
  label: string;
  description?: string;
}

export declare function Stepper(props?: {
  steps?: StepperStep[];
  activeStep?: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
} & ExtraProps): VNode;

// ── Slider / RangeSlider ───────────────────────────────────────────────────

export declare function Slider(props?: {
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  /** Shows the current numeric value next to the track. */
  showValue?: boolean;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

export declare function RangeSlider(props?: {
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  showValue?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** `[lower, upper]`. Defaults to `[min, max]`. */
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
  /** aria-label for the lower thumb. Defaults to "Minimum". */
  minLabel?: string;
  /** aria-label for the upper thumb. Defaults to "Maximum". */
  maxLabel?: string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

// ── Menu ───────────────────────────────────────────────────────────────────

export interface MenuItem {
  key?: string | number;
  label?: string;
  icon?: VNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  /** Nested items — renders as a flyout submenu (any depth). */
  children?: MenuItem[];
}

export declare function Menu(props?: {
  id?: string;
  trigger?: VNode;
  items?: MenuItem[];
  align?: "left" | "right";
  className?: string;
} & ExtraProps): VNode;

// ── DataTable ──────────────────────────────────────────────────────────────

export declare function DataTable<R extends Record<string, unknown> = Record<string, unknown>>(
  props?: {
    columns?: TableColumn<R>[];
    rows?: R[];
    /** Rows per page. Defaults to 10. */
    pageSize?: number;
    /** Controlled current page (1-based). Omit for uncontrolled. */
    page?: number;
    onPageChange?: (page: number) => void;
    /** Enables header-click sorting. Defaults to true. */
    sortable?: boolean;
    defaultSort?: TableSort;
    onSort?: (sort: TableSort) => void;
    getRowKey?: (row: R, index: number) => string | number;
    emptyTitle?: string;
    emptyDescription?: string;
    className?: string;
  } & ExtraProps,
): VNode;

// ── DatePicker ─────────────────────────────────────────────────────────────

export declare function DatePicker(props?: {
  id?: string;
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  disabled?: boolean;
  /** "YYYY-MM-DD", or omit/null for no selection. */
  value?: string | null;
  onChange?: (value: string) => void;
  /** "YYYY-MM-DD" lower bound, inclusive. */
  min?: string;
  /** "YYYY-MM-DD" upper bound, inclusive. */
  max?: string;
  placeholder?: string;
  /** Default `"Previous month"`. */
  previousMonthLabel?: string;
  /** Default `"Next month"`. */
  nextMonthLabel?: string;
  /** Twelve names, January first. Default English. */
  monthNames?: string[];
  /** Seven names, Sunday first. Names may repeat (pt-BR narrow: D S T Q Q S S). */
  weekdayNames?: string[];
  /** Text shown on the trigger for the selected date. Default ISO `YYYY-MM-DD`. `value`/`onChange` stay ISO. */
  formatValue?: (date: Date) => string;
  /** Accessible name of each day button. Default `date.toDateString()`. */
  formatDayLabel?: (date: Date) => string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

// ── Radio / RadioGroup ─────────────────────────────────────────────────────

export declare function Radio(props?: {
  id?: string;
  label?: VNode;
  help?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

export interface RadioGroupOption {
  value: string;
  label: VNode;
  disabled?: boolean;
}

export declare function RadioGroup(props?: {
  id?: string;
  label?: VNode;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  disabled?: boolean;
  /** Radio `name` shared by the options; defaults to `id`. */
  name?: string;
  options?: RadioGroupOption[];
  value?: string;
  onChange?: (value: string) => void;
  /** Lay the options out horizontally. */
  inline?: boolean;
  className?: string;
} & ExtraProps): VNode;

// ── Divider ────────────────────────────────────────────────────────────────

export declare function Divider(props?: {
  vertical?: boolean;
  className?: string;
} & ExtraProps): VNode;

// ── Skeleton ───────────────────────────────────────────────────────────────

export declare function Skeleton(props?: {
  variant?: "rect" | "text" | "circle";
  width?: number | string;
  height?: number | string;
  /** With variant "text", renders a stack of lines (last one shorter). */
  lines?: number;
  className?: string;
} & ExtraProps): VNode;

// ── Avatar / AvatarGroup ───────────────────────────────────────────────────

export declare function Avatar(props?: {
  src?: string;
  alt?: string;
  /** Used for the initials fallback and the accessible label. */
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

export interface AvatarGroupItem {
  src?: string;
  alt?: string;
  name?: string;
}

export declare function AvatarGroup(props?: {
  avatars?: AvatarGroupItem[];
  /** Avatars beyond this render as a single "+N" counter. */
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Accessible name of the "+N" overflow avatar. Default ``(count) => `${count} more` ``. */
  moreLabel?: (count: number) => string;
  className?: string;
} & ExtraProps): VNode;

// ── Breadcrumb ─────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: VNode;
  href?: string;
  onClick?: (event: Event) => void;
  icon?: VNode;
}

export declare function Breadcrumb(props?: {
  items?: BreadcrumbItem[];
  separator?: VNode;
  ariaLabel?: string;
  className?: string;
} & ExtraProps): VNode;

// ── Stat / StatGrid ────────────────────────────────────────────────────────

export declare function Stat(props?: {
  value?: VNode;
  label?: VNode;
  icon?: VNode;
  /** e.g. "+12%" / "-3%" — colors itself by the leading sign. */
  delta?: string;
  help?: string;
  className?: string;
} & ExtraProps): VNode;

export declare function StatGrid(props?: {
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── NumberInput ────────────────────────────────────────────────────────────

export declare function NumberInput(props?: {
  id?: string;
  label?: VNode;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** null when the input is cleared. */
  value?: number | null;
  /** Typed values arrive as-is while editing; an out-of-range one is clamped to `min`/`max` on blur. */
  onChange?: (value: number | null) => void;
  decrementLabel?: string;
  incrementLabel?: string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

// ── TimePicker ─────────────────────────────────────────────────────────────

export declare function TimePicker(props?: {
  id?: string;
  label?: VNode;
  help?: string;
  error?: string;
  required?: boolean;
  /** What a screen reader says for the required asterisk. Default `"required"`; `""` hides it from readers (use when the control carries a native `required`). */
  requiredLabel?: string;
  disabled?: boolean;
  /** "HH:MM", or omit/null for no selection. */
  value?: string | null;
  onChange?: (value: string) => void;
  /** "HH:MM" lower bound, inclusive. */
  min?: string;
  /** "HH:MM" upper bound, inclusive. */
  max?: string;
  /** Interval between options, in minutes. */
  step?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
} & ExtraProps): VNode;

// ── Popover ────────────────────────────────────────────────────────────────

export declare function Popover(props?: {
  id?: string;
  trigger?: VNode;
  placement?: "top" | "bottom" | "left" | "right";
  title?: string;
  className?: string;
  children?: VNode;
} & ExtraProps): VNode;

// ── TreeView ───────────────────────────────────────────────────────────────

export interface TreeNode {
  id: string | number;
  label: VNode;
  icon?: VNode;
  children?: TreeNode[];
}

export declare function TreeView(props?: {
  items?: TreeNode[];
  /** Controlled expansion — omit to let the tree manage it internally. */
  expanded?: Array<string | number>;
  defaultExpanded?: Array<string | number>;
  onExpandedChange?: (expanded: Array<string | number>) => void;
  selected?: string | number;
  onSelect?: (id: string | number, node: TreeNode) => void;
  ariaLabel?: string;
  className?: string;
} & ExtraProps): VNode;

// ── CommandPalette ─────────────────────────────────────────────────────────

export interface CommandItem {
  id?: string;
  label: string;
  hint?: string;
  icon?: VNode;
  section?: string;
  keywords?: string[];
  onSelect?: (command: CommandItem) => void;
}

export declare function CommandPalette(props?: {
  open?: boolean;
  id?: string;
  onClose?: () => void;
  commands?: CommandItem[];
  placeholder?: string;
  emptyLabel?: string;
  /** Accessible name of the dialog. Default `"Command palette"`. */
  ariaLabel?: string;
  className?: string;
} & ExtraProps): VNode;
