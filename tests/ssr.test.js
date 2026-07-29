// Tests for renderToString (server-side rendering).

import {
  h,
  render,
  useState,
  useMemo,
  useId,
  createContext,
  useContext,
  renderToString,
  hydrate,
} from "../dist/fluxaway.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

// ── basic serialization ────────────────────────────────────────────────────────

test("renderToString: element with className maps to class and renders children", () => {
  const html = renderToString(h("h1", { className: "m-title" }, "Hello"));
  assertEqual(html, '<h1 class="m-title">Hello</h1>');
});

test("renderToString: void elements have no closing tag", () => {
  assertEqual(renderToString(h("img", { src: "a.png" })), '<img src="a.png">');
  assertEqual(renderToString(h("br", null)), "<br>");
});

test("renderToString: boolean attribute true renders bare, false is omitted", () => {
  assertEqual(renderToString(h("input", { disabled: true })), "<input disabled>");
  assertEqual(renderToString(h("input", { disabled: false })), "<input>");
});

test("renderToString: htmlFor and aria props map to their attribute names", () => {
  const html = renderToString(h("label", { htmlFor: "x", ariaHidden: "true" }, "L"));
  assertEqual(html, '<label for="x" aria-hidden="true">L</label>');
});

test("renderToString: style object serializes to a CSS string (kebab + custom props)", () => {
  const html = renderToString(
    h("div", { style: { color: "red", marginTop: "4px", "--m-x": "2px" } }),
  );
  assertEqual(html, '<div style="color: red; margin-top: 4px; --m-x: 2px"></div>');
});

test("renderToString: dataset serializes to data-* attributes", () => {
  assertEqual(
    renderToString(h("div", { dataset: { userId: "7", role: "admin" } })),
    '<div data-user-id="7" data-role="admin"></div>',
  );
});

test("renderToString: event handlers and refs are omitted", () => {
  const html = renderToString(h("button", { onClick: () => {}, ref: {} }, "Go"));
  assertEqual(html, "<button>Go</button>");
});

// ── escaping (XSS safety) ───────────────────────────────────────────────────────

test("renderToString: text and attribute values are HTML-escaped", () => {
  const html = renderToString(h("p", { title: '"><x>' }, "a & b <c>"));
  assert(!html.includes("<c>"), "raw < in text must be escaped");
  assert(!html.includes('"><x>'), "raw attribute breakout must be escaped");
  assertEqual(html, '<p title="&quot;&gt;&lt;x&gt;">a &amp; b &lt;c&gt;</p>');
});

// ── hooks in server mode ────────────────────────────────────────────────────────

test("renderToString: useState/useMemo return initial values; effects don't run", () => {
  function C() {
    const [n] = useState(5);
    const doubled = useMemo(() => n * 2, [n]);
    return h("span", null, `n:${n} d:${doubled}`);
  }
  assertEqual(renderToString(C), "<span>n:5 d:10</span>");
});

test("renderToString: passes props to the root component", () => {
  function Greeting({ name }) {
    return h("p", null, `Hi ${name}`);
  }
  assertEqual(renderToString(Greeting, { name: "Ana" }), "<p>Hi Ana</p>");
});

test("renderToString: useId produces a stable id within the render", () => {
  function Field() {
    const id = useId();
    return h("label", { htmlFor: id }, h("input", { id }));
  }
  const html = renderToString(Field);
  const start = html.indexOf('for="') + 5;
  const id = html.slice(start, html.indexOf('"', start));
  assert(id.length > 0, "expected a for= attribute");
  assert(html.includes(`id="${id}"`), "input id must match the label's for");
});

test("renderToString: context provide() supplies values on the server", () => {
  const Theme = createContext("light");
  function Label() {
    return h("span", null, useContext(Theme));
  }
  function App() {
    return Theme.provide("dark", () => h("div", null, h(Label)));
  }
  assertEqual(renderToString(App), "<div><span>dark</span></div>");
});

// ── equivalence with the client DOM ─────────────────────────────────────────────

test("renderToString output matches the client-rendered DOM", async () => {
  // Uses markup that serializes identically whether set as an attribute (SSR)
  // or a DOM property (client). Property-only reflections — an <input value>
  // (property, not reflected to innerHTML) or an inline style object (which the
  // CSSOM re-normalizes with a trailing ';') — are covered by the dedicated
  // attribute/style tests above and intentionally differ from innerHTML.
  function Card({ title, n }) {
    return h(
      "article",
      { className: "m-card", dataset: { id: "42" }, ariaLabel: "card" },
      h("h2", { className: "m-title" }, title),
      h("p", { className: "muted" }, `count: ${n}`),
      h("button", { type: "button", disabled: true }, "x"),
    );
  }
  function App() {
    const [n] = useState(3);
    return h("section", { className: "m-page" }, h(Card, { title: "FluxaWay", n }));
  }

  // Server HTML, re-parsed by the browser so both sides serialize identically.
  const ssr = document.createElement("div");
  ssr.innerHTML = renderToString(App);

  const client = mountPoint();
  render(App, client);
  await flush();

  assertEqual(ssr.innerHTML, client.innerHTML);
});

// ── hydrate ─────────────────────────────────────────────────────────────────────

test("hydrate: adopts existing DOM nodes and wires up event handlers", async () => {
  function App() {
    const [n, setN] = useState(0);
    return h(
      "div",
      null,
      h("span", { className: "val" }, String(n)),
      h("button", { onClick: () => setN((v) => v + 1) }, "inc"),
    );
  }

  const container = mountPoint();
  container.innerHTML = renderToString(App); // simulate server-delivered HTML
  const spanBefore = container.querySelector(".val");
  const buttonBefore = container.querySelector("button");
  assertEqual(spanBefore.textContent, "0");

  hydrate(App, container);
  await flush();

  // the same DOM nodes are reused, not recreated
  assert(container.querySelector(".val") === spanBefore, "span should be adopted, not recreated");
  assert(container.querySelector("button") === buttonBefore, "button should be adopted, not recreated");

  buttonBefore.click();
  await flush();
  assertEqual(container.querySelector(".val").textContent, "1");
});

test("hydrate: splits adjacent server text nodes so later updates patch cleanly", async () => {
  function App() {
    const [n, setN] = useState(3);
    return h(
      "p",
      null,
      "count: ",
      String(n),
      h("button", { onClick: () => setN((v) => v + 1) }, "+"),
    );
  }

  const container = mountPoint();
  container.innerHTML = renderToString(App); // "<p>count: 3<button>+</button></p>"
  assertEqual(container.querySelector("p").firstChild.nodeType, 3);

  hydrate(App, container);
  await flush();
  // p.textContent includes the button's "+"
  assertEqual(container.querySelector("p").textContent, "count: 3+");

  container.querySelector("button").click();
  await flush();
  assertEqual(container.querySelector("p").textContent, "count: 4+");
});

test("hydrate: handles falsey children (empty text nodes) and later toggles", async () => {
  function App() {
    const [show, setShow] = useState(false);
    return h(
      "div",
      null,
      show && h("span", { className: "flag" }, "on"),
      h("button", { onClick: () => setShow(true) }, "toggle"),
    );
  }

  const container = mountPoint();
  container.innerHTML = renderToString(App); // "<div><button>toggle</button></div>"
  hydrate(App, container);
  await flush();
  assert(container.querySelector(".flag") === null, "hidden content stays absent after hydration");

  container.querySelector("button").click();
  await flush();
  assert(container.querySelector(".flag") !== null, "toggled content appears after hydration");
  assertEqual(container.querySelector(".flag").textContent, "on");
});

test("hydrate: a post-hydration update keeps the same root element", async () => {
  function App() {
    const [n, setN] = useState(0);
    return h("section", { className: "root" }, h("button", { onClick: () => setN((v) => v + 1) }, String(n)));
  }

  const container = mountPoint();
  container.innerHTML = renderToString(App);
  const rootBefore = container.querySelector(".root");

  hydrate(App, container);
  await flush();

  container.querySelector("button").click();
  await flush();

  assert(container.querySelector(".root") === rootBefore, "root element should persist across updates");
  assertEqual(container.querySelector("button").textContent, "1");
});


// ── Charts under SSR (fluxaway-charts.js) ──────────────────────────────────
//
// Charts measure themselves with ResizeObserver, which does not exist on the
// server. The point of these is that the server render is still a COMPLETE,
// readable chart — real geometry from the fallback width, and the table view
// present — rather than an empty shell waiting for hydration.

import {
  LineChart as SsrLine,
  BarChart as SsrBar,
  DonutChart as SsrDonut,
  MetricCard as SsrMetric,
  Sparkline as SsrSparkline,
} from "../dist/fluxaway-charts.js";

const SSR_ROWS = [
  { month: "Jan", visits: 1200, signups: 300 },
  { month: "Feb", visits: 1900, signups: 420 },
];

test("renderToString: a line chart serializes real geometry, not an empty shell", () => {
  const html = renderToString(() => h(SsrLine, {
    data: SSR_ROWS, x: "month",
    series: [{ key: "visits", label: "Visits" }, { key: "signups", label: "Signups" }],
  }));

  assert(html.includes("<svg"), "the SVG must be in the server output");
  // a real path with coordinates — the fallback width still produces geometry
  assert(html.includes('class="m-chart-line-path"'), "the series path must be rendered");
  assert(html.includes("M ") && html.includes("L "), "the path must carry actual coordinates");
  assert(!html.includes("NaN"), "no NaN may reach the server output");
});

test("renderToString: the table twin is server-rendered, so the data is in the HTML", () => {
  const html = renderToString(() => h(SsrBar, { data: SSR_ROWS, x: "month", y: "visits" }));

  assert(html.includes("m-chart-table"), "the table view must be part of the server output");
  // the values themselves, not just the markup around them
  assert(html.includes("1,200") || html.includes("1200"), "row values must be serialized");
  assert(html.includes("Jan"), "row categories must be serialized");
});

test("renderToString: a legend appears for two series and is omitted for one", () => {
  const two = renderToString(() => h(SsrLine, {
    data: SSR_ROWS, x: "month",
    series: [{ key: "visits", label: "Visits" }, { key: "signups", label: "Signups" }],
  }));
  const one = renderToString(() => h(SsrLine, { data: SSR_ROWS, x: "month", y: "visits" }));

  assert(two.includes("m-chart-legend"), "two series must ship a legend server-side too");
  assert(!one.includes("m-chart-legend"), "a single series needs no legend box");
});

test("renderToString: MetricCard writes its value even though countUp cannot run", () => {
  // countUp drives the DOM from an effect, which never fires on the server —
  // the static render must already contain the number.
  const html = renderToString(() => h(SsrMetric, { label: "Users", value: 12900, countUp: true }));
  assert(html.includes("13K"), `expected the formatted value in the SSR output, got ${html}`);
});

test("renderToString: charts with no data serialize their empty state", () => {
  const html = renderToString(() => h(SsrDonut, { data: [], x: "k", y: "n" }));
  assert(html.includes("m-chart-empty"), "an empty chart must say so server-side");
  assert(!html.includes("<svg"), "no plot should be drawn for empty data");
});

test("renderToString: a sparkline serializes without axes or chrome", () => {
  const html = renderToString(() => h(SsrSparkline, { values: [1, 4, 2, 8] }));
  assert(html.includes("m-chart-sparkline"), "the sparkline must render");
  assert(!html.includes("m-chart-axis"), "a sparkline is a glyph — no axes");
});
