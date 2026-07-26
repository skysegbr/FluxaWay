import { h, useHead } from "/dist/fluxaway.js";
import { Alert } from "/dist/fluxaway-components-core.js";
import { CodeBlock } from "./reference/CodeBlock.js";
import { PageToc } from "./reference/PageToc.js";
import { GUIDE_STEPS } from "../data.js";

export function GuidePage() {
  const toc = GUIDE_STEPS.map((step) => ({ id: step.id, title: step.title }));

  useHead({
    title: "Getting started — FluxaWay Docs",
    meta: [{ name: "description", content: "Run FluxaWay in the browser in four steps." }],
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
      h(PageToc, { variant: "mobile", items: toc }),

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
        "FluxaWay runs no Node.js anywhere — not for tooling, not for tests. Validate with a browser ",
        "(",
        h("code", null, "python server.py"),
        " plus the console), never with ",
        h("code", null, "node --check"),
        ".",
      ),
    ),
    h(PageToc, { variant: "desktop", items: toc }),
  );
}

export default GuidePage;
