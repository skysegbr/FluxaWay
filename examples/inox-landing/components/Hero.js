import { h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { useTimeline, stagger } from "/dist/fluxaway-motion.js";
import { SectionNext } from "./SectionNext.js";

const HERO_IMAGE = new URL("../assets/inox-turbine.webp", import.meta.url).href;

function InspectionOverlay() {
  const timeline = useTimeline({
    duration: 4600,
    loop: true,
    tracks: {
      scan: [
        { at: 0, y: -330, opacity: 0 },
        { at: 400, opacity: 0.75 },
        { at: 4000, y: 330, opacity: 0.75, ease: "linear" },
        { at: 4600, opacity: 0 },
      ],
      reticle: [
        { at: 0, rotate: 0, scale: 0.94, opacity: 0.5 },
        { at: 2300, rotate: 180, scale: 1.06, opacity: 1, ease: "inOutCubic" },
        { at: 4600, rotate: 360, scale: 0.94, opacity: 0.5, ease: "inOutCubic" },
      ],
    },
  });

  return h(
    "div",
    { className: "il-inspection-overlay", ariaHidden: "true" },
    h("span", { className: "il-scan-line", ref: timeline.track("scan") }),
    h("span", { className: "il-reticle", ref: timeline.track("reticle") }),
  );
}

export function Hero() {
  const copyReveal = [
    { at: 0, x: -52, opacity: 0 },
    { at: 920, x: 0, opacity: 1, ease: "outCubic" },
  ];
  const railReveal = [
    { at: 0, y: -220, opacity: 0 },
    { at: 1100, y: 0, opacity: 1, ease: "outCubic" },
  ];
  const timeline = useTimeline({
    duration: 2300,
    tracks: {
      eyebrow: copyReveal,
      title: stagger(copyReveal, 150, 1),
      lead: stagger(copyReveal, 150, 2),
      actions: stagger(copyReveal, 150, 3),
      media: [
        { at: 180, x: 100, scale: 1.12, opacity: 0 },
        { at: 1500, x: 0, scale: 1, opacity: 1, ease: "outCubic" },
      ],
      railA: stagger(railReveal, 140, 2),
      railB: stagger(railReveal, 140, 3),
      railC: stagger(railReveal, 140, 4),
      metrics: [
        { at: 1200, y: 32, opacity: 0 },
        { at: 2050, y: 0, opacity: 1, ease: "outCubic" },
      ],
    },
  });

  return h(
    "section",
    { className: "il-hero", id: "top" },
    h("div", { className: "il-hero-coordinate", ariaHidden: "true" }, "X 07.42 / Y 19.06"),
    h(
      "div",
      { className: "il-hero-rails", ariaHidden: "true" },
      h("i", { ref: timeline.track("railA") }),
      h("i", { ref: timeline.track("railB") }),
      h("i", { ref: timeline.track("railC") }),
    ),
    h(
      "div",
      { className: "il-shell il-hero-inner" },
      h(
        "div",
        { className: "il-hero-copy" },
        h("p", { className: "il-eyebrow", ref: timeline.track("eyebrow") }, "MATERIAL INTERFACE / INOX"),
        h(
          "h1",
          { ref: timeline.track("title") },
          h("span", { className: "il-hero-title-main" }, "Precision"),
          h("span", { className: "il-hero-title-metal" }, "has a surface."),
        ),
        h(
          "p",
          { className: "il-hero-lead", ref: timeline.track("lead") },
          "A FluxaWay landing experience where brushed metal, cold light and mechanical motion form one coherent interface.",
        ),
        h(
          "div",
          { className: "il-hero-actions", ref: timeline.track("actions") },
          h(Button, { variant: "outline", effect: "conductor", onClick: () => timeline.gotoAndPlay(0) }, "Replay assembly"),
          h(SectionNext, { href: "#material", label: "Inspect the material" }),
        ),
      ),
      h(
        "div",
        { className: "il-hero-media", ref: timeline.track("media") },
        h("img", { src: HERO_IMAGE, alt: "Precision-machined stainless steel turbine sculpture in a dark studio" }),
        h(InspectionOverlay, null),
        h("span", { className: "il-image-code" }, "ALLOY / 304-L · FRAME 001"),
      ),
      h(
        "dl",
        { className: "il-hero-metrics", ref: timeline.track("metrics") },
        h("div", null, h("dt", null, "Composition"), h("dd", null, "18% Cr / 8% Ni")),
        h("div", null, h("dt", null, "Finish"), h("dd", null, "Brushed / No. 4")),
        h("div", null, h("dt", null, "Runtime"), h("dd", null, "Native ESM")),
      ),
    ),
  );
}
