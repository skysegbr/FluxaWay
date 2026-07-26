import { h, useHead } from "/dist/nexa.js";
import { EmptyState } from "/dist/nexa-components-core.js";

export function NotFoundPage({ params }) {
  const path = params?.["*"] ? `/${params["*"]}` : location.hash.slice(1);
  useHead({ title: "Not found — Nexa Docs" });

  return h(
    "div",
    { className: "nd-article" },
    h(EmptyState, {
      title: "That page is not documented yet",
      description: `Nothing is mapped to ${path}. Pick a component from the sidebar, or press Ctrl+K to search.`,
      action: h("a", { className: "m-button m-button-contained", href: "#/" }, "Back to the overview"),
    }),
  );
}

export default NotFoundPage;
