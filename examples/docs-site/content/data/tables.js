import { h, useState } from "/dist/nexa.js";
import { Badge } from "/dist/nexa-components-core.js";
import { Table, DataTable, Pagination } from "/dist/nexa-components-data.js";

const COLUMNS = [
  { key: "name", header: "Name" },
  { key: "role", header: "Role" },
  { key: "budget", header: "Budget", align: "right" },
];

const ROWS = [
  { id: 1, name: "Orbit dashboard", role: "Design Ops", budget: "18.4k" },
  { id: 2, name: "Atlas catalog", role: "Growth", budget: "9.7k" },
  { id: 3, name: "Pulse forms", role: "Platform", budget: "12.1k" },
];

const MANY = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  name: `Run #${String(i + 1).padStart(3, "0")}`,
  role: ["Design Ops", "Growth", "Platform"][i % 3],
  budget: `${(i * 1.7 + 3).toFixed(1)}k`,
}));

export const TABLE_ENTRIES = [
  {
    slug: "table",
    name: "Table",
    category: "data",
    module: "nexa-components-data.js",
    summary:
      "A styled data table with optional client-side sorting and a built-in empty state. Sorting " +
      "state is internal — reach for DataTable when you also need pagination.",
    demos: [
      {
        id: "table-sortable",
        title: "Sortable columns",
        stack: true,
        note: "Click a header to sort. align: \"right\" suits numbers.",
        render: () =>
          h(Table, {
            columns: COLUMNS,
            rows: ROWS,
            sortable: true,
            getRowKey: (row) => row.id,
          }),
      },
      {
        id: "table-empty",
        title: "Empty state",
        stack: true,
        render: () =>
          h(Table, {
            columns: COLUMNS,
            rows: [],
            emptyTitle: "No projects match",
            emptyDescription: "Clear the filters to see everything again.",
          }),
      },
    ],
    props: [
      {
        name: "columns",
        type: "Array<{ key, header, align?, render? }>",
        default: "[]",
        description: "Column definitions, in display order.",
      },
      { name: "rows", type: "object[]", default: "[]", description: "The data. Each row is looked up by column key." },
      { name: "sortable", type: "boolean", default: "false", description: "Makes the headers sort the rows." },
      { name: "defaultSort", type: "{ key, dir }", description: "Initial sort — dir is \"asc\" or \"desc\"." },
      { name: "onSort", type: "(sort) => void", description: "Notified whenever the sort changes." },
      {
        name: "getRowKey",
        type: "(row, index) => key",
        default: "row.id ?? index",
        description: "Reconciler key for each row.",
      },
      { name: "emptyTitle", type: "string", default: '"No rows"', description: "Heading of the empty state." },
    ],
  },

  {
    slug: "data-table",
    name: "DataTable",
    category: "data",
    module: "nexa-components-data.js",
    summary:
      "Table plus Pagination: it sorts the full row set, then renders only the current page. Pass " +
      "all the rows — it does the slicing.",
    demos: [
      {
        id: "data-table-basic",
        title: "Sorted and paginated",
        stack: true,
        note: "The footer only appears once rows.length exceeds pageSize.",
        render: () =>
          h(DataTable, {
            columns: COLUMNS,
            rows: MANY,
            pageSize: 8,
            sortable: true,
          }),
      },
    ],
    props: [
      { name: "columns", type: "Array<Column>", default: "[]", description: "Same shape as Table." },
      { name: "rows", type: "object[]", default: "[]", description: "The full, unsliced data set." },
      { name: "pageSize", type: "number", default: "10", description: "Rows rendered per page." },
      { name: "page", type: "number", description: "Controlled page. Omit for uncontrolled (starts at 1)." },
      { name: "onPageChange", type: "(page: number) => void", description: "Notified when the page changes." },
      { name: "sortable", type: "boolean", default: "true", description: "Header sorting, on by default here." },
    ],
  },

  {
    slug: "pagination",
    name: "Pagination",
    category: "data",
    module: "nexa-components-data.js",
    summary:
      "The standalone page rail: previous/next plus a windowed set of page numbers with ellipses. " +
      "Fully controlled.",
    demos: [
      {
        id: "pagination-basic",
        title: "Windowed pages",
        stack: true,
        render: () => {
          const [page, setPage] = useState(4);

          return h(
            "div",
            { className: "nd-stack" },
            h(Pagination, { page, total: 12, siblings: 1, onChange: setPage }),
            h(Badge, null, `Page ${page} of 12`),
          );
        },
      },
    ],
    props: [
      { name: "page", type: "number", default: "1", description: "Current page (1-based)." },
      { name: "total", type: "number", default: "1", description: "Total number of pages." },
      {
        name: "siblings",
        type: "number",
        default: "1",
        description: "How many pages to show on each side of the current one.",
      },
      { name: "onChange", type: "(page: number) => void", description: "Called with the requested page." },
    ],
    notes: [
      "Out-of-range page and total values are clamped rather than throwing, so a stale page never breaks the rail.",
    ],
  },
];
