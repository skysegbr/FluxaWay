import { h, Fragment, useState } from "/dist/fluxaway.js";
import { Select, Checkbox, Radio, RadioGroup, Switch } from "/dist/fluxaway-components-forms.js";

export const CHOICE_ENTRIES = [
  {
    slug: "select",
    name: "Select",
    category: "forms",
    module: "fluxaway-components-forms.js",
    summary: "A native <select> with the standard label/help/error wrapper.",
    demos: [
      {
        id: "select-basic",
        title: "Options",
        stack: true,
        render: () => {
          const [plan, setPlan] = useState("pro");

          return h(Select, {
            label: "Plan",
            value: plan,
            onChange: (event) => setPlan(event.target.value),
            options: [
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
              { value: "enterprise", label: "Enterprise" },
            ],
            help: `Selected: ${plan}`,
          });
        },
      },
    ],
    props: [
      {
        name: "options",
        type: "Array<{ value, label }>",
        default: "[]",
        description: "Option list. You can pass <option> children instead.",
      },
      { name: "value", type: "string", description: "Controlled value." },
      { name: "onChange", type: "(event) => void", description: "Native change event." },
      { name: "error", type: "string", description: "Error message." },
    ],
  },

  {
    slug: "checkbox",
    name: "Checkbox",
    category: "forms",
    module: "fluxaway-components-forms.js",
    summary: "A single boolean choice with its label wired to the input.",
    demos: [
      {
        id: "checkbox-basic",
        title: "Controlled",
        stack: true,
        render: () => {
          const [agreed, setAgreed] = useState(false);

          return h(
            Fragment,
            null,
            h(Checkbox, {
              label: "I accept the terms",
              checked: agreed,
              onChange: (event) => setAgreed(event.target.checked),
            }),
            h(Checkbox, { label: "Send me the newsletter", disabled: true }),
          );
        },
      },
    ],
    props: [
      { name: "label", type: "string", description: "Text beside the box." },
      { name: "checked", type: "boolean", description: "Controlled state." },
      { name: "onChange", type: "(event) => void", description: "Read event.target.checked." },
      { name: "help", type: "string", description: "Hint under the control." },
      { name: "error", type: "string", description: "Error message." },
    ],
  },

  {
    slug: "radio",
    name: "Radio",
    category: "forms",
    module: "fluxaway-components-forms.js",
    summary:
      "A single radio input. For a set of mutually exclusive options prefer RadioGroup, which " +
      "handles the shared name and keyboard semantics for you.",
    demos: [
      {
        id: "radio-basic",
        title: "Standalone radios",
        stack: true,
        render: () => {
          const [pick, setPick] = useState("card");

          return h(
            Fragment,
            null,
            h(Radio, {
              name: "payment",
              label: "Credit card",
              checked: pick === "card",
              onChange: () => setPick("card"),
            }),
            h(Radio, {
              name: "payment",
              label: "Bank transfer",
              checked: pick === "bank",
              onChange: () => setPick("bank"),
            }),
          );
        },
      },
    ],
    props: [
      { name: "label", type: "string", description: "Text beside the radio." },
      { name: "name", type: "string", description: "Groups radios that belong together." },
      { name: "checked", type: "boolean", description: "Controlled state." },
      { name: "onChange", type: "(event) => void", description: "Change handler." },
    ],
  },

  {
    slug: "radio-group",
    name: "RadioGroup",
    category: "forms",
    module: "fluxaway-components-forms.js",
    summary: "A labelled set of radios rendered from an options array, stacked or inline.",
    demos: [
      {
        id: "radio-group-basic",
        title: "Inline group",
        stack: true,
        render: () => {
          const [speed, setSpeed] = useState("standard");

          return h(RadioGroup, {
            label: "Shipping",
            name: "shipping",
            inline: true,
            value: speed,
            onChange: setSpeed,
            options: [
              { value: "standard", label: "Standard" },
              { value: "express", label: "Express" },
              { value: "pickup", label: "Pickup" },
            ],
            help: `Chosen: ${speed}`,
          });
        },
      },
    ],
    props: [
      {
        name: "options",
        type: "Array<{ value, label, disabled? }>",
        default: "[]",
        description: "The radios to render.",
      },
      { name: "value", type: "string", description: "Selected value." },
      { name: "onChange", type: "(value: string) => void", description: "Receives the value directly." },
      { name: "inline", type: "boolean", default: "false", description: "Lays the radios out in a row." },
      { name: "name", type: "string", description: "Shared input name. Derived from id when omitted." },
    ],
  },

  {
    slug: "switch",
    name: "Switch",
    category: "forms",
    module: "fluxaway-components-forms.js",
    summary: "A toggle for settings that apply immediately, with no save step.",
    demos: [
      {
        id: "switch-basic",
        title: "Toggle",
        stack: true,
        render: () => {
          const [on, setOn] = useState(true);

          return h(
            Fragment,
            null,
            h(Switch, {
              label: "Enable notifications",
              checked: on,
              onChange: (event) => setOn(event.target.checked),
            }),
            h(Switch, { label: "Beta features (disabled)", disabled: true }),
          );
        },
      },
    ],
    props: [
      { name: "label", type: "string", description: "Text beside the switch." },
      { name: "checked", type: "boolean", default: "false", description: "Controlled state." },
      { name: "onChange", type: "(event) => void", description: "Read event.target.checked." },
      { name: "disabled", type: "boolean", description: "Disables the toggle." },
    ],
  },
];
