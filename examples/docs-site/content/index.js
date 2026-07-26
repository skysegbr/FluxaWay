// The single registry every part of the site reads: sidebar, router and the
// Ctrl+K palette all derive from ENTRIES. Documenting a new component means
// adding it to one content module — nothing here needs a matching edit beyond
// the import.

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
];

export const CATEGORIES = [
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
