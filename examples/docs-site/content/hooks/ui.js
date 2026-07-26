import {
  h,
  useState,
  useRef,
  useDebounce,
  useThrottle,
  useMediaQuery,
  useIntersectionObserver,
  useHead,
} from "/dist/nexa.js";
import { Badge, Button } from "/dist/nexa-components-core.js";
import { TextField } from "/dist/nexa-components-forms.js";

export const UI_HOOK_ENTRIES = [
  {
    slug: "use-debounce",
    name: "useDebounce",
    category: "hooks-ui",
    module: "nexa.js",
    signature: "const debounced = useDebounce(value, delay)",
    summary:
      "Returns a copy of a value that only catches up after the input goes quiet for delay ms — " +
      "the standard way to avoid a request per keystroke.",
    demos: [
      {
        id: "use-debounce-basic",
        title: "Search-as-you-type",
        stack: true,
        note: "Type fast: the second badge lags behind until you stop for 400ms.",
        render: () => {
          const [query, setQuery] = useState("");
          const debounced = useDebounce(query, 400);

          return h(
            "div",
            { className: "nd-stack" },
            h(TextField, { label: "Query", value: query, onInput: (event) => setQuery(event.target.value) }),
            h(Badge, null, `live: ${query || "—"}`),
            h(Badge, null, `debounced: ${debounced || "—"}`),
          );
        },
      },
    ],
    params: [
      { name: "value", type: "T", description: "The value to trail." },
      { name: "delay", type: "number", description: "Milliseconds of silence before catching up." },
    ],
    returns: [{ name: "debounced", type: "T", description: "The delayed copy." }],
  },

  {
    slug: "use-throttle",
    name: "useThrottle",
    category: "hooks-ui",
    module: "nexa.js",
    signature: "const throttled = useThrottle(fn, delay)",
    summary:
      "Wraps a function so it fires at most once per delay ms. Note the difference from " +
      "useDebounce: this takes a function, not a value.",
    demos: [
      {
        id: "use-throttle-basic",
        title: "Rate-limited handler",
        stack: true,
        note: "Click as fast as you can — the counter only rises every 500ms. This site's scroll-spy uses the same hook.",
        render: () => {
          const [count, setCount] = useState(0);
          const clicks = useRef(0);
          const bump = useThrottle(() => setCount((prev) => prev + 1), 500);

          return h(
            "div",
            { className: "nd-stack" },
            h(
              Button,
              {
                variant: "contained",
                onClick: () => {
                  clicks.current += 1;
                  bump();
                },
              },
              "Click repeatedly",
            ),
            h(Badge, null, `${clicks.current} clicks → ${count} accepted`),
          );
        },
      },
    ],
    params: [
      { name: "fn", type: "Function", description: "The function to rate-limit." },
      { name: "delay", type: "number", description: "Minimum milliseconds between calls." },
    ],
    returns: [{ name: "throttled", type: "Function", description: "The rate-limited wrapper." }],
  },

  {
    slug: "use-media-query",
    name: "useMediaQuery",
    category: "hooks-ui",
    module: "nexa.js",
    signature: 'const matches = useMediaQuery("(max-width: 768px)")',
    summary:
      "A CSS media query as reactive state. Use it when a breakpoint has to change behavior, not " +
      "just styling — CSS alone handles the styling case better.",
    demos: [
      {
        id: "use-media-query-basic",
        title: "Live breakpoint",
        stack: true,
        note: "Resize the window and watch these flip.",
        render: () => {
          const isNarrow = useMediaQuery("(max-width: 900px)");
          const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
          const dark = useMediaQuery("(prefers-color-scheme: dark)");

          return h(
            "div",
            { className: "nd-stack" },
            h(Badge, null, `narrow viewport: ${isNarrow}`),
            h(Badge, null, `prefers reduced motion: ${reduced}`),
            h(Badge, null, `OS prefers dark: ${dark}`),
          );
        },
      },
    ],
    params: [{ name: "query", type: "string", description: "Any CSS media query string." }],
    returns: [{ name: "matches", type: "boolean", description: "Whether the query currently matches." }],
  },

  {
    slug: "use-intersection-observer",
    name: "useIntersectionObserver",
    category: "hooks-ui",
    module: "nexa.js",
    signature: "const entry = useIntersectionObserver(ref, { threshold, root, rootMargin, once })",
    summary:
      "Reports whether an element is in view — the primitive behind lazy images, reveal-on-scroll " +
      "and infinite lists.",
    demos: [
      {
        id: "use-intersection-observer-basic",
        title: "Watching a box scroll into view",
        stack: true,
        note: "Scroll this page: the badge tracks the box below it.",
        render: () => {
          const boxRef = useRef(null);
          const entry = useIntersectionObserver(boxRef, { threshold: 0.5 });

          return h(
            "div",
            { className: "nd-stack" },
            h(Badge, null, `intersecting: ${entry?.isIntersecting ?? "measuring…"}`),
            h(
              "div",
              { ref: boxRef, className: "nd-contextzone" },
              "Watch me while you scroll",
            ),
          );
        },
      },
    ],
    params: [
      { name: "ref", type: "Ref", description: "A useRef pointing at the observed element." },
      { name: "threshold", type: "number", default: "0", description: "Visible fraction that counts as intersecting." },
      { name: "root", type: "Element | null", default: "null", description: "Scroll container. null means the viewport." },
      { name: "rootMargin", type: "string", default: '"0px"', description: "Grows or shrinks the root box." },
      { name: "once", type: "boolean", default: "false", description: "Stop observing after the first intersection." },
    ],
    returns: [
      {
        name: "entry",
        type: "IntersectionObserverEntry | null",
        description: "The latest entry — isIntersecting, intersectionRatio, boundingClientRect…",
      },
    ],
  },

  {
    slug: "use-head",
    name: "useHead",
    category: "hooks-ui",
    module: "nexa.js",
    signature: "useHead({ title, meta })",
    summary:
      "Sets the document title and meta tags from inside a component. Every page of this site calls " +
      "it — watch the browser tab as you navigate.",
    demos: [
      {
        id: "use-head-basic",
        title: "Per-page title and description",
        note: "Last writer wins: a route page rendered after an app-level useHead overrides the fields it declares.",
        code: `function DashboardPage() {
  useHead({
    title: "Dashboard — Acme",
    meta: [
      { name: "description", content: "Sales overview" },
      { property: "og:title", content: "Dashboard" },
    ],
  });

  return h("main", null, /* … */);
}`,
      },
    ],
    params: [
      { name: "title", type: "string", description: "Sets document.title." },
      {
        name: "meta",
        type: "Array<{ name? , property?, content }>",
        description: "Tags keyed by name OR property, updated in place — no duplicates accumulate.",
      },
    ],
    notes: [
      "Nothing is removed on unmount (same semantics as writing document.title yourself), so every page should declare its own head.",
      "On the server, renderToString() collects the calls and renderHeadToString() returns the <title>/<meta> markup, escaped and deduped. Call it after renderToString.",
    ],
  },
];
