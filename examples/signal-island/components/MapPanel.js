import { h, useEffect, useRef, useState } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { ZoomStage } from "/dist/fluxaway-zoom.js";
import { COAST, JETTY, PLACES } from "../terrain.js";

const SIZE = 640; // the map frame, in ZoomStage world pixels
const SPAN = 280; // metres of island it covers

// A place is drawn once the player has something to say about it.
const KNOWN_BY = { sign: "sign", cabin: "cabin", cairn: "cairn", shed: "power", mast: "signal" };
const NAMES = { sign: "Landing", cabin: "Cabin", cairn: "Cairn", shed: "Generator", mast: "Mast" };

function IslandChart({ game, pose }) {
  const coast = COAST.map(([x, z]) => `${x.toFixed(1)},${z.toFixed(1)}`).join(" ");
  return h(
    "svg",
    {
      className: "si-chart",
      viewBox: `${-SPAN / 2} ${-SPAN / 2} ${SPAN} ${SPAN}`,
      role: "img",
      ariaLabel: "Chart of the island, north up",
    },
    h("polygon", { className: "si-chart-land", points: coast }),
    h("rect", {
      className: "si-chart-jetty",
      x: JETTY.x - JETTY.half,
      y: JETTY.z0,
      width: JETTY.half * 2,
      height: JETTY.z1 - JETTY.z0,
    }),
    Object.entries(KNOWN_BY).map(([place, note]) => {
      const [x, z] = PLACES[place];
      const known = game.noted(note);
      return h(
        "g",
        { key: place, className: known ? "si-chart-place si-chart-known" : "si-chart-place" },
        h("circle", { cx: x, cy: z, r: known ? 3 : 2 }),
        known ? h("text", { x: x + 5, y: z + 2.5 }, NAMES[place]) : null,
      );
    }),
    pose
      ? h("path", {
        className: "si-chart-you",
        d: "M 0 -6 L 4 5 L 0 2.5 L -4 5 Z",
        transform: `translate(${pose.x.toFixed(1)} ${pose.z.toFixed(1)}) rotate(${(-pose.yaw * 180 / Math.PI).toFixed(1)})`,
      })
      : null,
    h("text", { className: "si-chart-north", x: 0, y: -SPAN / 2 + 14 }, "N"),
  );
}

// The island on a ZoomStage with free zoom: wheel or pinch to zoom, drag to
// pan, and three buttons for the keyboard.
export function MapPanel({ game, readPose }) {
  const zoomRef = useRef(null);
  const [pose, setPose] = useState(() => readPose());

  // The player keeps walking while the map is open.
  useEffect(() => {
    const timer = setInterval(() => setPose(readPose()), 300);
    return () => clearInterval(timer);
  }, []);

  const frames = [{
    id: "island",
    x: 0,
    y: 0,
    w: SIZE,
    h: SIZE,
    surface: "none",
    label: "The island",
    content: h(IslandChart, { game, pose }),
  }];

  return h(
    "div",
    { className: "si-map" },
    h(
      "div",
      { className: "si-map-stage" },
      h(ZoomStage, {
        frames,
        controllerRef: zoomRef,
        freeZoom: true,
        advanceOnClick: false,
        keyboardNav: false,
        padding: 0.02,
        minZoom: 0.8,
        maxZoom: 6,
        ariaLabel: "Map of the island",
      }),
    ),
    h(
      "div",
      { className: "si-map-tools" },
      h(Button, { variant: "tonal", ariaLabel: "Zoom in", onClick: () => zoomRef.current?.zoomIn() }, "+"),
      h(Button, { variant: "tonal", ariaLabel: "Zoom out", onClick: () => zoomRef.current?.zoomOut() }, "−"),
      h(Button, { variant: "text", onClick: () => zoomRef.current?.reset() }, "Whole island"),
    ),
  );
}
