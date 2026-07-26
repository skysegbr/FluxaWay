import { h, useHead } from "/dist/nexa.js";
import { Badge } from "/dist/nexa-components-core.js";
import { Breadcrumb } from "/dist/nexa-components-nav.js";
import { CodeBlock } from "./CodeBlock.js";
import { DemoBlock } from "./DemoBlock.js";
import { PropsTable } from "./PropsTable.js";
import { PageToc } from "./PageToc.js";
import { categoryFor, neighborsFor } from "../../content/catalog.js";

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
    ...(entry.resources?.length ? [{ id: "resources", title: "Resources" }] : []),
  ];
  const category = categoryFor(entry.category);
  const { previous, next } = neighborsFor(entry.slug);

  return h(
    "div",
    { className: "nd-page" },
    h(
      "article",
      { className: "nd-article" },
      h(Breadcrumb, {
        items: [
          { label: "Overview", href: "#/" },
          { label: category?.title ?? "Reference" },
          { label: entry.name },
        ],
      }),
      h(
        "header",
        { className: "nd-article-head" },
        h("h1", { className: "nd-article-title" }, entry.name),
        h(Badge, { className: "nd-article-badge" }, entry.module),
      ),
      h("p", { className: "nd-article-lead" }, entry.summary),
      h(CodeBlock, { code: importLine, label: "Import" }),
      entry.signature
        ? h("figure", { className: "nd-signature" }, h("code", null, entry.signature))
        : null,
      entry.demos.map((demo) => h(DemoBlock, { key: demo.id, demo })),
      h(PropsTable, { id: "params", title: "Parameters", rows: entry.params, nameHeader: "Argument" }),
      h(PropsTable, { id: "returns", title: "Returns", rows: entry.returns, nameHeader: "Key" }),
      h(PropsTable, { id: "props", title: "Props", rows: entry.props }),
      entry.resources?.length
        ? h(
            "section",
            { id: "resources", className: "nd-resources" },
            h("h2", { className: "nd-demo-title" }, "Resources"),
            h(
              "ul",
              null,
              entry.resources.map((resource) =>
                h(
                  "li",
                  { key: resource.href },
                  h(
                    "a",
                    {
                      href: resource.href,
                      ...(resource.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer" }
                        : {}),
                    },
                    resource.label,
                  ),
                  resource.description ? ` — ${resource.description}` : null,
                ),
              ),
            ),
          )
        : null,
      entry.notes
        ? h(
            "section",
            { className: "nd-notes" },
            h("h2", { className: "nd-demo-title" }, "Notes"),
            h("ul", null, entry.notes.map((note, i) => h("li", { key: i }, note))),
          )
        : null,
      h(
        "nav",
        { className: "nd-page-nav", ariaLabel: "Reference pages" },
        previous
          ? h(
              "a",
              { className: "nd-page-nav-link", href: `#${previous.path}` },
              h("span", { className: "nd-page-nav-kicker" }, "Previous"),
              previous.label,
            )
          : h("span", null),
        next
          ? h(
              "a",
              { className: "nd-page-nav-link nd-page-nav-link-next", href: `#${next.path}` },
              h("span", { className: "nd-page-nav-kicker" }, "Next"),
              next.label,
            )
          : null,
      ),
    ),
    h(PageToc, { items: toc }),
  );
}

export default ReferencePage;
