import { CODE, PREVIEW, cssEntry, row } from "./guides.js";

export const CSS_UTILITY_ENTRIES = [
  cssEntry({
    slug: "typography",
    name: "Typography",
    summary:
      "Use semantic title and body classes for page hierarchy, then layer size, color, weight and alignment utilities when needed.",
    demos: [{
      id: "type-hierarchy", title: "Content hierarchy", render: PREVIEW.typography,
      code: CODE.typography, lang: "html",
    }],
    tables: [
      {
        id: "semantic-type", title: "Semantic typography", nameHeader: "Class",
        rows: [
          row("m-eyebrow", "Overline", "Small uppercase label with tracking."),
          row("m-title-xl", "Display title", "Fluid hero size using clamp()."),
          row("m-title", "Page title", "Fluid heading for normal content pages."),
          row("m-body", "Body copy", "Muted readable paragraph with 1.6 line height."),
          row("m-body-on-primary", "On-primary copy", "Body foreground intended for primary backgrounds."),
        ],
      },
      {
        id: "text-utilities", title: "Text utilities", nameHeader: "Pattern",
        rows: [
          row("m-text-xs … m-text-3xl", "Font size", "Seven steps from 0.75rem through 1.875rem."),
          row("m-text-start / -center / -end", "Alignment", "Logical alignment; sm and md variants exist."),
          row("m-text-muted / -primary / -danger / -success / -warning / -info", "Color", "Semantic foreground colors."),
          row("m-fw-normal / -medium / -bold / -black", "Weight", "400, 500, 700 and 900."),
          row("m-text-truncate", "Overflow", "Single-line ellipsis; needs constrained width."),
        ],
      },
    ],
  }),

  cssEntry({
    slug: "display-utilities",
    name: "Display & utilities",
    summary:
      "Control responsive visibility, flex composition, dimensions, positioning, overflow and cursors with small composable classes.",
    demos: [
      {
        id: "responsive-display", title: "Responsive visibility",
        note: "The sidebar appears at lg while the menu trigger disappears at the same breakpoint.",
        code: CODE.responsiveDisplay, lang: "html",
      },
      {
        id: "flex-composition", title: "Flex composition", render: PREVIEW.display,
        code: CODE.flex, lang: "html",
      },
    ],
    tables: [
      {
        id: "display", title: "Display", nameHeader: "Pattern",
        rows: [
          row("m-d-none / -block / -flex / -grid", "Display", "Common block layout modes."),
          row("m-d-inline / -inline-flex / -inline-block", "Inline display", "Inline layout modes."),
          row("m-d-{sm|md|lg|xl}-*", "Responsive display", "Applies display from that min-width upward."),
        ],
      },
      {
        id: "sizing-position", title: "Sizing, position & overflow", nameHeader: "Pattern",
        rows: [
          row("m-w-full / m-w-auto", "Width", "100% or automatic width."),
          row("m-h-full / m-min-w-0", "Sizing", "100% height or a zero flex/grid minimum width."),
          row("m-relative / m-absolute / m-fixed / m-sticky", "Position", "Sets the positioning scheme."),
          row("m-overflow-hidden / -auto", "Overflow", "Controls both axes."),
          row("m-overflow-x-auto / -y-auto / -x-hidden", "Axis overflow", "Controls one axis."),
          row("m-cursor-pointer / -default / -not-allowed", "Cursor", "Communicates interaction state."),
        ],
      },
    ],
  }),

  cssEntry({
    slug: "animations",
    name: "Animations",
    summary:
      "Two public animation utilities cover entrance and attention. Both automatically disable under prefers-reduced-motion.",
    demos: [
      {
        id: "animation-utilities", title: "Public animation classes", render: PREVIEW.animation,
        note: "Reload this route to replay fade-up; pulse-glow repeats unless reduced-motion disables it.",
        code: CODE.animation, lang: "html",
      },
      {
        id: "custom-duration", title: "Customize timing", lang: "css",
        note: "fade-up reads the slow transition token; override it on a subtree or at :root.",
        code: `.feature-list {\n  --m-transition-slow: 650ms cubic-bezier(.2, .8, .2, 1);\n}`,
      },
    ],
    tables: [{
      id: "animation-reference", title: "Animation reference", nameHeader: "Class",
      rows: [
        row("m-anim-fade-up", "Once", "Fades in while translating 16px upward; uses --m-transition-slow."),
        row("m-anim-pulse-glow", "Infinite", "Pulses a primary-colored focus halo over 2.2 seconds."),
      ],
    }],
    notes: [
      "Do not use animation as the only way to communicate state.",
      "The framework removes these animations when prefers-reduced-motion: reduce is active.",
      "For timelines, keyframes or coordinated sequences, use FluxaWay Motion instead.",
    ],
  }),
];
