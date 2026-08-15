import { CODE, PREVIEW, cssEntry, row } from "./guides.js";

export const CSS_FOUNDATION_ENTRIES = [
  cssEntry({
    slug: "installation",
    name: "Installation & bundles",
    module: "fluxaway-ui.css",
    summary:
      "Load the complete design system with one stylesheet, or combine the base with only the component categories a page uses.",
    demos: [
      {
        id: "monolithic", title: "One-file setup", code: CODE.monolithic, lang: "html",
        note: "The monolithic file contains the base plus all six component categories.",
      },
      {
        id: "split", title: "Category bundles", code: CODE.split, lang: "html",
        note: "Load base first. Category files are independent and match the split JavaScript modules.",
      },
      {
        id: "cdn", title: "Pinned CDN", code: CODE.cdn, lang: "html",
        note: "Pin a release in production. @main is useful only while exploring.",
      },
    ],
    tables: [{
      id: "bundles", title: "Bundle map", nameHeader: "File", typeHeader: "Load",
      rows: [
        row("fluxaway-ui.css", "Alternative", "Monolithic build containing every UI category."),
        row("fluxaway-ui-base.css", "Required when split", "Tokens, reset, grid, utilities, typography and common primitives."),
        row("fluxaway-ui-core.css", "Optional", "Buttons, cards, feedback, identity and surface components."),
        row("fluxaway-ui-forms.css", "Optional", "Fields, choices, ranges and advanced form controls."),
        row("fluxaway-ui-overlay.css", "Optional", "Dialogs, drawers, menus, anchored overlays and toasts."),
        row("fluxaway-ui-data.css", "Optional", "Tables, statistics, trees, accordions and collapse."),
        row("fluxaway-ui-nav.css", "Optional", "Tabs, breadcrumbs, steppers, shells and navigation actions."),
        row("fluxaway-ui-theme.css", "Optional", "PaletteSwitcher and DesignSwitcher presentation."),
      ],
    }],
    notes: [
      "Do not load fluxaway-ui.css together with the split files; that duplicates the same rules.",
      "Every readable stylesheet has a .min.css twin with the same behavior.",
      "fluxaway-bootstrap.css and experimental fluxaway-metallic.css are optional skins and should load after the FluxaWay files.",
    ],
  }),

  cssEntry({
    slug: "tokens-themes",
    name: "Tokens, themes & palettes",
    summary:
      "Customize the system through --m-* properties. Light/dark themes and accent palettes compose without changing component markup.",
    demos: [
      {
        id: "token-preview", title: "Semantic color tokens", render: PREVIEW.tokens,
        note: "These values update immediately when the active theme or palette changes.",
        code: `color: var(--m-text);\nbackground: var(--m-surface);\nborder-color: var(--m-border);`,
        lang: "css",
      },
      {
        id: "override", title: "Override a brand", code: CODE.tokenOverride, lang: "css",
        note: "Override semantic tokens after FluxaWay CSS instead of editing the distributed file.",
      },
      {
        id: "attributes", title: "Theme and palette attributes", code: CODE.themeAttributes, lang: "html",
        note: "useTheme() and usePalette() manage these attributes and persist the choice for you.",
      },
    ],
    tables: [
      {
        id: "token-groups", title: "Token groups", nameHeader: "Pattern",
        rows: [
          row("--m-font*", "Typography", "Font family and the xs through 3xl type scale."),
          row("--m-space-*", "Spacing", "4-point spacing scale used by components and utilities."),
          row("--m-bg / --m-surface*", "Surfaces", "Page and raised/muted surface colors."),
          row("--m-text* / --m-border", "Content", "Foreground hierarchy and structural borders."),
          row("--m-primary* / --m-secondary", "Brand", "Accent, hover and soft brand colors."),
          row("--m-danger* / --m-success* / --m-warning* / --m-info*", "Status", "Semantic feedback colors and soft backgrounds."),
          row("--m-radius* / --m-shadow-*", "Shape", "Corner and elevation scales."),
          row("--m-transition-*", "Motion", "Fast, base and slow timing tokens."),
          row("--m-z-*", "Layers", "App bar, dropdown, drawer, dialog, toast and tooltip ordering."),
          row("--m-safe-*", "Safe areas", "Viewport inset values for notches and mobile browser chrome."),
        ],
      },
      {
        id: "palette-values", title: "Built-in palettes", nameHeader: "Value",
        rows: [
          row("default", "Teal", "The base FluxaWay palette."),
          row("violet / rose / blue", "Preset", "Cool and expressive accent alternatives."),
          row("amber / emerald", "Preset", "Warm and green accent alternatives."),
          row("custom", "Derived", "Starts from --m-primary and derives related shades with color-mix()."),
        ],
      },
    ],
  }),
];
