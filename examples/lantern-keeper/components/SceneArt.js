import { h } from "/dist/fluxaway.js";

// The same night sky behind every scene, so the three of them read as one place.
const STARS = [
  [90, 70, 2], [210, 150, 1.4], [330, 60, 1.8], [470, 190, 1.2], [560, 90, 2.2], [690, 40, 1.4],
  [760, 170, 1.6], [880, 80, 1.2], [1010, 130, 2], [1120, 50, 1.4], [1230, 200, 1.6], [1340, 90, 1.2],
  [1450, 150, 2], [1540, 60, 1.4], [150, 250, 1.2], [620, 260, 1.4], [1080, 270, 1.2], [1390, 290, 1.6],
];

export function SceneArt({ name, children }) {
  return h(
    "svg",
    {
      className: `lk-art lk-art-${name}`,
      viewBox: "0 0 1600 900",
      preserveAspectRatio: "xMidYMid slice",
      ariaHidden: "true",
      focusable: "false",
    },
    h("rect", { className: "lk-sky", width: 1600, height: 900 }),
    STARS.map(([cx, cy, r]) => h("circle", { key: `${cx}-${cy}`, className: "lk-star", cx, cy, r })),
    children,
  );
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
