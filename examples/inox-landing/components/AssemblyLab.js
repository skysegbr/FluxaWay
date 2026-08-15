import { h, useState } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { useTimeline, stagger } from "/dist/fluxaway-motion.js";
import { ASSEMBLY_STEPS } from "../data.js";
import { SectionNext } from "./SectionNext.js";
import { useRevealTimeline } from "./useRevealTimeline.js";

export function AssemblyLab() {
  const [activeStep, setActiveStep] = useState("raw");
  const pinTrack = [
    { at: 0, y: -90, scale: 0.2, opacity: 0 },
    { at: 2360, y: 0, scale: 1, opacity: 1, ease: "outBack" },
  ];
  const assembly = useTimeline({
    duration: 3000,
    autoplay: false,
    labels: { inspect: 1450, locked: 3000 },
    tracks: {
      left: [
        { at: 0, x: -230, rotate: -18, opacity: 0.3 },
        { at: 1450, x: -58, rotate: -4, opacity: 0.85, ease: "inOutCubic" },
        { at: 3000, x: 0, rotate: 0, opacity: 1, ease: "outBack" },
      ],
      right: [
        { at: 0, x: 230, rotate: 18, opacity: 0.3 },
        { at: 1450, x: 58, rotate: 4, opacity: 0.85, ease: "inOutCubic" },
        { at: 3000, x: 0, rotate: 0, opacity: 1, ease: "outBack" },
      ],
      core: [
        { at: 0, scale: 0.25, rotate: -120, opacity: 0 },
        { at: 1450, scale: 0.72, rotate: -30, opacity: 0.76, ease: "inOutCubic" },
        { at: 3000, scale: 1, rotate: 0, opacity: 1, ease: "outElastic" },
      ],
      gauge: [
        { at: 0, rotate: -130, opacity: 0.2 },
        { at: 1450, rotate: -38, opacity: 0.72, ease: "inOutCubic" },
        { at: 3000, rotate: 0, opacity: 1, ease: "outCubic" },
      ],
      pin0: stagger(pinTrack, 115, 0),
      pin1: stagger(pinTrack, 115, 1),
      pin2: stagger(pinTrack, 115, 2),
      pin3: stagger(pinTrack, 115, 3),
    },
  });
  const reveal = useTimeline({
    duration: 1200,
    autoplay: false,
    tracks: {
      heading: [
        { at: 0, y: 45, opacity: 0 },
        { at: 760, y: 0, opacity: 1, ease: "outCubic" },
      ],
      console: [
        { at: 180, y: 70, opacity: 0 },
        { at: 1050, y: 0, opacity: 1, ease: "outCubic" },
      ],
    },
  });
  const sectionRef = useRevealTimeline(reveal, 0.12);

  const selectStep = (step) => {
    setActiveStep(step.id);
    if (step.id === "locked") assembly.gotoAndPlay(0);
    else assembly.gotoAndStop(step.time);
  };

  return h(
    "section",
    { className: "il-assembly", id: "assembly", ref: sectionRef },
    h(
      "div",
      { className: "il-shell" },
      h(
        "header",
        { className: "il-assembly-head", ref: reveal.track("heading") },
        h("div", null, h("p", { className: "il-eyebrow" }, "ASSEMBLY SEQUENCE"), h("h2", { className: "il-section-title" }, "Motion that locks into place.")),
        h("p", null, "This scene does not orbit or float. Its pieces travel with weight, pause for inspection and finish in a precise mechanical fit."),
      ),
      h(
        "div",
        { className: "il-assembly-console", ref: reveal.track("console") },
        h(
          "div",
          { className: "il-assembly-stage", ariaLabel: "Interactive stainless steel assembly sequence" },
          h("span", { className: "il-stage-grid", ariaHidden: "true" }),
          h("span", { className: "il-assembly-gauge", ref: assembly.track("gauge"), ariaHidden: "true" }),
          h("span", { className: "il-assembly-plate il-assembly-left", ref: assembly.track("left"), ariaHidden: "true" }),
          h("span", { className: "il-assembly-plate il-assembly-right", ref: assembly.track("right"), ariaHidden: "true" }),
          h("span", { className: "il-assembly-core", ref: assembly.track("core"), ariaHidden: "true" }),
          [0, 1, 2, 3].map((pin) =>
            h(
              "i",
              { key: pin, className: `il-pin il-pin-${pin}`, ref: assembly.track(`pin${pin}`), ariaHidden: "true" },
              h("span", null),
            ),
          ),
          h("span", { className: "il-stage-axis il-stage-axis-x", ariaHidden: "true" }),
          h("span", { className: "il-stage-axis il-stage-axis-y", ariaHidden: "true" }),
        ),
        h(
          "aside",
          { className: "il-assembly-panel" },
          h("div", { className: "il-panel-status" }, h("span", null, "SEQUENCE STATE"), h("strong", null, activeStep.toUpperCase())),
          h(
            "div",
            { className: "il-step-list" },
            ASSEMBLY_STEPS.map((step) =>
              h(Button, {
                key: step.id,
                variant: step.id === activeStep ? "contained" : "outline",
                onClick: () => selectStep(step),
              }, step.label),
            ),
          ),
          h(
            "dl",
            { className: "il-assembly-readout" },
            h("div", null, h("dt", null, "Axis deviation"), h("dd", null, activeStep === "locked" ? "0.00°" : activeStep === "inspect" ? "0.18°" : "12.40°")),
            h("div", null, h("dt", null, "Fit pressure"), h("dd", null, activeStep === "locked" ? "86 kN" : activeStep === "inspect" ? "12 kN" : "0 kN")),
            h("div", null, h("dt", null, "Motion label"), h("dd", null, activeStep === "locked" ? "outBack" : "inOutCubic")),
          ),
          h("p", { className: "il-panel-note" }, "Select Inspect for the midpoint, Separate for the raw geometry, or Lock to replay the complete timeline."),
        ),
      ),
      h("div", { className: "il-assembly-next" }, h(SectionNext, { href: "#systems", label: "Review system character" })),
    ),
  );
}
