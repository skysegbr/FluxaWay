import { h } from "/dist/nexa.js";
import { ZoomStage } from "/dist/nexa-zoom.js";

function ZoomPreview() {
  const frames = [
    {
      id: "start",
      x: 0,
      y: 0,
      w: 520,
      h: 280,
      label: "Start",
      content: h(
        "section",
        { className: "nd-addon-frame" },
        h("h3", null, "A spatial presentation"),
        h("p", null, "Click the stage or press →"),
      ),
    },
    {
      id: "detail",
      x: 680,
      y: 180,
      w: 360,
      h: 220,
      rotate: -6,
      label: "Detail",
      content: h(
        "section",
        { className: "nd-addon-frame" },
        h("h3", null, "Normal Nexa content"),
        h("p", null, "One canvas, an animated camera."),
      ),
    },
  ];

  return h(
    "div",
    { className: "nd-addon-stage" },
    h(ZoomStage, { frames, duration: 500, ariaLabel: "ZoomStage documentation demo" }),
  );
}

export const ADDON_ENTRIES = [
  {
    name: "ZoomStage",
    slug: "zoom-stage",
    category: "addons",
    module: "nexa-zoom.js",
    summary:
      "A Prezi-style presentation canvas whose camera flies between normal Nexa content frames.",
    demos: [
      {
        id: "zoom-preview",
        title: "Two-frame guided tour",
        note: "Click the stage or use the arrow keys to move between frames.",
        render: ZoomPreview,
        code: `const frames = [
  { id: "start", x: 0, y: 0, w: 520, h: 280, content: h(TitleFrame) },
  { id: "detail", x: 680, y: 180, w: 360, h: 220, content: h(DetailFrame) },
];

return h(ZoomStage, {
  frames,
  duration: 500,
  ariaLabel: "Product tour",
});`,
      },
    ],
    props: [
      { name: "frames", type: "Frame[]", default: "[]", description: "World geometry and vdom content." },
      { name: "index", type: "number", description: "Controlled active frame." },
      { name: "freeZoom", type: "boolean", default: "false", description: "Enables wheel/pinch zoom and pan." },
      { name: "controllerRef", type: "Ref", description: "Exposes navigation and camera controls." },
    ],
    resources: [
      { label: "Architecture presentation", href: "/examples/nexa-architecture/" },
      { label: "Atlas presentation", href: "/examples/nexa-atlas/" },
      { label: "Free-zoom star atlas", href: "/examples/star-atlas/" },
    ],
    notes: [
      "Load /dist/nexa-zoom.css next to the module.",
      "Use ZoomStage for presentations and tours instead of scroll-snap sections.",
    ],
  },
];
