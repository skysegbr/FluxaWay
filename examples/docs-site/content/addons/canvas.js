import { h } from "/dist/fluxaway.js";
import { PipelineCanvas } from "/dist/fluxaway-canvas.js";

const NODES = [
  { id: 1, label: "Extract", x: 40, y: 40, status: "success" },
  { id: 2, label: "Transform", x: 250, y: 150, deps: [1] },
  { id: 3, label: "Load", x: 470, y: 60, deps: [2] },
];

function CanvasPreview() {
  return h(PipelineCanvas, {
    nodes: NODES,
    style: "width:100%;height:22rem",
  });
}

export const ADDON_ENTRIES = [
  {
    name: "PipelineCanvas",
    slug: "pipeline-canvas",
    category: "addons",
    module: "fluxaway-canvas.js",
    summary:
      "An SVG node and pipeline editor with drag, connections, pan, zoom, mini-map and undo/redo.",
    demos: [
      {
        id: "pipeline-preview",
        title: "Interactive pipeline",
        note: "Drag nodes, pan the canvas and use the built-in zoom controls.",
        render: CanvasPreview,
        code: `const nodes = [
  { id: 1, label: "Extract", x: 40, y: 40 },
  { id: 2, label: "Transform", x: 250, y: 150, deps: [1] },
];

return h(PipelineCanvas, {
  nodes,
  onNodeMove: (id, x, y) => moveNode(id, x, y),
  onNodeConnect: (fromId, toId) => connect(fromId, toId),
});`,
      },
    ],
    props: [
      { name: "nodes", type: "Node[]", default: "[]", description: "Nodes and dependency edges." },
      { name: "onNodeMove", type: "(id, x, y) => void", description: "Reports a committed move." },
      { name: "onNodeConnect", type: "(fromId, toId) => void", description: "Reports a new edge." },
      { name: "controllerRef", type: "Ref", description: "Exposes zoom, fit and undo controls." },
    ],
    resources: [
      { label: "PipelineCanvas source", href: "#/source/pipeline-canvas-source" },
      { label: "Canvas API in the README", href: "#/source/pipeline-canvas-readme" },
    ],
    notes: ["Load /dist/fluxaway-canvas.css next to the module."],
  },
];
