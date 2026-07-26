import { h, useState, useForm, useFetch, useLocalStorage, useToast, useHistory } from "/dist/fluxaway.js";
import { Alert, Badge, Button, Spinner } from "/dist/fluxaway-components-core.js";
import { TextField, Textarea } from "/dist/fluxaway-components-forms.js";
import { ToastStack } from "/dist/fluxaway-components-overlay.js";

export const DATA_HOOK_ENTRIES = [
  {
    slug: "use-form",
    name: "useForm",
    category: "hooks-data",
    module: "fluxaway.js",
    signature: "const { values, errors, field, handleSubmit } = useForm({ initialValues, validate, onSubmit })",
    summary:
      "The whole form in one hook: values, per-field errors, touched/dirty tracking, submit state. " +
      "field(name) returns everything a control needs, so you spread it and move on.",
    demos: [
      {
        id: "use-form-basic",
        title: "Validated fields",
        stack: true,
        note: "Errors appear on blur. Submitting runs validate again and awaits onSubmit.",
        render: () => {
          const [sent, setSent] = useState(null);
          const { values, field, handleSubmit, isSubmitting, isValid } = useForm({
            initialValues: { email: "", notes: "" },
            validate: (v) => ({
              email: !v.email.includes("@") ? "Invalid e-mail" : "",
              notes: v.notes.length < 10 ? "Tell us a bit more" : "",
            }),
            onSubmit: async (v) => {
              await new Promise((resolve) => setTimeout(resolve, 600));
              setSent(v.email);
            },
          });

          return h(
            "div",
            { className: "nd-stack" },
            h(TextField, { ...field("email"), label: "E-mail", type: "email" }),
            h(Textarea, { ...field("notes"), label: "Notes", rows: 3 }),
            h(
              Button,
              { variant: "contained", onClick: handleSubmit(), disabled: isSubmitting },
              isSubmitting ? "Sending…" : "Submit",
            ),
            h(Badge, null, sent ? `Submitted: ${sent}` : `valid: ${isValid} · ${values.email || "(no e-mail)"}`),
          );
        },
      },
    ],
    params: [
      { name: "initialValues", type: "object", description: "Starting values, one key per field." },
      {
        name: "validate",
        type: "(values) => Record<string, string>",
        description: "Returns a message per invalid field; an empty string means valid.",
      },
      { name: "onSubmit", type: "async (values) => void", description: "Runs when a valid form is submitted." },
    ],
    returns: [
      { name: "values", type: "object", description: "Current field values." },
      { name: "errors", type: "object", description: "Current messages, keyed by field." },
      {
        name: "field",
        type: "(name) => props",
        description: "Spread into a control: { name, value, error, onBlur, onInput, onChange }.",
      },
      { name: "handleSubmit", type: "() => (event?) => void", description: "Call it to get the submit handler." },
      { name: "isSubmitting", type: "boolean", description: "True while onSubmit is pending." },
      { name: "isValid", type: "boolean", description: "Whether validate currently returns no messages." },
      { name: "touched / dirty", type: "object / boolean", description: "Which fields were blurred; whether anything changed." },
      { name: "reset", type: "() => void", description: "Back to initialValues." },
      { name: "serialize", type: "() => object", description: "Values ready to send." },
      {
        name: "setValue / setValues / setErrors / setFieldError",
        type: "Function",
        description: "Imperative escape hatches, e.g. for a server-side validation error.",
      },
      { name: "validateForm", type: "() => boolean", description: "Runs validate on demand." },
      { name: "submitCount", type: "number", description: "How many times submit ran." },
    ],
  },

  {
    slug: "use-fetch",
    name: "useFetch",
    category: "hooks-data",
    module: "fluxaway.js",
    signature: "const { data, loading, error, refetch } = useFetch(url, options?)",
    summary:
      "Declarative GET-and-parse. It tracks loading and error state, aborts on unmount, and skips " +
      "the request entirely when the url is null.",
    demos: [
      {
        id: "use-fetch-basic",
        title: "Live request",
        stack: true,
        note: "Fetches a file this repo serves, so the demo works offline. error shows what a failure looks like.",
        render: () => {
          const [enabled, setEnabled] = useState(false);
          const { data, loading, error, refetch } = useFetch(enabled ? "/package.json" : null);

          return h(
            "div",
            { className: "nd-stack" },
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: "contained", onClick: () => setEnabled(true) }, "Fetch"),
              h(Button, { variant: "tonal", onClick: refetch, disabled: !enabled }, "Refetch"),
            ),
            loading ? h(Spinner, { label: "Loading" }) : null,
            error ? h(Alert, { variant: "danger" }, String(error.message ?? error)) : null,
            data ? h(Badge, null, `FluxaWay v${data.version}`) : null,
          );
        },
      },
    ],
    params: [
      { name: "url", type: "string | null", description: "Request URL. null or undefined skips the fetch." },
      {
        name: "options",
        type: "RequestInit",
        default: "{}",
        description: "Forwarded to fetch() untouched — Headers, FormData and functions survive.",
      },
    ],
    returns: [
      { name: "data", type: "any", description: "Parsed JSON body, or null before it arrives." },
      { name: "loading", type: "boolean", description: "True while the request is in flight." },
      { name: "error", type: "Error | null", description: "Network or HTTP failure." },
      { name: "refetch", type: "() => void", description: "Re-runs the same request on demand." },
    ],
    notes: [
      "Changing options alone does NOT refetch — call refetch() or change the url. A signal you pass in options is chained into the internal AbortController, so either side can cancel.",
    ],
  },

  {
    slug: "use-local-storage",
    name: "useLocalStorage",
    category: "hooks-data",
    module: "fluxaway.js",
    signature: "const [value, setValue] = useLocalStorage(key, initialValue)",
    summary: "useState that persists. Same API, but the value survives a reload.",
    demos: [
      {
        id: "use-local-storage-basic",
        title: "Persisted preference",
        stack: true,
        note: "Change it, then reload the page — the value is still here.",
        render: () => {
          const [name, setName] = useLocalStorage("nd-demo-name", "");

          return h(
            "div",
            { className: "nd-stack" },
            h(TextField, {
              label: "Your name",
              value: name,
              onInput: (event) => setName(event.target.value),
            }),
            h(Badge, null, `localStorage["nd-demo-name"] = ${JSON.stringify(name)}`),
          );
        },
      },
    ],
    params: [
      { name: "key", type: "string", description: "localStorage key." },
      { name: "initialValue", type: "T", description: "Used when the key is absent or unreadable." },
    ],
    returns: [
      { name: "[0] value", type: "T", description: "Current value, parsed from JSON." },
      { name: "[1] setValue", type: "(next) => void", description: "Updates state and writes the key." },
    ],
  },
];
