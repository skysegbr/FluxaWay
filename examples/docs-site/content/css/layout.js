import { CODE, PREVIEW, cssEntry, row } from "./guides.js";

export const CSS_LAYOUT_ENTRIES = [
  cssEntry({
    slug: "grid-breakpoints",
    name: "Grid & breakpoints",
    summary:
      "A mobile-first 12-column grid with four min-width breakpoints, equal columns, automatic width and configurable gutters.",
    demos: [
      {
        id: "grid-basic", title: "Responsive main and aside", render: PREVIEW.grid,
        note: "Both columns span the row on mobile and become 8 + 4 from md upward.",
        code: CODE.gridBasic, lang: "html",
      },
      {
        id: "grid-cards", title: "Four responsive cards", render: PREVIEW.responsiveGrid,
        note: "One per row by default, two from sm and four from lg.",
        code: CODE.gridNested, lang: "html",
      },
    ],
    tables: [
      {
        id: "breakpoints", title: "Breakpoints", nameHeader: "Prefix", typeHeader: "Min width",
        rows: [
          row("m-col-*", "0", "Base/mobile styles, active at every width."),
          row("m-col-sm-*", "576px", "Small screens and larger."),
          row("m-col-md-*", "768px", "Medium screens and larger."),
          row("m-col-lg-*", "992px", "Large screens and larger."),
          row("m-col-xl-*", "1200px", "Extra-large screens and larger."),
        ],
      },
      {
        id: "grid-classes", title: "Grid classes", nameHeader: "Class",
        rows: [
          row("m-container", "Responsive max-width", "Centered container capped at each breakpoint."),
          row("m-container-fluid", "100% width", "Full-width container with inline padding."),
          row("m-row", "Flex row", "Wraps columns and balances their inline padding."),
          row("m-row-gap-0 / -2 / -4", "Gutter", "Changes the row's horizontal gutter."),
          row("m-col", "Equal", "Shares remaining width equally."),
          row("m-col-auto", "Content width", "Sizes the column from its content."),
          row("m-col-1 … m-col-12", "8.33% … 100%", "Sets a span; breakpoint prefixes use the same scale."),
        ],
      },
    ],
  }),

  cssEntry({
    slug: "layout-flex",
    name: "Layout & flex",
    summary:
      "Compose common page arrangements with stack, cluster, split and center patterns, then refine them with flex utilities.",
    demos: [{
      id: "layout-patterns", title: "Composition patterns", render: PREVIEW.layout,
      code: CODE.layout, lang: "html",
    }],
    tables: [
      {
        id: "layout-classes", title: "Layout patterns", nameHeader: "Class",
        rows: [
          row("m-app", "App wrapper", "At least one viewport high with theme background and text."),
          row("m-stack", "Grid column", "Vertical flow with space-4 gap."),
          row("m-cluster", "Wrapping flex row", "Groups compact controls or tags with aligned centers."),
          row("m-split", "Space-between row", "Pushes two groups to opposite edges."),
          row("m-center", "Grid centering", "Centers content on both axes."),
          row("m-section", "Grid section", "Vertical section rhythm with space-4 gap."),
          row("m-responsive-grid", "Auto-fit grid", "Responsive cards without explicit column spans."),
          row("m-grid-2 / -3 / -4", "Legacy grid", "Fixed-count responsive helpers retained for compatibility."),
        ],
      },
      {
        id: "flex-classes", title: "Flex utilities", nameHeader: "Pattern",
        rows: [
          row("m-flex-row / m-flex-column", "Direction", "Selects the main axis."),
          row("m-flex-wrap / m-flex-nowrap", "Wrapping", "Controls whether children wrap."),
          row("m-flex-grow / m-flex-shrink-0", "Sizing", "Consumes free space or prevents shrinking."),
          row("m-justify-start / -end / -center / -between / -around", "Main axis", "Aligns children along the main axis."),
          row("m-align-start / -end / -center / -baseline / -stretch", "Cross axis", "Aligns children along the cross axis."),
        ],
      },
    ],
  }),

  cssEntry({
    slug: "spacing",
    name: "Spacing",
    summary:
      "Apply margin, padding and gap from the shared 4-point token scale. Utility rules use !important so composition stays predictable.",
    demos: [{
      id: "spacing-scale", title: "Padding scale", render: PREVIEW.spacing,
      note: "The visible box grows with the same spacing tokens used inside components.",
      code: CODE.spacing, lang: "html",
    }],
    tables: [
      {
        id: "spacing-values", title: "Scale", nameHeader: "Suffix", typeHeader: "Value",
        rows: [
          row("0", "0", "Removes spacing."),
          row("1 / 2 / 3 / 4", "4 / 8 / 12 / 16px", "Fine-grained control."),
          row("5 / 6 / 8", "20 / 24 / 32px", "Section and component spacing."),
          row("10 / 12", "40 / 48px", "Available to gap utilities and tokens for large rhythm."),
        ],
      },
      {
        id: "spacing-patterns", title: "Utility patterns", nameHeader: "Pattern",
        rows: [
          row("m-m-* / m-p-*", "All sides", "Margin or padding on every side."),
          row("m-mt-* / m-mb-*", "Block edge", "Top or bottom margin."),
          row("m-ms-* / m-me-*", "Logical inline edge", "Start or end margin; follows writing direction."),
          row("m-px-* / m-py-*", "Logical axis", "Inline or block padding."),
          row("m-gap-*", "Grid/flex gap", "Works on grid and flex containers."),
          row("m-m-auto / m-mx-auto / m-ms-auto / m-me-auto", "Auto margin", "Centers or pushes an item."),
        ],
      },
    ],
  }),
];
