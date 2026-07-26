import { h, useState, useToast } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";
import { Toast, ToastStack } from "/dist/fluxaway-components-overlay.js";

export const TOAST_ENTRIES = [
  {
    slug: "toast",
    name: "Toast",
    category: "overlay",
    module: "fluxaway-components-overlay.js",
    summary:
      "A single transient notification. Usually you want the useToast hook plus ToastStack; " +
      "reach for Toast directly for a persistent inline banner you control.",
    demos: [
      {
        id: "toast-variants",
        title: "One controlled toast",
        stack: true,
        note: "duration: 0 (the default) means it never auto-dismisses.",
        render: () => {
          const [open, setOpen] = useState(true);

          return h(
            "div",
            { className: "nd-stack" },
            h(Toast, {
              open,
              variant: "success",
              title: "Deploy finished",
              message: "3 regions updated in 42s.",
              onClose: () => setOpen(false),
              action: h(Button, { variant: "text" }, "View log"),
            }),
            open ? null : h(Button, { variant: "tonal", onClick: () => setOpen(true) }, "Show it again"),
          );
        },
      },
    ],
    props: [
      { name: "open", type: "boolean", default: "true", description: "Whether the toast is rendered." },
      {
        name: "variant",
        type: '"info" | "success" | "warning" | "danger"',
        default: '"info"',
        description: "Color and icon.",
      },
      { name: "title", type: "string", description: "Bold first line." },
      { name: "message", type: "string", description: "Body text." },
      {
        name: "duration",
        type: "number",
        default: "0",
        description: "Auto-dismiss after N ms. 0 keeps it until closed.",
      },
      { name: "onClose", type: "() => void", description: "Called by the close button and the auto-dismiss timer." },
      { name: "action", type: "VNode", description: "An inline action, e.g. Undo." },
    ],
  },

  {
    slug: "toast-stack",
    name: "ToastStack",
    category: "overlay",
    module: "fluxaway-components-overlay.js",
    summary:
      "The queue renderer. useToast holds the queue and hands you toast.success/error/warning/info; " +
      "ToastStack draws it. The hook renders nothing on its own — mount the stack once, near the root.",
    imports: "ToastStack",
    demos: [
      {
        id: "toast-stack-basic",
        title: "Queue with useToast",
        stack: true,
        render: () => {
          const { toasts, toast } = useToast();

          return h(
            "div",
            { className: "nd-stack" },
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: "contained", onClick: () => toast.success("Settings saved!") }, "Success"),
              h(
                Button,
                { variant: "danger", onClick: () => toast.error("Could not reach the server.", { title: "Error" }) },
                "Error",
              ),
              h(Button, { variant: "tonal", onClick: () => toast.info("Nightly export started.") }, "Info"),
            ),
            h(ToastStack, { toasts, onClose: (id) => toast.dismiss(id) }),
          );
        },
      },
    ],
    props: [
      {
        name: "toasts",
        type: "Array<{ id, variant, title?, message, duration? }>",
        default: "[]",
        description: "The queue, straight from useToast.",
      },
      { name: "onClose", type: "(id) => void", description: "Wire to toast.dismiss(id)." },
    ],
    notes: [
      "useToast is a core hook (/dist/fluxaway.js), not a component: const { toasts, toast } = useToast().",
      "Mount exactly one ToastStack per app, high in the tree — the stack is fixed-positioned, so a second one would overlap the first.",
    ],
  },
];
