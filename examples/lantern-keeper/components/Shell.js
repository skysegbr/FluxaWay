import { h, useState } from "/dist/fluxaway.js";
import { GameDialogue, GameInventory, GameJournal, GameStage, useGame } from "/dist/fluxaway-game.js";
import { Hud } from "./Hud.js";
import { TitleScreen } from "./TitleScreen.js";

// Everything on screen. The stage, the dialogue and the HUD are siblings in
// one `.m-game` box; each follows the game on its own.
export function Shell({ game: source }) {
  const game = useGame(source);
  const [hints, setHints] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);

  const begin = (resume) => {
    if (resume) game.load();
    else game.reset();
    setJournalOpen(false);
    game.start();
  };

  return h(
    "main",
    { className: "lk-shell" },
    h(
      "div",
      { className: "m-game lk-game" },
      h(GameStage, { game, hints, ariaLabel: "The lighthouse" }),
      game.started
        ? h(Hud, {
          game,
          hints,
          onHints: () => setHints(!hints),
          journalOpen,
          onJournal: () => setJournalOpen(!journalOpen),
        })
        : null,
      game.started ? h(GameInventory, { game, className: "lk-inventory", emptyLabel: "Empty pockets" }) : null,
      game.started && journalOpen
        ? h("aside", { id: "lk-journal", className: "lk-journal" }, h(GameJournal, { game }))
        : null,
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
