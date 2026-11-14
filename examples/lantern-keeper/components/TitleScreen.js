import { h, useEffect, useRef } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

export function TitleScreen({ canContinue, onNew, onContinue }) {
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.querySelector("button")?.focus({ preventScroll: true });
  }, []);

  return h(
    "section",
    { className: "lk-title", ariaLabelledby: "lk-title-heading" },
    h(
      "div",
      { className: "lk-title-card" },
      h("p", { className: "lk-title-eyebrow" }, "A FluxaWay game"),
      h("h1", { id: "lk-title-heading" }, "The Lantern Keeper"),
      h("p", { className: "lk-title-blurb" },
        "A dark lighthouse, a boat left aground, and one night to find the way home."),
      h(
        "div",
        { className: "lk-title-actions", ref: firstRef },
        canContinue ? h(Button, { variant: "contained", onClick: onContinue }, "Continue") : null,
        h(Button, { variant: canContinue ? "outlined" : "contained", onClick: onNew }, "New game"),
      ),
      h("p", { className: "lk-title-help" },
        "Press what you see. Tab reaches everything; Enter uses it."),
    ),
  );
}
