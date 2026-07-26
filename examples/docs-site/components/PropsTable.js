import { h } from "/dist/nexa.js";

// Hand-rolled instead of the Table component: every cell here is markup
// (<code>, muted defaults), and Table's `rows` take plain values.
export function PropsTable({ props: rows }) {
  if (!rows?.length) return null;

  return h(
    "section",
    { className: "nd-props", id: "props" },
    h("h3", { className: "nd-demo-title" }, "Props"),
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
            h("th", null, "Prop"),
            h("th", null, "Type"),
            h("th", null, "Default"),
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
              h(
                "td",
                null,
                row.default
                  ? h("code", null, row.default)
                  : h("span", { className: "nd-props-empty" }, "—"),
              ),
              h("td", null, row.description),
            ),
          ),
        ),
      ),
    ),
  );
}
