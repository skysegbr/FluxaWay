import { h, useEffect, useHead, useState } from "/dist/fluxaway.js";
import { Alert, Spinner } from "/dist/fluxaway-components-core.js";
import { CodeEditor } from "/dist/fluxaway-components-forms.js";
import { loadCodeMirror } from "../content/codeEditorAssets.js";
import { sourceDocumentFor } from "../content/sourceDocuments.js";

function initialState(slug) {
  return { slug, content: "", error: null, loading: true };
}

export function SourceDocumentPage({ params }) {
  const slug = params.slug;
  const document = sourceDocumentFor(slug);
  const [state, setState] = useState(() => initialState(slug));

  useHead({
    title: `${document?.title ?? "Source not found"} — FluxaWay Docs`,
    meta: [
      {
        name: "description",
        content: document?.description ?? "The requested FluxaWay source document was not found.",
      },
    ],
  });

  useEffect(() => {
    if (!document) {
      setState({ slug, content: "", error: null, loading: false });
      return undefined;
    }

    const controller = new AbortController();
    setState(initialState(slug));

    Promise.all([
      loadCodeMirror(),
      fetch(document.path, { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`Could not load ${document.path} (${response.status}).`);
        return response.text();
      }),
    ])
      .then(([, content]) => {
        if (!controller.signal.aborted) {
          setState({ slug, content, error: null, loading: false });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ slug, content: "", error, loading: false });
        }
      });

    return () => controller.abort();
  }, [slug]);

  if (!document) {
    return h(
      "div",
      { className: "nd-route-state" },
      h(Alert, { variant: "warning", title: "Source not found" }, `Nothing is mapped to ${slug}.`),
    );
  }

  const loading = state.loading || state.slug !== slug;

  return h(
    "article",
    { className: "nd-source-page" },
    h(
      "a",
      { className: "nd-source-back", href: `#${document.backPath}` },
      h("i", { className: "bi bi-arrow-left", ariaHidden: "true" }),
      document.backLabel,
    ),
    h("h1", { className: "nd-article-title" }, document.title),
    h("p", { className: "nd-article-lead" }, document.description),
    h(
      "p",
      { className: "nd-source-path" },
      h("i", { className: "bi bi-file-earmark-code", ariaHidden: "true" }),
      h("code", null, document.path),
      h("span", null, "Read only"),
    ),
    loading
      ? h(
          "div",
          { className: "nd-source-loading", ariaLive: "polite" },
          h(Spinner, { label: `Loading ${document.title}…` }),
        )
      : state.error
        ? h(
            Alert,
            { variant: "danger", title: "Could not load this source" },
            state.error.message,
          )
        : h(CodeEditor, {
            value: state.content,
            mode: document.mode,
            className: "nd-source-editor",
            ariaLabel: `${document.title}, read only`,
            options: {
              readOnly: true,
              lineNumbers: true,
              lineWrapping: false,
              viewportMargin: 20,
            },
          }),
  );
}

export default SourceDocumentPage;
