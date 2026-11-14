import { h } from "/dist/fluxaway.js";
import { SceneArt } from "./SceneArt.js";

export function DoorScene({ game }) {
  const unlocked = Boolean(game.get("unlocked"));
  const canHere = !game.has("oil") && !game.get("lit");

  return h(
    SceneArt,
    { name: "door" },
    h("path", { className: "lk-rock", d: "M 0 900 V 700 Q 300 640 620 720 H 1600 V 900 Z" }),
    // the tower
    h("path", { className: "lk-stone", d: "M 470 760 L 560 0 H 1040 L 1130 760 Z" }),
    h("path", { className: "lk-stone-dark", d: "M 1040 0 L 1130 760 H 1010 L 950 0 Z" }),
    h("path", { className: "lk-line lk-door-course", d: "M 536 200 H 1064 M 512 420 H 1090 M 490 620 H 1112" }),
    // the steps
    h("rect", { className: "lk-stone-dark", x: 620, y: 760, width: 360, height: 34 }),
    h("rect", { className: "lk-rock-light", x: 580, y: 794, width: 440, height: 34 }),
    // the door: an arch, and the leaf — ajar once the key has turned
    h("path", { className: "lk-door-arch", d: "M 680 760 V 420 Q 800 300 920 420 V 760 Z" }),
    unlocked
      ? h("path", { className: "lk-wood", d: "M 696 760 V 428 Q 760 366 800 352 V 760 Z" })
      : h("path", { className: "lk-wood", d: "M 696 760 V 428 Q 800 326 904 428 V 760 Z" }),
    unlocked ? null : h("path", { className: "lk-line", d: "M 800 352 V 760" }),
    unlocked ? null : h("circle", { className: "lk-brass", cx: 872, cy: 590, r: 12 }),
    // the plaque
    h("rect", { className: "lk-brass", x: 396, y: 396, width: 158, height: 98, rx: 8 }),
    h("path", { className: "lk-line", d: "M 420 428 H 530 M 420 452 H 512 M 420 476 H 524" }),
    // the oil can
    canHere
      ? h(
        "g",
        null,
        h("rect", { className: "lk-can", x: 1040, y: 690, width: 92, height: 110, rx: 10 }),
        h("path", { className: "lk-can-spout", d: "M 1116 706 L 1158 668" }),
        h("rect", { className: "lk-brass", x: 1066, y: 670, width: 40, height: 24, rx: 5 }),
      )
      : null,
    // the way down
    h("path", { className: "lk-shore-path", d: "M 300 830 Q 190 800 150 720 T 40 600" }),
  );
}
