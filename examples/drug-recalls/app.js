import { Fragment, h, render, useDebounce, useState } from "/dist/fluxaway.js";
import { Alert, Spinner } from "/dist/fluxaway-components-core.js";
import { ChartCard, DashboardGrid } from "/dist/fluxaway-charts.js";
import { useDrugRecalls } from "./components/useDrugRecalls.js";
import { DashboardToolbar } from "./components/DashboardToolbar.js";
import { RecallFilters } from "./components/RecallFilters.js";
import { RecallMetrics } from "./components/RecallMetrics.js";
import { RecallClassDonut } from "./components/RecallClassDonut.js";
import { RecallStateBars } from "./components/RecallStateBars.js";
import { RecallTable } from "./components/RecallTable.js";
import { RecallDetailDialog } from "./components/RecallDetailDialog.js";

function App() {
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedRecall, setSelectedRecall] = useState(null);

  const debouncedQuery = useDebounce(query, 400);

  const { results, total, byClassification, byStatus, byState, loading, error } = useDrugRecalls({
    query: debouncedQuery,
    classification,
    status,
  });

  const isInitialLoad = loading && results.length === 0 && !error;

  return h(
    "div",
    { className: "dr-app" },
    h(DashboardToolbar, null),
    h(
      "div",
      { className: "m-container m-content m-stack" },
      h(RecallFilters, {
        query, onQueryChange: setQuery,
        classification, onClassificationChange: setClassification,
        status, onStatusChange: setStatus,
      }),
      error && h(Alert, { variant: "danger", title: "Couldn't reach openFDA" }, error),
      isInitialLoad
        ? h(Spinner, { label: "Loading recalls…" })
        : h(
            Fragment,
            null,
            h(RecallMetrics, { total, byClassification, byStatus }),
            h(
              DashboardGrid,
              { min: 340 },
              // `loading` holds the previous render at reduced opacity while a
              // filter change refetches — no skeleton flash, no layout jump.
              h(ChartCard, { title: "By classification", loading },
                h(RecallClassDonut, { byClassification })),
              h(ChartCard, { title: "Top states", loading },
                h(RecallStateBars, { byState })),
            ),
            h(RecallTable, { recalls: results, onOpen: setSelectedRecall }),
          ),
      h(RecallDetailDialog, { recall: selectedRecall, onClose: () => setSelectedRecall(null) }),
    ),
  );
}

render(App, document.getElementById("app"));
