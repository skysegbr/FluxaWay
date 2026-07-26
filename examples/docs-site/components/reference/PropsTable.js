import { h } from "/dist/fluxaway.js";

// Hand-rolled instead of the Table component: every cell here is markup
// (<code>, muted defaults), and Table's `rows` take plain values.
//
// The same table serves a component's props, a hook's parameters and a hook's
// return keys — only the heading and the first column's label change.
export function PropsTable({ rows, title = "Props", id = "props", nameHeader = "Prop" }) {
  if (!rows?.length) return null;

  const hasDefaults = rows.some((row) => row.default);

  return h(
    "section",
    { className: "nd-props", id },
    h("h2", { className: "nd-demo-title" }, title),
    h(
      "div",
      { className: "nd-props-scroll" },
      h(
        "table",
        { className: "m-table nd-props-table" },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            h("th", null, nameHeader),
            h("th", null, "Type"),
            hasDefaults ? h("th", null, "Default") : null,
            h("th", null, "Description"),
          ),
        ),
        h(
          "tbody",
          null,
          rows.map((row) =>
            h(
              "tr",
              { key: row.name },
              h("td", null, h("code", { className: "nd-props-name" }, row.name)),
              h("td", null, h("code", { className: "nd-props-type" }, row.type)),
              hasDefaults
                ? h(
                    "td",
                    null,
                    row.default
                      ? h("code", null, row.default)
                      : h("span", { className: "nd-props-empty" }, "—"),
                  )
                : null,
              h("td", null, row.description),
            ),
          ),
        ),
      ),
    ),
  );
}
