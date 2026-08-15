import { h } from "/dist/fluxaway.js";
import { useTimeline, stagger } from "/dist/fluxaway-motion.js";

const LINKS = [
  ["Material", "#material"],
  ["Assembly", "#assembly"],
  ["Systems", "#systems"],
];

export function Header() {
  const reveal = [
    { at: 0, y: -18, opacity: 0 },
    { at: 720, y: 0, opacity: 1, ease: "outCubic" },
  ];
  const timeline = useTimeline({
    duration: 1100,
    tracks: {
      brand: reveal,
      nav: stagger(reveal, 110, 1),
      controls: stagger(reveal, 110, 2),
    },
  });

  return h(
    "header",
    { className: "il-header" },
    h(
      "div",
      { className: "il-shell il-header-inner" },
      h(
        "a",
        { className: "il-brand", href: "#top", ref: timeline.track("brand") },
        h("span", { className: "il-brand-plate", ariaHidden: "true" }, "FW"),
        h("span", null, h("strong", null, "FluxaWay"), h("small", null, "INOX PROTOCOL / 01")),
      ),
      h(
        "nav",
        { className: "il-nav", ariaLabel: "Main navigation", ref: timeline.track("nav") },
        LINKS.map(([label, href]) => h("a", { key: href, href }, label)),
      ),
      h(
        "div",
        { className: "il-header-controls", ref: timeline.track("controls") },
        h("span", { className: "il-alloy-status" }, h("i", { ariaHidden: "true" }), "INOX ONLINE"),
      ),
    ),
  );
}
