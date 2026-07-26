import { h, useState, useRef, useMemo, useCallback, useId, useErrorBoundary } from "/dist/fluxaway.js";
import { Badge, Button, Alert } from "/dist/fluxaway-components-core.js";
import { TextField } from "/dist/fluxaway-components-forms.js";

// Memoization, identity and render-time recovery.
export const MEMO_HOOK_ENTRIES = [
  {
    slug: "use-memo",
    name: "useMemo",
    category: "hooks-state",
    module: "fluxaway.js",
    signature: "const value = useMemo(factory, dependencies)",
    summary: "Caches an expensive computation between renders, recomputing only when a dependency changes.",
    demos: [
      {
        id: "use-memo-basic",
        title: "Derived list",
        stack: true,
        render: () => {
          const [query, setQuery] = useState("");
          const runsRef = useRef(0);
          const words = ["button", "card", "dialog", "drawer", "table", "tabs"];

          const matches = useMemo(() => {
            // A ref, not state: counting the runs must not itself cause one.
            runsRef.current += 1;
            return words.filter((word) => word.includes(query));
          }, [query]);

          return h(
            "div",
            { className: "nd-stack" },
            h(TextField, {
              label: "Filter",
              value: query,
              onInput: (event) => setQuery(event.target.value),
            }),
            h(Badge, null, `${matches.join(", ") || "no match"} · factory ran ${runsRef.current}×`),
          );
        },
      },
    ],
    params: [
      { name: "factory", type: "() => T", description: "Computes the value." },
      { name: "dependencies", type: "any[]", description: "Recompute when one of these changes." },
    ],
    returns: [{ name: "value", type: "T", description: "The memoized result." }],
  },

  {
    slug: "use-callback",
    name: "useCallback",
    category: "hooks-state",
    module: "fluxaway.js",
    signature: "const fn = useCallback(callback, dependencies)",
    summary:
      "Keeps a function identity stable between renders — useful for a memo()'d child's props or " +
      "an effect dependency.",
    demos: [
      {
        id: "use-callback-basic",
        title: "Stable handler",
        stack: true,
        render: () => {
          const [count, setCount] = useState(0);
          const firstRef = useRef(null);

          const onClick = useCallback(() => setCount((prev) => prev + 1), []);
          firstRef.current ??= onClick;

          return h(
            "div",
            { className: "nd-stack" },
            h(Button, { variant: "contained", onClick }, `Clicked ${count}×`),
            h(Badge, null, `Same function as the first render: ${onClick === firstRef.current}`),
          );
        },
      },
    ],
    params: [
      { name: "callback", type: "Function", description: "The function to keep." },
      { name: "dependencies", type: "any[]", description: "A new identity is created when one changes." },
    ],
    returns: [{ name: "fn", type: "Function", description: "The memoized callback." }],
  },

  {
    slug: "use-id",
    name: "useId",
    category: "hooks-state",
    module: "fluxaway.js",
    signature: "const id = useId()",
    summary:
      "A unique, render-stable id. Use it to tie a label to a control, or aria-controls to a panel, " +
      "without inventing global names.",
    demos: [
      {
        id: "use-id-basic",
        title: "Label association",
        stack: true,
        render: () => {
          const id = useId();

          return h(
            "div",
            { className: "nd-stack" },
            h("label", { htmlFor: id }, "Workspace name"),
            h("input", { id, className: "m-field", placeholder: "acme-team" }),
            h(Badge, null, `id = ${id}`),
          );
        },
      },
    ],
    returns: [{ name: "id", type: "string", description: "Stable unique id for this component instance." }],
    notes: [
      "The form components already call useId internally, so TextField, Select and friends associate their label even when you pass no id.",
    ],
  },
  {
    slug: "use-error-boundary",
    name: "useErrorBoundary",
    category: "hooks-state",
    module: "fluxaway.js",
    signature: "const [error, reset, guard] = useErrorBoundary()",
    summary:
      "Catches render errors thrown inside a subtree, so one broken branch shows a fallback " +
      "instead of blanking the page. guard() wraps the risky part; reset() clears the error.",
    demos: [
      {
        id: "use-error-boundary-basic",
        title: "Recovering from a bad render",
        stack: true,
        render: () => {
          const [error, reset, guard] = useErrorBoundary();
          const [broken, setBroken] = useState(false);

          const Risky = () => {
            if (broken) throw new Error("The dataset is corrupted");
            return h("p", { style: { margin: 0 } }, "Rendered fine.");
          };

          if (error) {
            return h(
              "div",
              { className: "nd-stack" },
              h(Alert, { variant: "danger", title: "Caught a render error" }, error.message),
              h(
                Button,
                {
                  variant: "contained",
                  onClick: () => {
                    setBroken(false);
                    reset();
                  },
                },
                "Retry",
              ),
            );
          }

          return h(
            "div",
            { className: "nd-stack" },
            guard(() => h(Risky, null)),
            h(Button, { variant: "danger", onClick: () => setBroken(true) }, "Break the render"),
          );
        },
      },
    ],
    returns: [
      { name: "[0] error", type: "Error | null", description: "The caught error, or null." },
      { name: "[1] reset", type: "() => void", description: "Clears the error so the subtree renders again." },
      {
        name: "[2] guard",
        type: "(render: () => VNode) => VNode",
        description: "Runs the render function, catching anything it throws.",
      },
    ],
    notes: [
      "It catches errors thrown while rendering. An error inside an event handler or a promise is not a render error — handle those where they happen.",
    ],
  },
];
