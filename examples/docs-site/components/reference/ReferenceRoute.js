import { h, useEffect, useState } from "/dist/nexa.js";
import { Alert, Spinner } from "/dist/nexa-components-core.js";
import { metaFor } from "../../content/catalog.js";
import { loadEntry } from "../../content/entryLoader.js";
import { ReferencePage } from "./ReferencePage.js";

export default function ReferenceRoute({ params }) {
  const slug = params.slug;
  const [state, setState] = useState(() => ({
    slug,
    entry: null,
    error: null,
    loading: true,
  }));

  useEffect(() => {
    let active = true;
    setState({ slug, entry: null, error: null, loading: true });

    loadEntry(slug)
      .then((entry) => {
        if (active) setState({ slug, entry, error: null, loading: false });
      })
      .catch((error) => {
        if (active) setState({ slug, entry: null, error, loading: false });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (state.loading || state.slug !== slug) {
    return h(
      "div",
      { className: "nd-route-state", ariaLive: "polite" },
      h(Spinner, { label: `Loading ${metaFor(slug)?.name ?? "reference"}…` }),
    );
  }

  if (state.error) {
    return h(
      "div",
      { className: "nd-route-state" },
      h(Alert, { variant: "danger", title: "Could not load this page" }, state.error.message),
    );
  }

  if (!state.entry) {
    return h(
      "div",
      { className: "nd-route-state" },
      h(Alert, { variant: "warning", title: "Reference not found" }, `Nothing is mapped to ${slug}.`),
    );
  }

  return h(ReferencePage, { entry: state.entry });
}
