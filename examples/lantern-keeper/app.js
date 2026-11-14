import { h, render } from "/dist/fluxaway.js";
import { createGame } from "/dist/fluxaway-game.js";
import { STORY } from "./data.js";
import { Shell } from "./components/Shell.js";

// One game for the page. It does not start here: the title screen calls
// game.start() from a button, and that press is what unlocks the sound.
const game = createGame(STORY);

game.on("note", () => game.sound("chime"));
game.on("item", ({ held }) => {
  if (held) game.sound("pick");
});

function App() {
  return h(Shell, { game });
}

render(App, document.getElementById("app"));
