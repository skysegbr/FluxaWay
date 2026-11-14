import { h, useEffect, useRef, useState } from "/dist/fluxaway.js";
import {
  GameDialogue, GameInventory, GameJournal, GamePrompt, GameStick, GameViewport, useGame,
} from "/dist/fluxaway-game.js";
import { createWorld } from "../world.js";
import { EndCard } from "./EndCard.js";
import { Hud } from "./Hud.js";
import { MapPanel } from "./MapPanel.js";
import { TitleScreen } from "./TitleScreen.js";

// Everything on screen. The viewport (the 3D island) and what sits over it are
// siblings in one `.m-game` box; each follows the game on its own.
export function Shell({ game: source }) {
  const game = useGame(source);
  const viewRef = useRef(null);
  const [panel, setPanel] = useState(null);

  // The engine saves whenever the story rests. Walking is not a story event,
  // so ask for a save now and then, and once more when the page is left.
  useEffect(() => {
    const save = () => game.save();
    const timer = setInterval(save, 4000);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  const begin = (resume) => {
    if (resume) game.load();
    else game.reset();
    setPanel(null);
    game.start();
  };

  return h(
    "main",
    { className: "si-shell" },
    h(
      "div",
      { className: "m-game si-game" },
      h(GameViewport, {
        game,
        world: createWorld,
        controllerRef: viewRef,
        ariaLabel: "The island, first person",
        errorLabel: "This island needs WebGL, and this browser did not provide it.",
      }),
      game.started ? h(Hud, { game, panel, onPanel: setPanel }) : null,
      game.started ? h(GameInventory, { game, className: "si-inventory", emptyLabel: "Empty pockets" }) : null,
      game.started
        ? h(GameStick, { className: "si-stick", onMove: (x, y) => viewRef.current?.input.setStick(x, y) })
        : null,
      h(GamePrompt, { game }),
      game.started && panel
        ? h(
          "aside",
          { id: "si-panel", className: "si-panel" },
          panel === "map"
            ? h(MapPanel, { game, readPose: () => viewRef.current?.world.pose() || null })
            : h(GameJournal, { game }),
        )
        : null,
      h(EndCard, null),
      h(GameDialogue, { game }),
      game.started
        ? null
        : h(TitleScreen, {
          canContinue: game.hasSave,
          onNew: () => begin(false),
          onContinue: () => begin(true),
        }),
    ),
  );
}
