import { h, useEffect, useRef, useState } from "/dist/fluxaway.js";
import { useTimeline } from "/dist/fluxaway-motion.js";

export function TitleScreen({ canContinue, onNew, onContinue }) {
  const [relaxed, setRelaxed] = useState(false);
  const root = useRef(null);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intro = useTimeline({ duration: reduced ? 0 : 800, tracks: {
    copy: [{ at: 0, opacity: 0, y: 18 }, { at: reduced ? 0 : 800, opacity: 1, y: 0, ease: "outCubic" }],
  } });
  useEffect(() => { root.current?.querySelector("button")?.focus({ preventScroll: true }); }, []);
  return h("section", { className: "lr-title", ariaLabelledby: "lr-title", ref: root },
    h("div", { className: "lr-title-copy", ref: intro.track("copy") },
      h("p", { className: "lr-eyebrow" }, h("span", { className: "lr-tiny-star", ariaHidden: "true" }, "✧"), " A small adventure after dark"),
      h("h1", { id: "lr-title" }, "Lumen", h("em", null, "Run.")),
      h("p", { className: "lr-tagline" }, "A little light goes a long way."),
      h("p", { className: "lr-title-description" }, "The gardens have gone quiet. Gather wandering lights, outwit the shadows, and bring the night back to life."),
      h("div", { className: "lr-title-actions" },
        canContinue ? h("button", { className: "lr-button lr-primary", onClick: onContinue }, "Continue your journey", h("span", { ariaHidden: "true" }, "↗")) : null,
        h("button", { className: `lr-button ${canContinue ? "lr-secondary" : "lr-primary"}`, onClick: () => onNew(relaxed) },
          canContinue ? "Start a new journey" : "Enter the garden", h("span", { ariaHidden: "true" }, "→")),
      ),
      h("label", { className: "lr-relaxed" }, h("input", { type: "checkbox", checked: relaxed, onChange: (event) => setRelaxed(event.target.checked) }),
        "Gentle journey", h("span", null, "Explore without taking damage")),
      h("div", { className: "lr-title-details" }, h("span", null, "3 enchanted gardens"), h("span", { ariaHidden: "true" }, "·"), h("span", null, "One brave little courier")),
    ),
    h("div", { className: "lr-world-caption", ariaHidden: "true" }, h("span", null, "01 / THE MOSSLIGHT GARDEN"), h("p", null, "Somewhere, a lantern is waiting.")),
  );
}
