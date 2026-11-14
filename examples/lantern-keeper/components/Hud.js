import { h, useEffect, useState } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

// The bar over the world: where you are, and the four things you can toggle.
export function Hud({ game, hints, onHints, journalOpen, onJournal }) {
  const [confirming, setConfirming] = useState(false);
  const found = game.notes.length;
  const total = Object.keys(game.journal).length;

  // "Restart" erases the save, so it asks once and forgets the question again.
  useEffect(() => {
    if (!confirming) return undefined;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return h(
    "header",
    { className: "lk-hud" },
    h("p", { className: "lk-hud-place" }, game.sceneData.label),
    h(
      "div",
      { className: "lk-hud-actions" },
      h(Button, {
        variant: journalOpen ? "tonal" : "text",
        ariaExpanded: journalOpen ? "true" : "false",
        ariaControls: "lk-journal",
        onClick: onJournal,
      }, `Journal ${found}/${total}`),
      h(Button, {
        variant: hints ? "tonal" : "text",
        ariaPressed: hints ? "true" : "false",
        onClick: onHints,
      }, "Hints"),
      h(Button, {
        variant: "text",
        ariaPressed: game.muted ? "false" : "true",
        onClick: () => game.mute(),
      }, game.muted ? "Sound off" : "Sound on"),
      h(Button, {
        variant: confirming ? "contained" : "text",
        onClick: () => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          setConfirming(false);
          game.reset();
        },
      }, confirming ? "Erase and restart?" : "Restart"),
    ),
  );
}
