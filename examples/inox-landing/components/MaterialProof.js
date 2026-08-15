import { h } from "/dist/fluxaway.js";
import { useTimeline, stagger } from "/dist/fluxaway-motion.js";
import { MATERIAL_METRICS } from "../data.js";
import { SectionNext } from "./SectionNext.js";
import { useRevealTimeline } from "./useRevealTimeline.js";

const LAB_IMAGE = new URL("../assets/precision-lab.webp", import.meta.url).href;

export function MaterialProof() {
  const statReveal = [
    { at: 0, y: 36, opacity: 0 },
    { at: 860, y: 0, opacity: 1, ease: "outCubic" },
  ];
  const timeline = useTimeline({
    duration: 2100,
    autoplay: false,
    tracks: {
      image: [
        { at: 0, scale: 1.08, opacity: 0.35 },
        { at: 1450, scale: 1, opacity: 1, ease: "outCubic" },
      ],
      shutterA: [{ at: 200, x: 0 }, { at: 1250, x: -360, opacity: 0, ease: "inOutCubic" }],
      shutterB: [{ at: 280, x: 0 }, { at: 1330, x: 360, opacity: 0, ease: "inOutCubic" }],
      copy: [
        { at: 520, x: 52, opacity: 0 },
        { at: 1450, x: 0, opacity: 1, ease: "outCubic" },
      ],
      stat0: stagger(statReveal, 140, 7),
      stat1: stagger(statReveal, 140, 8),
      stat2: stagger(statReveal, 140, 9),
    },
  });
  const sectionRef = useRevealTimeline(timeline, 0.18);

  return h(
    "section",
    { className: "il-material", id: "material", ref: sectionRef },
    h(
      "div",
      { className: "il-material-image", ref: timeline.track("image") },
      h("img", { src: LAB_IMAGE, alt: "Robotic arms inspecting a suspended stainless steel ring in a precision laboratory" }),
      h("span", { className: "il-shutter il-shutter-left", ref: timeline.track("shutterA"), ariaHidden: "true" }),
      h("span", { className: "il-shutter il-shutter-right", ref: timeline.track("shutterB"), ariaHidden: "true" }),
    ),
    h(
      "div",
      { className: "il-shell il-material-inner" },
      h(
        "div",
        { className: "il-material-copy", ref: timeline.track("copy") },
        h("p", { className: "il-eyebrow" }, "MATERIAL PROOF"),
        h("h2", { className: "il-section-title" }, "Cold by nature.", h("br"), "Clear by design."),
        h(
          "p",
          null,
          "Real inox is not a flat gray. Its identity comes from directional grain, sharp highlights, dark reflection and the movement between them.",
        ),
        h(SectionNext, { href: "#assembly", label: "Enter the assembly" }),
      ),
      h(
        "dl",
        { className: "il-material-metrics" },
        MATERIAL_METRICS.map((metric, index) =>
          h(
            "div",
            { key: metric.label, ref: timeline.track(`stat${index}`) },
            h("dt", null, metric.label),
            h("dd", null, metric.value),
          ),
        ),
      ),
    ),
  );
}
