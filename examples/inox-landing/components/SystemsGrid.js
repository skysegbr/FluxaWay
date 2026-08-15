import { h } from "/dist/fluxaway.js";
import { useTimeline, stagger } from "/dist/fluxaway-motion.js";
import { SYSTEMS } from "../data.js";
import { SectionNext } from "./SectionNext.js";
import { useRevealTimeline } from "./useRevealTimeline.js";

export function SystemsGrid() {
  const leftReveal = [
    { at: 0, x: -72, opacity: 0 },
    { at: 900, x: 0, opacity: 1, ease: "outCubic" },
  ];
  const rightReveal = [
    { at: 0, x: 72, opacity: 0 },
    { at: 900, x: 0, opacity: 1, ease: "outCubic" },
  ];
  const tracks = {
    heading: [
      { at: 0, y: 46, opacity: 0 },
      { at: 780, y: 0, opacity: 1, ease: "outCubic" },
    ],
  };
  SYSTEMS.forEach((_, index) => {
    tracks[`system${index}`] = stagger(index % 2 ? rightReveal : leftReveal, 140, index + 2);
  });
  const timeline = useTimeline({ duration: 1900, autoplay: false, tracks });
  const sectionRef = useRevealTimeline(timeline, 0.14);

  return h(
    "section",
    { className: "il-systems", id: "systems", ref: sectionRef },
    h(
      "div",
      { className: "il-shell" },
      h(
        "header",
        { className: "il-systems-head", ref: timeline.track("heading") },
        h("p", { className: "il-eyebrow" }, "SYSTEM CHARACTER"),
        h("h2", { className: "il-section-title" }, "Not gray.", h("br"), "Engineered."),
        h("p", null, "The Inox finish behaves like a material system, not a palette swap."),
      ),
      h(
        "div",
        { className: "il-system-grid" },
        SYSTEMS.map((system, index) =>
          h(
            "article",
            { key: system.number, className: "il-system-card", ref: timeline.track(`system${index}`) },
            h("span", { className: "il-system-number" }, system.number),
            h("span", { className: "il-system-cut", ariaHidden: "true" }),
            h("h3", null, system.title),
            h("p", null, system.text),
            h("footer", null, system.meta),
          ),
        ),
      ),
      h("div", { className: "il-systems-next" }, h(SectionNext, { href: "#protocol", label: "Finish the protocol" })),
    ),
  );
}
