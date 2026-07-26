import { h, useState, useToast, useHistory } from "/dist/nexa.js";
import { Badge, Button } from "/dist/nexa-components-core.js";
import { TextField } from "/dist/nexa-components-forms.js";
import { ToastStack } from "/dist/nexa-components-overlay.js";

// Queue and stack state: notifications and undo/redo.
export const QUEUE_HOOK_ENTRIES = [
  {
    slug: "use-toast",
    name: "useToast",
    category: "hooks-data",
    module: "nexa.js",
    signature: "const { toasts, toast, dismiss } = useToast()",
    summary:
      "Holds the notification queue. It renders nothing on its own — pair it with the ToastStack " +
      "component, mounted once near the root.",
    demos: [
      {
        id: "use-toast-basic",
        title: "The four variants",
        stack: true,
        render: () => {
          const { toasts, toast } = useToast();

          return h(
            "div",
            { className: "nd-stack" },
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: "contained", onClick: () => toast.success("Saved!") }, "success"),
              h(Button, { variant: "danger", onClick: () => toast.error("Failed.", { title: "Error" }) }, "error"),
              h(Button, { variant: "tonal", onClick: () => toast.warning("Key expires soon.") }, "warning"),
              h(Button, { onClick: () => toast.info("Export started.") }, "info"),
            ),
            h(ToastStack, { toasts, onClose: (id) => toast.dismiss(id) }),
          );
        },
      },
    ],
    returns: [
      { name: "toasts", type: "Toast[]", description: "The live queue — hand it to ToastStack." },
      {
        name: "toast",
        type: "{ success, error, warning, info, dismiss }",
        description: "Push helpers: toast.success(message, { title?, duration? }). Default duration is 3500ms.",
      },
      {
        name: "dismiss",
        type: "(id) => void",
        description: "Also exposed at the top level, identical to toast.dismiss.",
      },
    ],
    notes: [
      "toast.error() pushes the \"danger\" variant — the method is named for the intent, the variant for the color.",
    ],
  },

  {
    slug: "use-history",
    name: "useHistory",
    category: "hooks-data",
    module: "nexa.js",
    signature: "const { state, set, undo, redo, canUndo, canRedo } = useHistory(initial, { limit })",
    summary: "State with an undo/redo stack — the backbone of any editor. Bounded by limit.",
    demos: [
      {
        id: "use-history-basic",
        title: "Undo and redo",
        stack: true,
        render: () => {
          const { state, set, undo, redo, canUndo, canRedo } = useHistory("", { limit: 20 });

          return h(
            "div",
            { className: "nd-stack" },
            h(TextField, { label: "Type something", value: state, onInput: (event) => set(event.target.value) }),
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: "tonal", onClick: undo, disabled: !canUndo }, "Undo"),
              h(Button, { variant: "tonal", onClick: redo, disabled: !canRedo }, "Redo"),
            ),
          );
        },
      },
    ],
    params: [
      { name: "initial", type: "T", description: "First state, the bottom of the stack." },
      { name: "limit", type: "number", default: "50", description: "How many past entries to keep." },
    ],
    returns: [
      { name: "state", type: "T", description: "Current state." },
      { name: "set", type: "(next | (prev) => next) => void", description: "Pushes a new entry." },
      { name: "undo / redo", type: "() => void", description: "Move along the stack." },
      { name: "canUndo / canRedo", type: "boolean", description: "Whether there is anywhere to move." },
    ],
  },
  {
    slug: "use-web-socket",
    name: "useWebSocket",
    category: "hooks-data",
    module: "nexa.js",
    signature: "const { status, lastMessage, send } = useWebSocket(url)",
    summary:
      "A WebSocket connection with automatic reconnection, exposed as render state. Objects passed " +
      "to send() are serialized to JSON for you.",
    demos: [
      {
        id: "use-web-socket-basic",
        title: "Connecting to a server",
        note: "No live demo here on purpose: a docs page has no socket server to talk to, and a failing connection would just log errors.",
        code: `function Ticker() {
  const { status, lastMessage, send } = useWebSocket("wss://api.example.com/ws");

  useEffect(() => {
    if (status === "open") send({ type: "subscribe", channel: "prices" });
  }, [status]);

  if (status !== "open") return h(Spinner, { label: status });

  return h("pre", null, lastMessage);
}`,
      },
    ],
    params: [{ name: "url", type: "string", description: "ws:// or wss:// endpoint." }],
    returns: [
      {
        name: "status",
        type: '"connecting" | "open" | "closed" | "error"',
        description: "Connection state, as render state.",
      },
      { name: "lastMessage", type: "string | null", description: "Payload of the most recent message." },
      {
        name: "send",
        type: "(data) => void",
        description: "Sends a string as-is; anything else is JSON.stringify'd first.",
      },
    ],
    notes: [
      "It opens the socket in an effect, so it never runs during server rendering.",
    ],
  },
];
