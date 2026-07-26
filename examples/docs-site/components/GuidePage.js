import { h, useHead } from "/dist/nexa.js";
import { Alert } from "/dist/nexa-components-core.js";
import { CodeBlock } from "./reference/CodeBlock.js";
import { PageToc } from "./reference/PageToc.js";
import { GUIDE_STEPS } from "../data.js";

export function GuidePage() {
  useHead({
    title: "Getting started — Nexa Docs",
    meta: [{ name: "description", content: "Run Nexa in the browser in four steps." }],
  });

  return h(
    "div",
    { className: "nd-page" },
    h(
      "article",
      { className: "nd-article" },
      h("h1", { className: "nd-article-title" }, "Getting started"),
      h(
        "p",
        { className: "nd-article-lead" },
        "Four steps, none of which install anything. The last one does not even download a file.",
      ),

      GUIDE_STEPS.map((step) =>
        h(
          "section",
          { key: step.id, id: step.id, className: "nd-demo" },
          h("h2", { className: "nd-demo-title" }, step.title),
          h("p", { className: "nd-demo-note" }, step.body),
          h(CodeBlock, { code: step.code, lang: step.lang ?? "js" }),
        ),
      ),

      h(
        Alert,
        { variant: "info", className: "nd-guide-alert" },
        "Nexa runs no Node.js anywhere — not for tooling, not for tests. Validate with a browser ",
        "(",
        h("code", null, "python server.py"),
        " plus the console), never with ",
        h("code", null, "node --check"),
        ".",
      ),
    ),
    h(PageToc, { items: GUIDE_STEPS.map((step) => ({ id: step.id, title: step.title })) }),
  );
}

export default GuidePage;
