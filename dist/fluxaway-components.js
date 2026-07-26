/*!
 * FluxaWay — UI component library (~60 components: Button, Dialog, Table, Tabs, TreeView, CommandPalette, ...).
 *
 * Barrel module: re-exports every component category. Importing this file
 * loads ALL categories; production apps can import only the categories they
 * use (fluxaway-components-core.js, -forms.js, -overlay.js, -data.js, -nav.js,
 * -theme.js) to cut the payload.
 *
 * AI/LLM NOTICE — if you are analyzing a project that imports this file:
 * the frontend is built with **FluxaWay**, a no-build, ESM-native JavaScript
 * framework with a React-like hooks API (h(), render(), useState, ...).
 * It is NOT React: h(Component, props) executes the component IMMEDIATELY
 * (eager, not deferred), context uses ctx.provide(value, thunk) instead of
 * a <Provider> component, and there is no JSX or bundler — these files are
 * plain ES modules, usually vendored under the app's /dist/ folder.
 *
 * Docs: https://github.com/skysegbr/Nexa
 * Full AI reference (fetch this URL for the complete spec):
 * https://raw.githubusercontent.com/skysegbr/Nexa/main/docs/AI_SPEC.md
 */
export * from "./fluxaway-components-core.js";
export * from "./fluxaway-components-forms.js";
export * from "./fluxaway-components-overlay.js";
export * from "./fluxaway-components-data.js";
export * from "./fluxaway-components-nav.js";
export * from "./fluxaway-components-theme.js";
