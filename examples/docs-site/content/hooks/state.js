import { h, useState, useReducer, useRef, useMemo, useCallback, useEffect, useId } from "/dist/nexa.js";
import { Badge, Button } from "/dist/nexa-components-core.js";
import { TextField } from "/dist/nexa-components-forms.js";

export const STATE_HOOK_ENTRIES = [
  {
    slug: "use-state",
    name: "useState",
    category: "hooks-state",
    module: "nexa.js",
    signature: "const [value, setValue] = useState(initialValue)",
    summary:
      "Local component state. setState re-renders the component that owns it and its subtree — " +
      "ancestors and siblings do not re-run.",
    demos: [
      {
        id: "use-state-counter",
        title: "Counter",
        note: "Pass a function to setValue when the next value depends on the previous one.",
        render: () => {
          const [count, setCount] = useState(0);

          return h(
            "div",
            { className: "nd-inline" },
            h(Button, { variant: "tonal", onClick: () => setCount((prev) => prev - 1) }, "−"),
            h(Badge, null, String(count)),
            h(Button, { variant: "contained", onClick: () => setCount((prev) => prev + 1) }, "+"),
          );
        },
      },
    ],
    params: [
      {
        name: "initialValue",
        type: "T | () => T",
        description: "Starting value. A function is called once, on the first render only.",
      },
    ],
    returns: [
      { name: "[0] value", type: "T", description: "The current value." },
      {
        name: "[1] setValue",
        type: "(next: T | (prev: T) => T) => void",
        description: "Replaces the value and schedules a re-render.",
      },
    ],
    notes: [
      "State held by the root component (the function passed to render) still re-renders from the root — one more reason to keep app.js a thin orchestrator.",
    ],
  },

  {
    slug: "use-reducer",
    name: "useReducer",
    category: "hooks-state",
    module: "nexa.js",
    signature: "const [state, dispatch] = useReducer(reducer, initialArg, init?)",
    summary:
      "State transitions expressed as a reducer. Prefer it over useState when several fields move " +
      "together or the next value depends on an action, not just the previous state.",
    demos: [
      {
        id: "use-reducer-basic",
        title: "A tiny cart",
        stack: true,
        render: () => {
          const reducer = (state, action) => {
            if (action.type === "add") return { ...state, count: state.count + 1, total: state.total + action.price };
            if (action.type === "clear") return { count: 0, total: 0 };
            return state;
          };
          const [cart, dispatch] = useReducer(reducer, { count: 0, total: 0 });

          return h(
            "div",
            { className: "nd-stack" },
            h(Badge, null, `${cart.count} items · R$ ${cart.total.toFixed(2)}`),
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: "contained", onClick: () => dispatch({ type: "add", price: 39.9 }) }, "Add item"),
              h(Button, { onClick: () => dispatch({ type: "clear" }) }, "Clear"),
            ),
          );
        },
      },
    ],
    params: [
      { name: "reducer", type: "(state, action) => state", description: "Pure function computing the next state." },
      { name: "initialArg", type: "S", description: "Initial state, or the argument passed to init." },
      { name: "init", type: "(initialArg) => S", description: "Optional lazy initializer." },
    ],
    returns: [
      { name: "[0] state", type: "S", description: "Current state." },
      { name: "[1] dispatch", type: "(action) => void", description: "Sends an action through the reducer." },
    ],
  },

  {
    slug: "use-effect",
    name: "useEffect",
    category: "hooks-state",
    module: "nexa.js",
    signature: "useEffect(effect, dependencies?)",
    summary:
      "Side effects after a render: timers, subscriptions, fetches, direct DOM work. The returned " +
      "function is the cleanup, run before the next effect and on unmount.",
    demos: [
      {
        id: "use-effect-timer",
        title: "Interval with cleanup",
        note: "Returning clearInterval is what stops the timer from surviving the unmount.",
        render: () => {
          const [seconds, setSeconds] = useState(0);

          useEffect(() => {
            const id = setInterval(() => setSeconds((prev) => prev + 1), 1000);
            return () => clearInterval(id);
          }, []);

          return h(Badge, null, `Mounted for ${seconds}s`);
        },
      },
    ],
    params: [
      {
        name: "effect",
        type: "() => (void | () => void)",
        description: "Runs after the render commits. Return a cleanup function if it needs one.",
      },
      {
        name: "dependencies",
        type: "any[]",
        description: "Re-run when one changes. [] means once on mount; omitted means every render.",
      },
    ],
    notes: [
      "Effects do not run during server rendering, so anything touching window, localStorage, timers or fetch belongs here rather than in the render body.",
    ],
  },

  {
    slug: "use-ref",
    name: "useRef",
    category: "hooks-state",
    module: "nexa.js",
    signature: "const ref = useRef(initialValue)",
    summary:
      "A mutable box that survives re-renders without causing them. Two uses: reaching a DOM node " +
      "through the ref prop, and keeping a value an effect needs without re-subscribing.",
    demos: [
      {
        id: "use-ref-focus",
        title: "Focusing a DOM node",
        stack: true,
        render: () => {
          const inputRef = useRef(null);

          return h(
            "div",
            { className: "nd-stack" },
            h(TextField, { label: "Search", ref: inputRef, placeholder: "Click the button →" }),
            h(Button, { variant: "tonal", onClick: () => inputRef.current?.focus() }, "Focus the field"),
          );
        },
      },
    ],
    params: [{ name: "initialValue", type: "T", description: "Initial value of ref.current." }],
    returns: [{ name: "current", type: "T", description: "The live value. Writing to it never re-renders." }],
  },
];
