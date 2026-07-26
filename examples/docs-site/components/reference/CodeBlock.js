import { h, useState, useEffect, useRef } from "/dist/fluxaway.js";
import { highlight } from "./highlight.js";

export function CodeBlock({ code, lang = "js", label, id }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return h(
    "figure",
    { className: "nd-code", id },
    h(
      "figcaption",
      { className: "nd-code-bar" },
      h("span", { className: "nd-code-lang" }, label ?? lang.toUpperCase()),
      h(
        "button",
        {
          type: "button",
          className: "nd-code-copy",
          ariaLabel: copied ? "Copied to clipboard" : "Copy code",
          title: copied ? "Copied to clipboard" : "Copy code",
          onClick: copy,
        },
        h("i", { className: copied ? "bi bi-check2" : "bi bi-clipboard", ariaHidden: "true" }),
        h("span", { ariaLive: "polite" }, copied ? "Copied" : "Copy"),
      ),
    ),
    h("pre", { className: "nd-code-pre", tabIndex: 0 }, h("code", null, ...highlight(code, lang))),
  );
}
