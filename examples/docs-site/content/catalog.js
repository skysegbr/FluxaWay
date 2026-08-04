// Lightweight shell registry. Live demos stay behind dynamic imports in
// entryLoader.js, so sidebar and search do not fetch all reference pages.

import { CATEGORIES, ENTRY_META } from "./catalogData.js";
export { CATEGORIES, ENTRY_META } from "./catalogData.js";

const BY_SLUG = new Map(ENTRY_META.map((entry) => [entry.slug, entry]));

export function pathFor(entry) {
  if (entry.category === "addons") return `/addons/${entry.slug}`;
  if (entry.category === "css") return `/css/${entry.slug}`;
  return `/components/${entry.slug}`;
}

export function categoryFor(key) {
  return CATEGORIES.find((category) => category.key === key) ?? null;
}

export function metaFor(slug) {
  return BY_SLUG.get(slug) ?? null;
}

export function neighborsFor(slug) {
  const index = ENTRY_META.findIndex((entry) => entry.slug === slug);
  return {
    previous:
      index > 0
        ? { label: ENTRY_META[index - 1].name, path: pathFor(ENTRY_META[index - 1]) }
        : null,
    next:
      index >= 0 && index < ENTRY_META.length - 1
        ? { label: ENTRY_META[index + 1].name, path: pathFor(ENTRY_META[index + 1]) }
        : null,
  };
}

export const SIDEBAR_GROUPS = [
  {
    title: "Introduction",
    icon: "bi-rocket-takeoff",
    items: [
      { label: "Overview", path: "/" },
      { label: "Getting started", path: "/getting-started" },
      { label: "AI & security", path: "/ai-security" },
    ],
  },
  ...CATEGORIES.map((category) => ({
    title: category.title,
    icon: category.icon,
    items: ENTRY_META.filter((entry) => entry.category === category.key)
      .map((entry) => ({ label: entry.name, path: pathFor(entry) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  })),
];

export const SEARCH_COMMANDS = [
  { id: "home", label: "Overview", section: "Introduction", path: "/" },
  {
    id: "getting-started",
    label: "Getting started",
    section: "Introduction",
    keywords: ["install", "cdn", "no build", "quick start"],
    path: "/getting-started",
  },
  {
    id: "ai-security",
    label: "AI & security",
    section: "Introduction",
    keywords: ["AI_SPEC", "prompt", "AI", "security", "safeUrl", "supply chain"],
    path: "/ai-security",
  },
  ...ENTRY_META.map((entry) => ({
    id: entry.slug,
    label: entry.name,
    section: categoryFor(entry.category)?.title ?? "Reference",
    hint: entry.module?.replace("fluxaway-components-", "").replace(".js", "") ?? "add-on",
    keywords: [entry.slug, entry.name, entry.category, ...(entry.keywords ?? [])],
    path: pathFor(entry),
  })),
];
