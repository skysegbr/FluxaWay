import { h, useState } from "/dist/nexa.js";
import {
  Combobox,
  DatePicker,
  TimePicker,
  FileDropZone,
  CodeEditor,
} from "/dist/nexa-components-forms.js";

export const ADVANCED_ENTRIES = [
  {
    slug: "combobox",
    name: "Combobox",
    category: "forms",
    module: "nexa-components-forms.js",
    summary: "A searchable select: a trigger button, a filter box and a keyboard-driven list.",
    demos: [
      {
        id: "combobox-basic",
        title: "Searchable options",
        stack: true,
        render: () => {
          const [country, setCountry] = useState("br");

          return h(Combobox, {
            label: "Country",
            value: country,
            onChange: setCountry,
            options: [
              { value: "br", label: "Brazil" },
              { value: "pt", label: "Portugal" },
              { value: "jp", label: "Japan" },
              { value: "ca", label: "Canada" },
            ],
            placeholder: "Select...",
            searchPlaceholder: "Search countries",
          });
        },
      },
    ],
    props: [
      { name: "value", type: "string", description: "Selected option value." },
      { name: "onChange", type: "(value: string) => void", description: "Receives the value directly." },
      {
        name: "options",
        type: "Array<{ value, label }>",
        default: "[]",
        description: "Everything the search filters over.",
      },
      {
        name: "placeholder",
        type: "string",
        default: '"Select..."',
        description: "Trigger text while nothing is selected.",
      },
      {
        name: "searchPlaceholder",
        type: "string",
        default: '"Search..."',
        description: "Placeholder of the filter input.",
      },
    ],
    notes: [
      "Arrow keys, Home/End and Enter drive the list through aria-activedescendant — focus never leaves the search box. Escape closes and returns focus to the trigger.",
    ],
  },

  {
    slug: "date-picker",
    name: "DatePicker",
    category: "forms",
    module: "nexa-components-forms.js",
    summary: "A trigger button with a one-month calendar popover. Values are ISO \"YYYY-MM-DD\" strings.",
    demos: [
      {
        id: "date-picker-basic",
        title: "Bounded range",
        stack: true,
        render: () => {
          const [date, setDate] = useState("2026-07-25");

          return h(DatePicker, {
            label: "Start date",
            value: date,
            onChange: setDate,
            min: "2026-07-01",
            max: "2026-12-31",
            help: date ? `Selected ${date}` : "Nothing selected",
          });
        },
      },
    ],
    props: [
      { name: "value", type: 'string | null', description: 'Selected date as "YYYY-MM-DD".' },
      { name: "onChange", type: "(value: string) => void", description: "Receives the ISO date string." },
      { name: "min", type: "string", description: "Earliest selectable date." },
      { name: "max", type: "string", description: "Latest selectable date." },
      {
        name: "placeholder",
        type: "string",
        default: '"Select a date"',
        description: "Trigger text while empty.",
      },
    ],
  },

  {
    slug: "time-picker",
    name: "TimePicker",
    category: "forms",
    module: "nexa-components-forms.js",
    summary: "The clock counterpart of DatePicker: a list of slots between min and max, every step minutes.",
    demos: [
      {
        id: "time-picker-basic",
        title: "Business hours",
        stack: true,
        render: () => {
          const [time, setTime] = useState("09:30");

          return h(TimePicker, {
            label: "Meeting time",
            value: time,
            onChange: setTime,
            min: "08:00",
            max: "18:00",
            step: 30,
          });
        },
      },
    ],
    props: [
      { name: "value", type: "string", description: 'Selected time as "HH:MM".' },
      { name: "onChange", type: "(value: string) => void", description: "Receives the HH:MM string." },
      { name: "min", type: "string", default: '"00:00"', description: "First selectable slot." },
      { name: "max", type: "string", default: '"23:59"', description: "Last selectable slot." },
      { name: "step", type: "number", default: "30", description: "Minutes between slots." },
    ],
  },

  {
    slug: "file-drop-zone",
    name: "FileDropZone",
    category: "forms",
    module: "nexa-components-forms.js",
    summary: "A drag-and-drop upload target that also opens the file browser on click.",
    demos: [
      {
        id: "file-drop-zone-basic",
        title: "With progress",
        stack: true,
        render: () => {
          const [names, setNames] = useState([]);

          return h(FileDropZone, {
            multiple: true,
            accept: "image/*",
            hint: "PNG or JPG, up to 10 MB",
            label: names.length ? `Selected: ${names.join(", ")}` : "Drop images here or click to browse",
            progress: names.length ? 100 : undefined,
            onFiles: (files) => setNames([...files].map((file) => file.name)),
          });
        },
      },
    ],
    props: [
      { name: "onFiles", type: "(files: File[]) => void", description: "Called with the dropped or picked files." },
      { name: "accept", type: "string", description: "MIME filter passed to the input." },
      { name: "multiple", type: "boolean", default: "false", description: "Allows more than one file." },
      { name: "progress", type: "number", description: "0–100. Renders a Progress bar when set." },
      { name: "hint", type: "string", description: "Secondary line under the label." },
      { name: "disabled", type: "boolean", default: "false", description: "Blocks both drop and click." },
    ],
  },

  {
    slug: "code-editor",
    name: "CodeEditor",
    category: "forms",
    module: "nexa-components-forms.js",
    summary:
      "A thin wrapper over a code editor that is already on the page — CodeMirror 5 or Monaco, " +
      "whichever it finds on window. It renders an empty box if neither is loaded.",
    demos: [
      {
        id: "code-editor-basic",
        title: "Editing JavaScript",
        stack: true,
        render: () => {
          const [code, setCode] = useState('const greet = (name) => `Hi ${name}`;\n\ngreet("FluxaWay");');

          return h(CodeEditor, {
            value: code,
            onChange: setCode,
            mode: "javascript",
            options: { lineNumbers: true },
          });
        },
      },
    ],
    props: [
      { name: "value", type: "string", description: "Editor contents." },
      { name: "onChange", type: "(value: string) => void", description: "Fires on every edit." },
      {
        name: "mode",
        type: "string",
        default: '"javascript"',
        description: "CodeMirror mode / Monaco language id.",
      },
      { name: "theme", type: "string", default: '"default"', description: "Editor theme name." },
      { name: "options", type: "object", default: "{}", description: "Passed straight to the editor constructor." },
    ],
    notes: [
      "This page loads the vendored CodeMirror from /assets/codemirror — nothing is fetched from a CDN, and the editor is opt-in per page.",
      "For a full IDE-style editor with a toolbar, language switcher and snippet browser, use the FullCodeEditor add-on (/dist/nexa-editor.js) instead.",
    ],
  },
];
