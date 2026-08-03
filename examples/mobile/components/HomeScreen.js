import { h, useLongPress, useRef, useState, useSwipe, useVibrate } from "/dist/fluxaway.js";
import { Button, Card } from "/dist/fluxaway-components-core.js";

import { FEATURES } from "../data.js";

export function HomeScreen({ onOpenSheet }) {
  const swipeRef = useRef(null);
  const longRef = useRef(null);
  const vibrate = useVibrate();
  const [swipeMsg, setSwipeMsg] = useState("");

  useSwipe(swipeRef, {
    onSwipeLeft: () => setSwipeMsg("← swiped left"),
    onSwipeRight: () => setSwipeMsg("→ swiped right"),
    onSwipeUp: () => setSwipeMsg("↑ swiped up"),
    onSwipeDown: () => setSwipeMsg("↓ swiped down"),
    threshold: 40,
  });

  useLongPress(longRef, {
    onLongPress: () => {
      vibrate(20);
      setSwipeMsg("Long press detected!");
    },
    delay: 600,
  });

  return h(
    "div",
    { className: "mob-screen" },
    h(
      "section",
      { className: "mob-hero" },
      h(
        "div",
        { className: "mob-hero-copy" },
        h(
          "span",
          { className: "mob-kicker" },
          h("i", { className: "bi bi-broadcast-pin", ariaHidden: "true" }),
          " Live mobile kit",
        ),
        h("h2", null, "Everything in reach."),
        h("p", null, "A no-build app shell with responsive navigation, gestures and device-aware hooks."),
        h(
          Button,
          { variant: "contained", className: "mob-hero-action", onClick: onOpenSheet },
          "Start an action",
          h("i", { className: "bi bi-arrow-right", ariaHidden: "true" }),
        ),
      ),
      h(
        "div",
        { className: "mob-hero-orbit", ariaHidden: "true" },
        h("span", null, h("i", { className: "bi bi-phone" })),
      ),
    ),
    h(
      "div",
      { className: "mob-metrics", ariaLabel: "Mobile shell status" },
      h("div", null, h("strong", null, "44px"), h("span", null, "touch targets")),
      h("div", null, h("strong", null, "4"), h("span", null, "device hooks")),
      h("div", null, h("strong", null, "0"), h("span", null, "dependencies")),
    ),
    h(
      "header",
      { className: "mob-section-head" },
      h("div", null, h("span", null, "Try it"), h("h2", null, "Gesture lab")),
      h("i", { className: "bi bi-hand-index-thumb", ariaHidden: "true" }),
    ),
    h(
      Card,
      { ref: swipeRef, padded: true, className: "mob-swipe-area m-mb-4" },
      h("div", { className: "mob-gesture-icon", ariaHidden: "true" }, h("i", { className: "bi bi-arrows-move" })),
      h("p", { className: "mob-swipe-hint" }, "Swipe in any direction"),
      swipeMsg
        ? h("strong", { className: "mob-swipe-result" }, swipeMsg)
        : h("span", { className: "m-text-muted" }, "The result appears here"),
    ),
    h(
      Button,
      {
        ref: longRef,
        variant: "tonal",
        className: "m-button-full m-mb-4",
        style: { touchAction: "none" },
      },
      h("i", { className: "bi bi-fingerprint", ariaHidden: "true" }),
      " Press and hold for 600ms",
    ),
    h(
      "header",
      { className: "mob-section-head mob-features-title" },
      h("div", null, h("span", null, "Under the hood"), h("h2", null, "Built for thumbs")),
    ),
    h(
      "div",
      { className: "m-row mob-feature-grid" },
      FEATURES.map((feature) =>
        h(
          "div",
          { key: feature.id, className: "m-col-12 m-col-sm-6 m-mb-4" },
          h(
            Card,
            { padded: true, className: "mob-feature-card" },
            h("span", { className: "mob-feature-icon", ariaHidden: "true" }, h("i", { className: `bi ${feature.icon}` })),
            h("span", { className: "mob-feature-name" }, feature.title),
            h("p", { className: "mob-feature-body" }, feature.body),
          ),
        ),
      ),
    ),
  );
}
