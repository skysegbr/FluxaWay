import { h, useEffect, useState } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

// The bar over the world. `panel` is which side panel is open: "journal",
// "map" or null.
export function Hud({ game, panel, onPanel }) {
  const [confirming, setConfirming] = useState(false);
  const found = game.notes.length;
  const total = Object.keys(game.journal).length;

  // "Restart" erases the save, so it asks once and forgets the question again.
  useEffect(() => {
    if (!confirming) return undefined;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  const toggle = (name, label) => h(Button, {
    variant: panel === name ? "tonal" : "text",
    ariaExpanded: panel === name ? "true" : "false",
    ariaControls: "si-panel",
    onClick: () => onPanel(panel === name ? null : name),
  }, label);

  return h(
    "header",
    { className: "si-hud" },
    h("p", { className: "si-hud-place" }, game.sceneData.label),
    h(
      "div",
      { className: "si-hud-actions" },
      toggle("journal", `Journal ${found}/${total}`),
      toggle("map", "Map"),
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
