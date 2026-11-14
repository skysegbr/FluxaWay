import { h, useEffect } from "/dist/fluxaway.js";
import { useTimeline } from "/dist/fluxaway-motion.js";
import { SceneArt, prefersReducedMotion } from "./SceneArt.js";

// A slow swell. Every track ends where it began, so the loop has no seam.
const SWELL = {
  autoplay: false,
  loop: true,
  duration: 6000,
  tracks: {
    near: [{ at: 0, x: 0 }, { at: 3000, x: -70, ease: "inOutQuad" }, { at: 6000, x: 0, ease: "inOutQuad" }],
    far: [{ at: 0, x: -40 }, { at: 3000, x: 30, ease: "inOutQuad" }, { at: 6000, x: -40, ease: "inOutQuad" }],
  },
};

const WAVE_NEAR = "M -200 600 Q -100 570 0 600 T 200 600 T 400 600 T 600 600 T 800 600 T 1000 600 T 1200 600 T 1400 600 T 1600 600 T 1800 600 V 900 H -200 Z";
const WAVE_FAR = "M -200 540 Q -100 520 0 540 T 200 540 T 400 540 T 600 540 T 800 540 T 1000 540 T 1200 540 T 1400 540 T 1600 540 T 1800 540 V 900 H -200 Z";

export function ShoreScene({ game, active }) {
  const swell = useTimeline(SWELL);
  const lit = Boolean(game.get("lit"));
  const crateOpen = game.has("key") || Boolean(game.get("unlocked"));

  // The sea only moves while the camera is here.
  useEffect(() => {
    if (active && !prefersReducedMotion()) swell.play();
    else swell.stop();
  }, [active]);

  return h(
    SceneArt,
    { name: "shore" },
    // the rock and the lighthouse on it
    h("path", { className: "lk-rock", d: "M 1150 900 L 1230 520 L 1330 300 L 1470 210 L 1600 190 V 900 Z" }),
    h("path", { className: "lk-rock-light", d: "M 1330 300 L 1470 210 L 1600 190 V 330 L 1450 300 Z" }),
    h("path", { className: "lk-stone", d: "M 1432 210 L 1444 80 H 1486 L 1498 210 Z" }),
    h("rect", { className: "lk-stone-dark", x: 1436, y: 56, width: 58, height: 26, rx: 4 }),
    h("circle", { className: lit ? "lk-glow lk-shore-lamp" : "lk-stone-dark", cx: 1465, cy: 68, r: 9 }),
    lit ? h("path", { className: "lk-shore-beam", d: "M 1465 68 L 0 420 L 0 620 Z" }) : null,
    h("path", { className: "lk-shore-path", d: "M 1290 590 Q 1360 480 1330 400 T 1440 230" }),
    // the sea
    h("g", { ref: swell.track("far") }, h("path", { className: "lk-sea-far", d: WAVE_FAR })),
    h("g", { ref: swell.track("near") }, h("path", { className: "lk-sea-near", d: WAVE_NEAR })),
    lit ? h("path", { className: "lk-shore-road", d: "M 0 640 L 1000 590 L 1000 610 L 0 720 Z" }) : null,
    // the sand
    h("path", { className: "lk-sand", d: "M 0 900 V 740 Q 400 660 800 720 T 1300 700 L 1250 900 Z" }),
    // the tide board
    h("rect", { className: "lk-wood-dark", x: 776, y: 560, width: 18, height: 170 }),
    h("rect", { className: "lk-slate", x: 712, y: 440, width: 146, height: 130, rx: 6 }),
    h("path", { className: "lk-chalk", d: "M 734 474 H 836 M 734 504 H 812 M 734 534 H 826" }),
    // the boat
    h("path", { className: "lk-wood", d: "M 940 720 Q 1090 800 1250 716 L 1226 772 Q 1090 810 968 772 Z" }),
    h("path", { className: "lk-line", d: "M 1096 730 V 640" }),
    // the crate
    h("rect", { className: "lk-wood", x: 250, y: 660, width: 200, height: 110, rx: 6 }),
    h("path", { className: "lk-line", d: "M 250 700 H 450 M 316 660 V 770 M 384 660 V 770" }),
    crateOpen
      ? h("path", { className: "lk-wood-dark", d: "M 250 660 L 290 610 H 470 L 450 660 Z" })
      : h("rect", { className: "lk-wood-dark", x: 242, y: 644, width: 216, height: 22, rx: 5 }),
  );
}
