// The single registry every part of the site reads: sidebar, router and the
// Ctrl+K palette all derive from ENTRIES. Documenting a component or a hook
// means adding it to one content module — nothing here needs a matching edit
// beyond the import.

import { BUTTON_ENTRIES } from "./core/buttons.js";
import { FEEDBACK_ENTRIES } from "./core/feedback.js";
import { SURFACE_ENTRIES } from "./core/surfaces.js";
import { IDENTITY_ENTRIES } from "./core/identity.js";
import { TEXT_ENTRIES } from "./forms/text.js";
import { CHOICE_ENTRIES } from "./forms/choice.js";
import { RANGE_ENTRIES } from "./forms/range.js";
import { ADVANCED_ENTRIES } from "./forms/advanced.js";
import { MODAL_ENTRIES } from "./overlay/modals.js";
import { MENU_ENTRIES } from "./overlay/menus.js";
import { ANCHORED_ENTRIES } from "./overlay/anchored.js";
import { TOAST_ENTRIES } from "./overlay/toasts.js";
import { TABLE_ENTRIES } from "./data/tables.js";
import { PANEL_ENTRIES } from "./data/panels.js";
import { TAB_ENTRIES } from "./nav/tabs.js";
import { SHELL_ENTRIES } from "./nav/shell.js";
import { ACTION_ENTRIES } from "./nav/actions.js";
import { THEME_ENTRIES } from "./theme/switchers.js";
import { STATE_HOOK_ENTRIES } from "./hooks/state.js";
import { MEMO_HOOK_ENTRIES } from "./hooks/memoization.js";
import { DATA_HOOK_ENTRIES } from "./hooks/data.js";
import { QUEUE_HOOK_ENTRIES } from "./hooks/queues.js";
import { ROUTING_HOOK_ENTRIES } from "./hooks/routing.js";
import { THEMING_HOOK_ENTRIES } from "./hooks/theming.js";
import { UI_HOOK_ENTRIES } from "./hooks/ui.js";
import { LIST_HOOK_ENTRIES } from "./hooks/lists.js";
import { MISC_HOOK_ENTRIES } from "./hooks/misc.js";
import { DEVICE_HOOK_ENTRIES } from "./hooks/device.js";

export const ENTRIES = [
  ...BUTTON_ENTRIES,
  ...SURFACE_ENTRIES,
  ...FEEDBACK_ENTRIES,
  ...IDENTITY_ENTRIES,
  ...TEXT_ENTRIES,
  ...CHOICE_ENTRIES,
  ...RANGE_ENTRIES,
  ...ADVANCED_ENTRIES,
  ...MODAL_ENTRIES,
  ...MENU_ENTRIES,
  ...ANCHORED_ENTRIES,
  ...TOAST_ENTRIES,
  ...TABLE_ENTRIES,
  ...PANEL_ENTRIES,
  ...TAB_ENTRIES,
  ...SHELL_ENTRIES,
  ...ACTION_ENTRIES,
  ...THEME_ENTRIES,
  ...STATE_HOOK_ENTRIES,
  ...MEMO_HOOK_ENTRIES,
  ...DATA_HOOK_ENTRIES,
  ...QUEUE_HOOK_ENTRIES,
  ...ROUTING_HOOK_ENTRIES,
  ...THEMING_HOOK_ENTRIES,
  ...UI_HOOK_ENTRIES,
  ...LIST_HOOK_ENTRIES,
  ...MISC_HOOK_ENTRIES,
  ...DEVICE_HOOK_ENTRIES,
];

// Sidebar order, top to bottom: the framework first, then the library built
// on it.
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
];

const BY_SLUG = new Map(ENTRIES.map((entry) => [entry.slug, entry]));

export function entryFor(slug) {
  return BY_SLUG.get(slug) ?? null;
}

export function pathFor(entry) {
  return `/components/${entry.slug}`;
}

export const SIDEBAR_GROUPS = [
  {
    title: "Introduction",
    icon: "bi-rocket-takeoff",
    items: [
      { label: "Overview", path: "/" },
      { label: "Getting started", path: "/getting-started" },
    ],
  },
  ...CATEGORIES.map((category) => ({
    title: category.title,
    icon: category.icon,
    items: ENTRIES.filter((entry) => entry.category === category.key)
      .map((entry) => ({ label: entry.name, path: pathFor(entry) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  })),
];

export const SEARCH_COMMANDS = [
  {
    id: "home",
    label: "Overview",
    section: "Introduction",
    path: "/",
  },
  {
    id: "getting-started",
    label: "Getting started",
    section: "Introduction",
    keywords: ["install", "cdn", "no build", "quick start"],
    path: "/getting-started",
  },
  ...ENTRIES.map((entry) => ({
    id: entry.slug,
    label: entry.name,
    section: CATEGORIES.find((category) => category.key === entry.category)?.title ?? "Components",
    hint: entry.module.replace("nexa-components-", "").replace(".js", ""),
    keywords: [entry.slug, ...entry.demos.map((demo) => demo.title)],
    path: pathFor(entry),
  })),
];
