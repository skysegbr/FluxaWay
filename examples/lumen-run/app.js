import { h, render } from "/dist/fluxaway.js";
import { createGame } from "/dist/fluxaway-game.js";
import { STORY } from "./story.js";
import { Shell } from "./components/Shell.js";

export const game = createGame(STORY);
render(() => h(Shell, { game }), document.getElementById("app"));
