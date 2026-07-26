import { h, useState } from "/dist/fluxaway.js";
import { FullCodeEditor } from "/dist/fluxaway-editor.js";

function EditorPreview() {
  const [value, setValue] = useState('function hello(name) {\\n  return `Hello, ${name}!`;\\n}');
  return h(
    "div",
    { className: "nd-addon-editor" },
    h(FullCodeEditor, {
      value,
      onChange: setValue,
      language: "javascript",
      showSnippets: false,
      height: 240,
    }),
  );
}

export const ADDON_ENTRIES = [
  {
    name: "FullCodeEditor",
    slug: "full-code-editor",
    category: "addons",
    module: "fluxaway-editor.js",
    summary:
      "A CodeMirror-powered editor with toolbar, languages, snippets, autocomplete and lint hooks.",
    demos: [
      {
        id: "editor-preview",
        title: "Embedded JavaScript editor",
        render: EditorPreview,
        code: `const [value, setValue] = useState("");

return h(FullCodeEditor, {
  value,
  onChange: setValue,
  language: "javascript",
  showSnippets: false,
  height: 240,
});`,
      },
    ],
    props: [
      { name: "value", type: "string", default: "\"\"", description: "Controlled source code." },
      { name: "onChange", type: "(code) => void", description: "Receives edits." },
      { name: "language", type: "string", default: "\"python\"", description: "Active CodeMirror mode." },
      { name: "showToolbar", type: "boolean", default: "true", description: "Shows editor actions." },
      { name: "showSnippets", type: "boolean", default: "true", description: "Shows the snippet browser." },
    ],
    resources: [
      { label: "FullCodeEditor source", href: "/dist/fluxaway-editor.js" },
      { label: "Editor API in the README", href: "https://github.com/skysegbr/FluxaWay#fullcodeeditor" },
    ],
    notes: [
      "Load /dist/fluxaway-editor.css and the vendored CodeMirror assets locally.",
      "Use the lighter CodeEditor form component when a toolbar and snippet browser are unnecessary.",
    ],
  },
];
