import { h } from "/dist/fluxaway.js";

export function SectionNext({ href, label }) {
  return h(
    "a",
    { className: "il-section-next", href, ariaLabel: `${label}. Go to the next section.` },
    h("span", null, label),
    h("span", { className: "il-section-next-arrow", ariaHidden: "true" }, "↓"),
  );
}
