import { h, render } from "/dist/fluxaway.js";
import { createGame } from "/dist/fluxaway-game.js";
import { STORY } from "./data.js";
import { Shell } from "./components/Shell.js";

// One game for the page. The title screen starts it from a button — the press
// that also lets the browser play sound.
const game = createGame(STORY);

game.on("note", () => game.sound("chime"));
game.on("item", ({ held }) => {
  if (held) game.sound("pick");
});

function App() {
  return h(Shell, { game });
}

render(App, document.getElementById("app"));
