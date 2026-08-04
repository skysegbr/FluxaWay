export const SOURCE_DOCUMENTS = Object.freeze({
  "ai-spec": {
    title: "AI Reference Spec",
    description: "The complete source of truth for AI assistants generating FluxaWay applications.",
    path: "/docs/AI_SPEC.md",
    mode: "markdown",
    backLabel: "AI & security",
    backPath: "/ai-security",
  },
  "ai-qa": {
    title: "AI QA Runbook",
    description: "The browser-first process for validating FluxaWay changes and generated applications.",
    path: "/docs/AI_QA.md",
    mode: "markdown",
    backLabel: "AI & security",
    backPath: "/ai-security",
  },
  "motion-guide": {
    title: "FluxaWay Motion Guide",
    description: "The complete guide to timelines, keyframes, easing, staggering and motion accessibility.",
    path: "/docs/MOTION.md",
    mode: "markdown",
    backLabel: "FluxaWay Motion",
    backPath: "/addons/fluxaway-motion",
  },
  "full-code-editor-source": {
    title: "FullCodeEditor source",
    description: "The browser-native source for FluxaWay's full code-editor add-on.",
    path: "/dist/fluxaway-editor.js",
    mode: "javascript",
    backLabel: "FullCodeEditor",
    backPath: "/addons/full-code-editor",
  },
  "charts-source": {
    title: "FluxaWay Charts source",
    description: "The browser-native source for FluxaWay charts and dashboard components.",
    path: "/dist/fluxaway-charts.js",
    mode: "javascript",
    backLabel: "FluxaWay Charts",
    backPath: "/addons/fluxaway-charts",
  },
  "pipeline-canvas-source": {
    title: "PipelineCanvas source",
    description: "The browser-native source for the node and pipeline canvas add-on.",
    path: "/dist/fluxaway-canvas.js",
    mode: "javascript",
    backLabel: "PipelineCanvas",
    backPath: "/addons/pipeline-canvas",
  },
});

export function sourceDocumentFor(slug) {
  return SOURCE_DOCUMENTS[slug] ?? null;
}
