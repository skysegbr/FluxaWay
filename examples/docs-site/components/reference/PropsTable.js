import { h } from "/dist/fluxaway.js";

// Hand-rolled instead of the Table component: every cell here is markup
// (<code>, muted defaults), and Table's `rows` take plain values.
//
// The same table serves a component's props, a hook's parameters and a hook's
// return keys — only the heading and the first column's label change.
export function PropsTable({
  rows,
  title = "Props",
  id = "props",
  nameHeader = "Prop",
  typeHeader = "Type",
}) {
  if (!rows?.length) return null;

  const hasDefaults = rows.some((row) => row.default);
  const titleId = `${id}-title`;
  const tableClass = `m-table nd-props-table${
    hasDefaults ? " nd-props-table-defaults" : " nd-props-table-compact"
  }`;

  return h(
    "section",
    { className: "nd-props", id },
    h("h2", { className: "nd-demo-title", id: titleId }, title),
    h(
      "div",
      {
        className: "nd-props-scroll",
        tabIndex: 0,
        role: "region",
        ariaLabel: `${title} table`,
      },
      h(
        "table",
        { className: tableClass, ariaLabelledby: titleId },
        h(
          "colgroup",
          null,
          h("col", { className: "nd-props-col-name" }),
          h("col", { className: "nd-props-col-type" }),
          hasDefaults ? h("col", { className: "nd-props-col-default" }) : null,
          h("col", { className: "nd-props-col-description" }),
        ),
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            h("th", { scope: "col" }, nameHeader),
            h("th", { scope: "col" }, typeHeader),
            hasDefaults ? h("th", { scope: "col" }, "Default") : null,
            h("th", { scope: "col" }, "Description"),
          ),
        ),
        h(
          "tbody",
          null,
          rows.map((row) =>
            h(
              "tr",
              { key: row.name },
              h(
                "td",
                { dataset: { label: nameHeader } },
                h("code", { className: "nd-props-name" }, row.name),
              ),
              h(
                "td",
                { dataset: { label: typeHeader } },
                h("code", { className: "nd-props-type" }, row.type),
              ),
              hasDefaults
                ? h(
                    "td",
                    { dataset: { label: "Default" } },
                    row.default
                      ? h("code", { className: "nd-props-default" }, row.default)
                      : h("span", { className: "nd-props-empty" }, "—"),
                  )
                : null,
              h("td", { dataset: { label: "Description" } }, row.description),
            ),
          ),
        ),
      ),
    ),
  );
}
