import {
  h,
  useState,
  useRef,
  useSwipe,
  useLongPress,
  useNetworkStatus,
  useOrientation,
  useVibrate,
} from "/dist/fluxaway.js";
import { Badge } from "/dist/fluxaway-components-core.js";

export const DEVICE_HOOK_ENTRIES = [
  {
    slug: "use-swipe",
    name: "useSwipe",
    category: "hooks-device",
    module: "fluxaway.js",
    signature: "useSwipe(ref, { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold })",
    summary:
      "Directional swipe gestures on an element. It attaches to the node behind a ref and calls " +
      "back once per gesture, after the finger lifts.",
    demos: [
      {
        id: "use-swipe-basic",
        title: "Swipe the box",
        stack: true,
        note: "Touch or pen — drag across the box and release. On a mouse-only machine nothing fires, which is correct.",
        render: () => {
          const zoneRef = useRef(null);
          const [last, setLast] = useState("nothing yet");

          useSwipe(zoneRef, {
            threshold: 40,
            onSwipeLeft: () => setLast("left"),
            onSwipeRight: () => setLast("right"),
            onSwipeUp: () => setLast("up"),
            onSwipeDown: () => setLast("down"),
          });

          return h(
            "div",
            { className: "nd-stack" },
            h("div", { ref: zoneRef, className: "nd-contextzone" }, "Swipe in any direction"),
            h(Badge, null, `last swipe: ${last}`),
          );
        },
      },
    ],
    params: [
      { name: "ref", type: "Ref", description: "useRef pointing at the element that receives the gesture." },
      { name: "onSwipeLeft / Right / Up / Down", type: "() => void", description: "Called once per completed gesture." },
      {
        name: "threshold",
        type: "number",
        default: "40",
        description: "Minimum travel in px before it counts as a swipe.",
      },
    ],
  },

  {
    slug: "use-long-press",
    name: "useLongPress",
    category: "hooks-device",
    module: "fluxaway.js",
    signature: "useLongPress(ref, { onLongPress, delay })",
    summary: "Fires after the pointer is held down on an element for delay ms without moving away.",
    demos: [
      {
        id: "use-long-press-basic",
        title: "Press and hold",
        stack: true,
        render: () => {
          const zoneRef = useRef(null);
          const [count, setCount] = useState(0);

          useLongPress(zoneRef, { delay: 600, onLongPress: () => setCount((prev) => prev + 1) });

          return h(
            "div",
            { className: "nd-stack" },
            h("div", { ref: zoneRef, className: "nd-contextzone" }, "Hold me for 600ms"),
            h(Badge, null, `fired ${count}×`),
          );
        },
      },
    ],
    params: [
      { name: "ref", type: "Ref", description: "Element to watch." },
      { name: "onLongPress", type: "() => void", description: "Called once the delay elapses." },
      { name: "delay", type: "number", default: "500", description: "Hold time in ms." },
    ],
  },

  {
    slug: "use-network-status",
    name: "useNetworkStatus",
    category: "hooks-device",
    module: "fluxaway.js",
    signature: "const online = useNetworkStatus()",
    summary:
      "Whether the browser thinks it is online, kept current through the online/offline window " +
      "events. It returns the boolean itself — not an object.",
    demos: [
      {
        id: "use-network-status-basic",
        title: "Live connectivity",
        stack: true,
        note: "Toggle your network (or DevTools → offline) and watch it flip.",
        render: () => {
          const online = useNetworkStatus();

          return h(
            Badge,
            { className: online ? "m-badge-success" : "m-badge-danger" },
            online ? "online" : "offline",
          );
        },
      },
    ],
    returns: [{ name: "online", type: "boolean", description: "navigator.onLine, kept in sync." }],
    notes: [
      "Destructuring it — const { online } = useNetworkStatus() — yields undefined. The hook returns the boolean directly.",
      "navigator.onLine only proves a local link exists; a captive portal or a dead upstream still reports true.",
    ],
  },

  {
    slug: "use-orientation",
    name: "useOrientation",
    category: "hooks-device",
    module: "fluxaway.js",
    signature: "const orientation = useOrientation()",
    summary:
      'Screen orientation as a string — "portrait" or "landscape" — updated on orientationchange ' +
      "and on the matching media query.",
    demos: [
      {
        id: "use-orientation-basic",
        title: "Current orientation",
        stack: true,
        note: "On a desktop this follows the window's aspect ratio: make the window taller than it is wide.",
        render: () => {
          const orientation = useOrientation();

          return h(Badge, null, `orientation = ${orientation}`);
        },
      },
    ],
    returns: [
      { name: "orientation", type: '"portrait" | "landscape"', description: "The current orientation string." },
    ],
    notes: [
      "It returns a string, not an object — there is no angle or type key to destructure.",
    ],
  },

  {
    slug: "use-vibrate",
    name: "useVibrate",
    category: "hooks-device",
    module: "fluxaway.js",
    signature: "const vibrate = useVibrate()",
    summary:
      "Returns the vibrate function itself, ready to call with a duration or a pattern. It is a " +
      "no-op where the Vibration API is unavailable, so it is safe to call anywhere.",
    demos: [
      {
        id: "use-vibrate-basic",
        title: "Buzz the device",
        stack: true,
        note: "Only does something on hardware that supports it — mostly Android. Desktop browsers ignore it silently.",
        render: () => {
          const vibrate = useVibrate();
          const supported = typeof navigator !== "undefined" && "vibrate" in navigator;

          return h(
            "div",
            { className: "nd-stack" },
            h(
              "div",
              { className: "nd-inline" },
              h("button", { className: "m-button m-button-contained", onClick: () => vibrate() }, "Short buzz"),
              h(
                "button",
                { className: "m-button m-button-tonal", onClick: () => vibrate([100, 50, 100]) },
                "Pattern",
              ),
            ),
            h(Badge, null, `navigator.vibrate available: ${supported}`),
          );
        },
      },
    ],
    returns: [
      {
        name: "vibrate",
        type: "(pattern?: number | number[]) => void",
        description: "Defaults to 10ms. An array alternates buzz and pause durations.",
      },
    ],
    notes: [
      "The hook returns the function directly — const { vibrate } = useVibrate() throws when you call it.",
    ],
  },
];
