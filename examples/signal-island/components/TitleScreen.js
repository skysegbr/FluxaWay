import { h, useEffect, useRef } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

const CONTROLS = [
  ["W A S D / arrows", "walk and turn"],
  ["Drag", "look around"],
  ["Shift", "run"],
  ["E", "use what is within reach"],
];

export function TitleScreen({ canContinue, onNew, onContinue }) {
  const actionsRef = useRef(null);

  useEffect(() => {
    actionsRef.current?.querySelector("button")?.focus({ preventScroll: true });
  }, []);

  return h(
    "section",
    { className: "si-title", ariaLabelledby: "si-title-heading" },
    h(
      "div",
      { className: "si-title-card" },
      h("p", { className: "si-title-eyebrow" }, "A FluxaWay game"),
      h("h1", { id: "si-title-heading" }, "Signal Island"),
      h("p", { className: "si-title-blurb" },
        "A weather station at dusk, a mast with no light on it, and nobody home."),
      h(
        "div",
        { className: "si-title-actions", ref: actionsRef },
        canContinue ? h(Button, { variant: "contained", onClick: onContinue }, "Continue") : null,
        h(Button, { variant: canContinue ? "outlined" : "contained", onClick: onNew }, "New game"),
      ),
      h(
        "dl",
        { className: "si-title-controls" },
        CONTROLS.map(([keys, does]) => [
          h("dt", { key: `${keys}-k` }, keys),
          h("dd", { key: `${keys}-d` }, does),
        ]),
      ),
      h("p", { className: "si-title-help" }, "On a touch screen: the stick walks, a drag looks."),
    ),
  );
}
