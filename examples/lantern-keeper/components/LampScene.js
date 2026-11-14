import { h, useEffect } from "/dist/fluxaway.js";
import { useTimeline } from "/dist/fluxaway-motion.js";
import { cutscenes } from "../cutscenes.js";
import { SceneArt } from "./SceneArt.js";

// The cutscene the story waits for: the flame catches, then the beam swings
// out over the sea. Not autoplayed — data.js runs it with game.play().
const IGNITION = {
  autoplay: false,
  duration: 2800,
  tracks: {
    flame: [{ at: 0, opacity: 0, scale: 0.3 }, { at: 1000, opacity: 1, scale: 1, ease: "outCubic" }],
    beam: [
      { at: 0, opacity: 0, rotate: -26 },
      { at: 800, opacity: 0, rotate: -26 },
      { at: 2800, opacity: 1, rotate: 0, ease: "inOutCubic" },
    ],
  },
};

const MULLIONS = [200, 480, 1120, 1400];

export function LampScene({ game }) {
  const ignition = useTimeline(IGNITION);
  const lit = Boolean(game.get("lit"));

  useEffect(() => {
    cutscenes.beam = ignition;
    return () => {
      if (cutscenes.beam === ignition) delete cutscenes.beam;
    };
  }, []);

  // A restored game arrives already lit, and a restarted one dark: put the
  // timeline on the matching frame. While the cutscene plays, leave it alone.
  useEffect(() => {
    if (ignition.isPlaying) return;
    if (lit) ignition.seek(ignition.duration);
    else ignition.gotoAndStop(0);
  }, [lit]);

  return h(
    SceneArt,
    { name: "lamp" },
    // the beam, behind the glass
    h("g", { ref: ignition.track("beam"), className: "lk-lamp-beam" },
      h("path", { d: "M 800 400 L 1700 250 V 560 Z" })),
    // the gallery: glass all around, in iron frames
    MULLIONS.map((x) => h("rect", { key: x, className: "lk-stone-dark", x, y: 0, width: 22, height: 720 })),
    h("rect", { className: "lk-stone-dark", x: 0, y: 150, width: 1600, height: 16 }),
    h("path", { className: "lk-rock", d: "M 0 720 H 1600 V 900 H 0 Z" }),
    h("path", { className: "lk-rock-light", d: "M 0 720 H 1600 V 746 H 0 Z" }),
    // the lantern
    h("path", { className: "lk-stone", d: "M 700 720 L 730 600 H 870 L 900 720 Z" }),
    h("rect", { className: "lk-brass", x: 716, y: 580, width: 168, height: 26, rx: 6 }),
    h("ellipse", { className: "lk-lamp-lens", cx: 800, cy: 410, rx: 130, ry: 170 }),
    h("path", { className: "lk-lamp-ribs", d: "M 800 240 V 580 M 720 276 Q 760 410 720 544 M 880 276 Q 840 410 880 544" }),
    h("g", { ref: ignition.track("flame"), className: "lk-lamp-flame" },
      h("ellipse", { className: "lk-glow", cx: 800, cy: 420, rx: 44, ry: 78 }),
      h("ellipse", { className: "lk-lamp-core", cx: 800, cy: 440, rx: 20, ry: 42 })),
    h("rect", { className: "lk-brass", x: 742, y: 214, width: 116, height: 30, rx: 8 }),
    // the desk and the log
    h("rect", { className: "lk-wood-dark", x: 1120, y: 660, width: 290, height: 22 }),
    h("path", { className: "lk-wood-dark", d: "M 1150 682 V 780 M 1380 682 V 780", "stroke-width": "18", stroke: "#4a3324" }),
    h("path", { className: "lk-lamp-book", d: "M 1170 660 L 1190 600 H 1350 L 1370 660 Z" }),
    h("path", { className: "lk-line", d: "M 1270 600 V 660" }),
    // the stairs
    h("path", { className: "lk-lamp-hatch", d: "M 150 860 L 190 700 H 350 L 390 860 Z" }),
    h("path", { className: "lk-chalk", d: "M 200 740 H 340 M 186 790 H 354 M 172 836 H 368" }),
  );
}
