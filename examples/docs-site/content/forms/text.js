import { h, Fragment, useState } from "/dist/nexa.js";
import { TextField, Textarea, NumberInput } from "/dist/nexa-components-forms.js";

export const TEXT_ENTRIES = [
  {
    slug: "text-field",
    name: "TextField",
    category: "forms",
    module: "nexa-components-forms.js",
    summary:
      "A labelled text input. Every native input prop (type, placeholder, value, onInput, " +
      "required, autocomplete…) is forwarded to the underlying element.",
    demos: [
      {
        id: "text-field-basic",
        title: "Controlled input",
        stack: true,
        render: () => {
          const [email, setEmail] = useState("");
          const invalid = email.length > 0 && !email.includes("@");

          return h(TextField, {
            label: "E-mail",
            type: "email",
            placeholder: "ada@example.com",
            value: email,
            onInput: (event) => setEmail(event.target.value),
            error: invalid ? "That does not look like an e-mail" : "",
            help: "We only use it for billing receipts.",
          });
        },
      },
      {
        id: "text-field-types",
        title: "Types and states",
        stack: true,
        render: () =>
          h(
            Fragment,
            null,
            h(TextField, { label: "Search", type: "search", placeholder: "Filter projects" }),
            h(TextField, { label: "Password", type: "password", value: "hunter2" }),
            h(TextField, { label: "Read-only", value: "acme-team", disabled: true }),
          ),
      },
    ],
    props: [
      { name: "label", type: "string", description: "Field label." },
      {
        name: "type",
        type: '"text" | "email" | "password" | "number" | "search" | "tel"',
        default: '"text"',
        description: "Native input type.",
      },
      { name: "value", type: "string", description: "Controlled value." },
      { name: "onInput", type: "(event) => void", description: "Fires on every keystroke." },
      { name: "help", type: "string", description: "Hint under the field." },
      { name: "error", type: "string", description: "Error message; replaces help and restyles the input." },
      { name: "required", type: "boolean", default: "false", description: "Marks the field required." },
      { name: "disabled", type: "boolean", description: "Disables the input." },
    ],
    notes: [
      "Spread useForm's field(name) straight into it: h(TextField, { ...field(\"email\"), label: \"E-mail\" }).",
    ],
  },

  {
    slug: "textarea",
    name: "Textarea",
    category: "forms",
    module: "nexa-components-forms.js",
    summary: "The multi-line counterpart of TextField, with the same label/help/error contract.",
    demos: [
      {
        id: "textarea-basic",
        title: "Rows and counter",
        stack: true,
        render: () => {
          const [notes, setNotes] = useState("");

          return h(Textarea, {
            label: "Project notes",
            rows: 4,
            value: notes,
            placeholder: "What are you building?",
            onInput: (event) => setNotes(event.target.value),
            help: `${notes.length}/280 characters`,
          });
        },
      },
    ],
    props: [
      { name: "label", type: "string", description: "Field label." },
      { name: "rows", type: "number", description: "Visible rows — forwarded to the textarea." },
      { name: "value", type: "string", description: "Controlled value." },
      { name: "onInput", type: "(event) => void", description: "Fires on every keystroke." },
      { name: "help", type: "string", description: "Hint under the field." },
      { name: "error", type: "string", description: "Error message." },
    ],
  },

  {
    slug: "number-input",
    name: "NumberInput",
    category: "forms",
    module: "nexa-components-forms.js",
    summary: "A numeric field with stepper buttons, clamped between min and max.",
    demos: [
      {
        id: "number-input-basic",
        title: "Stepper",
        stack: true,
        render: () => {
          const [seats, setSeats] = useState(3);

          return h(NumberInput, {
            label: "Seats",
            min: 1,
            max: 20,
            step: 1,
            value: seats,
            onChange: setSeats,
            help: "Between 1 and 20.",
          });
        },
      },
    ],
    props: [
      { name: "value", type: "number", description: "Controlled value." },
      { name: "onChange", type: "(value: number) => void", description: "Receives the number, not the event." },
      { name: "min", type: "number", description: "Lower bound; also disables the decrement button." },
      { name: "max", type: "number", description: "Upper bound; also disables the increment button." },
      { name: "step", type: "number", default: "1", description: "Increment applied by the buttons." },
      {
        name: "decrementLabel",
        type: "string",
        default: '"Decrease"',
        description: "Accessible name of the minus button.",
      },
      {
        name: "incrementLabel",
        type: "string",
        default: '"Increase"',
        description: "Accessible name of the plus button.",
      },
    ],
  },
];
