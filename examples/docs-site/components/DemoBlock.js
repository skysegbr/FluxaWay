import { h, useState } from "/dist/nexa.js";
import { CodeBlock } from "./CodeBlock.js";
import { sourceOf } from "./source.js";

// A demo is a real component, so `h(demo.render)` mounts it with working
// hooks — the preview above the snippet is the snippet, running.
export function DemoBlock({ demo }) {
  const [open, setOpen] = useState(demo.expanded !== false);
  const code = demo.code ?? sourceOf(demo.render);

  // A few APIs cannot run inside a docs page (a live WebSocket, a device
  // vibration). Those entries ship code without a `render`, and the snippet is
  // then the whole demo — no preview box, no toggle to hide the only content.
  if (!demo.render) {
    return h(
      "section",
      { className: "nd-demo", id: demo.id },
      h("h3", { className: "nd-demo-title" }, demo.title),
      demo.note ? h("p", { className: "nd-demo-note" }, demo.note) : null,
      h(CodeBlock, { code, lang: demo.lang ?? "js" }),
    );
  }

  return h(
    "section",
    { className: "nd-demo", id: demo.id },
    h(
      "header",
      { className: "nd-demo-head" },
      h("h3", { className: "nd-demo-title" }, demo.title),
      h(
        "button",
        {
          type: "button",
          className: "nd-demo-toggle",
          ariaExpanded: open ? "true" : "false",
          onClick: () => setOpen(!open),
        },
        h("i", { className: `bi bi-code-slash`, ariaHidden: "true" }),
        open ? "Hide code" : "Show code",
      ),
    ),
    demo.note ? h("p", { className: "nd-demo-note" }, demo.note) : null,
    h(
      "div",
      { className: `nd-demo-preview${demo.stack ? " nd-demo-preview-stack" : ""}` },
      h(demo.render),
    ),
    open ? h(CodeBlock, { code, lang: demo.lang ?? "js" }) : null,
  );
}
