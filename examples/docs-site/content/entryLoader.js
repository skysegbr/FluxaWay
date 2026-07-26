import { loadCSS } from "/dist/fluxaway.js";
import { ENTRY_META } from "./catalogData.js";

const LOADERS = {
  "core/buttons": () => import("./core/buttons.js").then((mod) => mod.BUTTON_ENTRIES),
  "core/feedback": () => import("./core/feedback.js").then((mod) => mod.FEEDBACK_ENTRIES),
  "core/surfaces": () => import("./core/surfaces.js").then((mod) => mod.SURFACE_ENTRIES),
  "core/identity": () => import("./core/identity.js").then((mod) => mod.IDENTITY_ENTRIES),
  "forms/text": () => import("./forms/text.js").then((mod) => mod.TEXT_ENTRIES),
  "forms/choice": () => import("./forms/choice.js").then((mod) => mod.CHOICE_ENTRIES),
  "forms/range": () => import("./forms/range.js").then((mod) => mod.RANGE_ENTRIES),
  "forms/advanced": () => import("./forms/advanced.js").then((mod) => mod.ADVANCED_ENTRIES),
  "overlay/modals": () => import("./overlay/modals.js").then((mod) => mod.MODAL_ENTRIES),
  "overlay/menus": () => import("./overlay/menus.js").then((mod) => mod.MENU_ENTRIES),
  "overlay/anchored": () => import("./overlay/anchored.js").then((mod) => mod.ANCHORED_ENTRIES),
  "overlay/toasts": () => import("./overlay/toasts.js").then((mod) => mod.TOAST_ENTRIES),
  "data/tables": () => import("./data/tables.js").then((mod) => mod.TABLE_ENTRIES),
  "data/panels": () => import("./data/panels.js").then((mod) => mod.PANEL_ENTRIES),
  "nav/tabs": () => import("./nav/tabs.js").then((mod) => mod.TAB_ENTRIES),
  "nav/shell": () => import("./nav/shell.js").then((mod) => mod.SHELL_ENTRIES),
  "nav/actions": () => import("./nav/actions.js").then((mod) => mod.ACTION_ENTRIES),
  "theme/switchers": () => import("./theme/switchers.js").then((mod) => mod.THEME_ENTRIES),
  "hooks/state": () => import("./hooks/state.js").then((mod) => mod.STATE_HOOK_ENTRIES),
  "hooks/memoization": () =>
    import("./hooks/memoization.js").then((mod) => mod.MEMO_HOOK_ENTRIES),
  "hooks/data": () => import("./hooks/data.js").then((mod) => mod.DATA_HOOK_ENTRIES),
  "hooks/queues": () => import("./hooks/queues.js").then((mod) => mod.QUEUE_HOOK_ENTRIES),
  "hooks/routing": () => import("./hooks/routing.js").then((mod) => mod.ROUTING_HOOK_ENTRIES),
  "hooks/theming": () => import("./hooks/theming.js").then((mod) => mod.THEMING_HOOK_ENTRIES),
  "hooks/ui": () => import("./hooks/ui.js").then((mod) => mod.UI_HOOK_ENTRIES),
  "hooks/lists": () => import("./hooks/lists.js").then((mod) => mod.LIST_HOOK_ENTRIES),
  "hooks/misc": () => import("./hooks/misc.js").then((mod) => mod.MISC_HOOK_ENTRIES),
  "hooks/device": () => import("./hooks/device.js").then((mod) => mod.DEVICE_HOOK_ENTRIES),
  "addons/motion": () => import("./addons/motion.js").then((mod) => mod.ADDON_ENTRIES),
  "addons/zoom": () => import("./addons/zoom.js").then((mod) => mod.ADDON_ENTRIES),
  "addons/canvas": () => import("./addons/canvas.js").then((mod) => mod.ADDON_ENTRIES),
  "addons/editor": () => import("./addons/editor.js").then((mod) => mod.ADDON_ENTRIES),
};

const BY_SLUG = new Map(ENTRY_META.map((entry) => [entry.slug, entry]));
const scriptPromises = new Map();
const SOURCE_STYLES = {
  "forms/text": "/dist/fluxaway-ui-forms.css",
  "forms/choice": "/dist/fluxaway-ui-forms.css",
  "forms/range": "/dist/fluxaway-ui-forms.css",
  "forms/advanced": "/dist/fluxaway-ui-forms.css",
  "data/tables": "/dist/fluxaway-ui-data.css",
  "data/panels": "/dist/fluxaway-ui-data.css",
  "hooks/state": "/dist/fluxaway-ui-forms.css",
  "hooks/memoization": "/dist/fluxaway-ui-forms.css",
  "hooks/data": "/dist/fluxaway-ui-forms.css",
  "hooks/queues": "/dist/fluxaway-ui-forms.css",
  "hooks/ui": "/dist/fluxaway-ui-forms.css",
};

function loadScript(src) {
  if (globalThis.document === undefined) return Promise.resolve();
  if (scriptPromises.has(src)) return scriptPromises.get(src);

  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing?.dataset.loaded === "true") return Promise.resolve();

  const promise = new Promise((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), {
      once: true,
    });
    if (!existing) {
      script.src = src;
      document.head.append(script);
    }
  });

  scriptPromises.set(src, promise);
  return promise;
}

async function loadEntryAssets(meta) {
  const { slug, source } = meta;
  const styles = [];
  if (SOURCE_STYLES[source]) styles.push(SOURCE_STYLES[source]);
  if (slug === "pipeline-canvas") styles.push("/dist/fluxaway-canvas.css");
  if (slug === "zoom-stage") styles.push("/dist/fluxaway-zoom.css");
  if (slug === "full-code-editor") styles.push("/dist/fluxaway-editor.css");

  const needsCodeMirror = slug === "code-editor" || slug === "full-code-editor";
  if (needsCodeMirror) styles.push("/assets/codemirror/codemirror.min.css");

  await Promise.all(styles.map((href) => loadCSS(href)));
  if (needsCodeMirror) await loadScript("/assets/codemirror/codemirror.min.js");
}

export async function loadEntry(slug) {
  const meta = BY_SLUG.get(slug);
  if (!meta) return null;

  await loadEntryAssets(meta);
  const rows = await loadSource(meta.source);
  return rows.find((entry) => entry.slug === slug) ?? null;
}

export function loadSource(source) {
  const loader = LOADERS[source];
  return loader ? loader() : Promise.resolve([]);
}
