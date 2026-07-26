import { h, useHead } from "/dist/nexa.js";
import { Badge } from "/dist/nexa-components-core.js";
import { DemoBlock } from "./DemoBlock.js";
import { PropsTable } from "./PropsTable.js";
import { PageToc } from "./PageToc.js";

// One page renders every reference entry — a component (props) or a hook
// (signature + parameters + returns). Adding either is a content descriptor,
// never a new page component.
export function ReferencePage({ entry }) {
  useHead({
    title: `${entry.name} — Nexa Docs`,
    meta: [{ name: "description", content: entry.summary }],
  });

  // Split in two literals on purpose: as one string this reads as a real
  // `import … from "…"` to validate_nexa.py's import scanner, which then tries
  // to resolve the interpolated path and fails the build.
  const importLine =
    `import { ${entry.imports ?? entry.name} } from ` + `"/dist/${entry.module}";`;

  const toc = [
    ...entry.demos.map((demo) => ({ id: demo.id, title: demo.title })),
    ...(entry.params?.length ? [{ id: "params", title: "Parameters" }] : []),
    ...(entry.returns?.length ? [{ id: "returns", title: "Returns" }] : []),
    ...(entry.props?.length ? [{ id: "props", title: "Props" }] : []),
  ];

  return h(
    "div",
    { className: "nd-page" },
    h(
      "article",
      { className: "nd-article" },
      h(
        "header",
        { className: "nd-article-head" },
        h("h1", { className: "nd-article-title" }, entry.name),
        h(Badge, { className: "nd-article-badge" }, entry.module),
      ),
      h("p", { className: "nd-article-lead" }, entry.summary),
      h("figure", { className: "nd-import" }, h("code", null, importLine)),
      entry.signature
        ? h("figure", { className: "nd-signature" }, h("code", null, entry.signature))
        : null,
      entry.demos.map((demo) => h(DemoBlock, { key: demo.id, demo })),
      h(PropsTable, { id: "params", title: "Parameters", rows: entry.params, nameHeader: "Argument" }),
      h(PropsTable, { id: "returns", title: "Returns", rows: entry.returns, nameHeader: "Key" }),
      h(PropsTable, { id: "props", title: "Props", rows: entry.props }),
      entry.notes
        ? h(
            "section",
            { className: "nd-notes" },
            h("h3", { className: "nd-demo-title" }, "Notes"),
            h("ul", null, entry.notes.map((note, i) => h("li", { key: i }, note))),
          )
        : null,
    ),
    h(PageToc, { items: toc }),
  );
}
