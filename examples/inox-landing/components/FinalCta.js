import { h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { useTimeline, stagger } from "/dist/fluxaway-motion.js";
import { useRevealTimeline } from "./useRevealTimeline.js";

function AlloySeal() {
  const bladeTrack = [
    { at: 0, x: -34, opacity: 0.25 },
    { at: 900, x: 0, opacity: 1, ease: "inOutCubic" },
    { at: 1180, x: 0, opacity: 1 },
    { at: 2080, x: 34, opacity: 0.25, ease: "inOutCubic" },
    { at: 2980, x: 0, opacity: 1, ease: "inOutCubic" },
    { at: 3260, x: 0, opacity: 1 },
    { at: 4160, x: -34, opacity: 0.25, ease: "inOutCubic" },
  ];
  const timeline = useTimeline({
    // The final staggered blade reaches the same left-edge state at 4480 ms.
    // Matching the end and start frames keeps the infinite wrap continuous.
    duration: 4480,
    loop: true,
    tracks: {
      blade0: stagger(bladeTrack, 80, 0),
      blade1: stagger(bladeTrack, 80, 1),
      blade2: stagger(bladeTrack, 80, 2),
      blade3: stagger(bladeTrack, 80, 3),
      blade4: stagger(bladeTrack, 80, 4),
    },
  });

  return h(
    "span",
    { className: "il-alloy-seal", ariaHidden: "true" },
    [0, 1, 2, 3, 4].map((blade) => h("i", { key: blade, ref: timeline.track(`blade${blade}`) })),
  );
}

export function FinalCta() {
  const timeline = useTimeline({
    duration: 1500,
    autoplay: false,
    tracks: {
      seal: [
        { at: 0, scale: 0.6, opacity: 0 },
        { at: 900, scale: 1, opacity: 1, ease: "outBack" },
      ],
      copy: [
        { at: 180, y: 54, opacity: 0 },
        { at: 1080, y: 0, opacity: 1, ease: "outCubic" },
      ],
      action: [
        { at: 420, y: 28, opacity: 0 },
        { at: 1250, y: 0, opacity: 1, ease: "outCubic" },
      ],
    },
  });
  const sectionRef = useRevealTimeline(timeline, 0.3);

  return h(
    "section",
    { className: "il-final", id: "protocol", ref: sectionRef },
    h("div", { ref: timeline.track("seal") }, h(AlloySeal, null)),
    h(
      "div",
      { className: "il-final-copy", ref: timeline.track("copy") },
      h("p", { className: "il-eyebrow" }, "PROTOCOL READY"),
      h("h2", null, "Build with weight.", h("span", null, "Move with purpose.")),
      h("p", null, "A distinct landing page, one real material system, and motion authored directly in FluxaWay."),
    ),
    h(
      "div",
      { className: "il-final-actions", ref: timeline.track("action") },
      h(Button, { variant: "outline", effect: "conductor", onClick: () => scrollTo({ top: 0, behavior: "smooth" }) }, "Replay from top"),
      h("a", { className: "il-final-link", href: "../metallic-themes/" }, "Explore every alloy", h("span", { ariaHidden: "true" }, "↗")),
    ),
  );
}
