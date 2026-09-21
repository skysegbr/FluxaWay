// Tests for useForm and useRouter hooks.

import {
  h,
  render,
  useEffect,
  useRef,
  useState,
  useForm,
  useRouter,
  useRoutes,
  matchPath,
} from "../dist/fluxaway.js";
import { Button } from "../dist/fluxaway-components-core.js";
import { TextField, Textarea } from "../dist/fluxaway-components-forms.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

// ── useForm ───────────────────────────────────────────────────────────────────

test("useForm: values reflect initialValues on first render", async () => {
  let capturedValues;

  function Form() {
    const { values } = useForm({ initialValues: { name: "Alice", age: 30 } });
    capturedValues = values;
    return h("div", null);
  }

  const container = mountPoint();
  render(Form, container);
  await flush();

  assertEqual(capturedValues.name, "Alice");
  assertEqual(capturedValues.age, 30);
});

test("useForm: setValue updates a single field and triggers re-render", async () => {
  let capturedValues;
  let setValueFn;

  function Form() {
    const { values, setValue } = useForm({ initialValues: { name: "Alice" } });
    capturedValues = values;
    setValueFn = setValue;
    return h("div", null);
  }

  const container = mountPoint();
  render(Form, container);
  await flush();
  assertEqual(capturedValues.name, "Alice");

  setValueFn("name", "Bob");
  await flush();
  assertEqual(capturedValues.name, "Bob");
});

test("useForm: dirty becomes true when a field absent from initialValues is set", async () => {
  let capturedDirty;
  let setValueFn;
  let resetFn;

  function Form() {
    const { dirty, setValue, reset } = useForm({ initialValues: {} });
    capturedDirty = dirty;
    setValueFn = setValue;
    resetFn = reset;
    return h("div", null);
  }

  render(Form, mountPoint());
  await flush();
  assertEqual(capturedDirty, false, "form starts clean");

  setValueFn("email", "a@b.com");
  await flush();
  assertEqual(capturedDirty, true, "adding a field not in initialValues marks the form dirty");

  resetFn();
  await flush();
  assertEqual(capturedDirty, false, "reset clears dirty again");
});

test("useForm: field onChange handler updates the field value", async () => {
  let capturedValues;
  let capturedField;

  function Form() {
    const { values, field } = useForm({
      initialValues: { email: "" },
      validateOnChange: true,
    });
    capturedValues = values;
    capturedField = field("email");
    return h("div", null);
  }

  const container = mountPoint();
  render(Form, container);
  await flush();
  assertEqual(capturedValues.email, "");

  capturedField.onChange({ target: { value: "user@example.com" } });
  await flush();
  assertEqual(capturedValues.email, "user@example.com");
});

test("useForm: validate causes error to appear then disappear when field is corrected", async () => {
  let capturedErrors;
  let setValueFn;
  let validateFn;

  function Form() {
    const { errors, setValue, validateForm } = useForm({
      initialValues: { name: "" },
      validate: ({ name }) => (name ? {} : { name: "Required" }),
    });
    capturedErrors = errors;
    setValueFn = setValue;
    validateFn = validateForm;
    return h("div", null);
  }

  const container = mountPoint();
  render(Form, container);
  await flush();
  // No errors before validation
  assertEqual(capturedErrors.name, undefined);

  // Validate with empty value → error should appear
  validateFn({ name: "" });
  await flush();
  assertEqual(capturedErrors.name, "Required");

  // Fix the value → error should disappear
  setValueFn("name", "Alice");
  validateFn({ name: "Alice" });
  await flush();
  assertEqual(capturedErrors.name, undefined, "error should clear when value becomes valid");
});

test("useForm: handleSubmit blocks and returns false when validation fails", async () => {
  let submitCalled = false;
  let handleSubmitFn;

  function Form() {
    const { handleSubmit } = useForm({
      initialValues: { name: "" },
      validate: ({ name }) => (name ? {} : { name: "Required" }),
      onSubmit: () => {
        submitCalled = true;
      },
    });
    handleSubmitFn = handleSubmit();
    return h("div", null);
  }

  const container = mountPoint();
  render(Form, container);
  await flush();

  const result = await handleSubmitFn(null);
  await flush();

  assertEqual(result, false, "handleSubmit should return false when form is invalid");
  assert(!submitCalled, "onSubmit should not be called when validation fails");
});

test("useForm: handleSubmit calls onSubmit and returns true when form is valid", async () => {
  let submittedValues = null;
  let handleSubmitFn;

  function Form() {
    const { handleSubmit } = useForm({
      initialValues: { name: "Alice" },
      validate: ({ name }) => (name ? {} : { name: "Required" }),
      onSubmit: (values) => {
        submittedValues = values;
      },
    });
    handleSubmitFn = handleSubmit();
    return h("div", null);
  }

  const container = mountPoint();
  render(Form, container);
  await flush();

  const result = await handleSubmitFn(null);
  await flush();

  assertEqual(result, true, "handleSubmit should return true when form is valid");
  assertEqual(submittedValues.name, "Alice");
});

// When field().error appears and when it goes away. Blur validates the whole
// form, so leaving `name` records an error for the still-empty `message`.

const twoFieldValidate = (v) => ({
  name: v.name.trim().length < 2 ? "Name too short" : "",
  message: v.message.trim().length < 10 ? "Message too short" : "",
});

test("useForm: typing does not mark a field touched or show an error recorded by another field's blur", async () => {
  let form;

  function Form() {
    form = useForm({ initialValues: { name: "", message: "" }, validate: twoFieldValidate });
    return h("div", null);
  }

  render(Form, mountPoint());
  await flush();

  form.field("name").onInput({ target: { value: "Ana" } });
  await flush();
  form.field("name").onBlur({ target: { value: "Ana" } });
  await flush();
  assertEqual(form.errors.message, "Message too short", "blur validates the whole form");

  form.field("message").onInput({ target: { value: "Hi" } });
  await flush();
  assertEqual(Boolean(form.touched.message), false, "typing must not touch the field");
  assertEqual(form.field("message").error, "", "an untouched field shows no error while typing");
});

test("useForm: a recorded error clears as soon as the value becomes valid, before any blur", async () => {
  let form;

  function Form() {
    form = useForm({ initialValues: { name: "", message: "" }, validate: twoFieldValidate });
    return h("div", null);
  }

  render(Form, mountPoint());
  await flush();

  form.field("message").onBlur({ target: { value: "" } });
  await flush();
  assertEqual(form.field("message").error, "Message too short", "blur shows the error");

  form.field("message").onInput({ target: { value: "Still bad" } });
  await flush();
  assertEqual(form.field("message").error, "Message too short", "still invalid, still shown");

  form.field("message").onInput({ target: { value: "A bouquet of roses, please." } });
  await flush();
  assertEqual(form.field("message").error, "", "valid value clears the error without a blur");
  assertEqual(form.errors.name, "Name too short", "other fields' errors are left alone");
});

test("useForm: typing never raises a new error on a valid touched field", async () => {
  let form;

  function Form() {
    form = useForm({ initialValues: { name: "Ana", message: "" }, validate: twoFieldValidate });
    return h("div", null);
  }

  render(Form, mountPoint());
  await flush();

  form.field("name").onBlur({ target: { value: "Ana" } });
  await flush();
  assertEqual(form.field("name").error, "", "valid on blur");

  form.field("name").onInput({ target: { value: "A" } });
  await flush();
  assertEqual(form.field("name").error, "", "invalid while typing stays quiet until blur");

  form.field("name").onBlur({ target: { value: "A" } });
  await flush();
  assertEqual(form.field("name").error, "Name too short", "blur raises it");
});

test("useForm: validateOnChange still touches and validates on the first keystroke", async () => {
  let form;

  function Form() {
    form = useForm({
      initialValues: { name: "", message: "" },
      validate: twoFieldValidate,
      validateOnChange: true,
    });
    return h("div", null);
  }

  render(Form, mountPoint());
  await flush();

  form.field("name").onInput({ target: { value: "A" } });
  await flush();
  assertEqual(form.touched.name, true);
  assertEqual(form.field("name").error, "Name too short");
});

test("useForm: the submit button does not move when the last valid field blurs", async () => {
  function Form() {
    const form = useForm({ initialValues: { name: "", message: "" }, validate: twoFieldValidate });
    return h(
      "form",
      { noValidate: true, onSubmit: form.handleSubmit() },
      h(TextField, { ...form.field("name"), label: "Name", id: "shift-name" }),
      h(Textarea, { ...form.field("message"), label: "Message", id: "shift-message" }),
      h(Button, { type: "submit", id: "shift-submit" }, "Send"),
    );
  }

  const container = mountPoint();
  render(Form, container);
  await flush();

  const type = async (id, text) => {
    const el = container.querySelector(`#${id}`);
    el.focus();
    el.value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
    return el;
  };

  const name = await type("shift-name", "Ana");
  name.dispatchEvent(new FocusEvent("blur"));
  await flush();

  const message = await type("shift-message", "A bouquet of roses, please.");
  assertEqual(container.querySelectorAll(".m-error").length, 0, "no error line while typing a valid value");

  const before = container.querySelector("#shift-submit").getBoundingClientRect().top;
  message.dispatchEvent(new FocusEvent("blur"));
  await flush();
  const after = container.querySelector("#shift-submit").getBoundingClientRect().top;

  assertEqual(after, before, "a layout shift here lands mouseup off the button and eats the click");
});

// Enter submits from inside the last field, so that field is still focused, and
// now empty, when onSubmit calls reset(). Whatever ends that focus must not put
// "Required" under the success notice. `order` is where the app moves focus:
// "notice" (in an effect, once the notice exists), "blur-after" / "blur-before"
// (synchronously, around reset()), or "none".
function mountResetForm(order) {
  const container = mountPoint();
  const id = `reset-${order}`;
  const state = {};

  function Form() {
    const [sent, setSent] = useState(0);
    const notice = useRef(null);
    state.form = useForm({
      initialValues: { name: "" },
      validate: (v) => ({ name: v.name.trim() ? "" : "Required" }),
      onSubmit: (_values, { reset }) => {
        if (order === "blur-before") document.activeElement.blur();
        reset();
        if (order === "blur-after") document.activeElement.blur();
        setSent((count) => count + 1);
      },
    });
    useEffect(() => {
      if (order === "notice" && sent) notice.current.focus();
    }, [sent]);
    return h(
      "form",
      { noValidate: true, onSubmit: state.form.handleSubmit() },
      h(TextField, { ...state.form.field("name"), label: "Name", id }),
      sent ? h("p", { ref: notice, tabIndex: -1, id: `${id}-sent` }, "Sent.") : null,
    );
  }

  render(Form, container);
  const input = () => container.querySelector(`#${id}`);
  const errorLines = () => container.querySelectorAll(".m-error").length;
  const type = async (text) => {
    input().value = text;
    input().dispatchEvent(new Event("input", { bubbles: true }));
    await flush();
  };
  const typeAndSubmit = async (text) => {
    await flush();
    input().focus();
    await type(text);
    input().form.requestSubmit();
    await flush();
  };
  return { state, input, errorLines, type, typeAndSubmit };
}

for (const [order, how] of [
  ["notice", "focus moved to the notice in an effect"],
  ["blur-after", "blur() right after reset()"],
  ["blur-before", "blur() right before reset()"],
]) {
  test(`useForm: Enter, reset(), then ${how}: no error under the notice`, async () => {
    const t = mountResetForm(order);
    await t.typeAndSubmit("Ana");
    await flush();
    assert(document.activeElement !== t.input(), "the field should have lost focus");
    assertEqual(t.state.form.values.name, "", "reset() cleared the value");
    assertEqual(t.errorLines(), 0, "an error line appeared next to the success notice");
    assert(!t.state.form.touched.name, "the field was touched by the blur that ended its old focus");
  });
}

test("useForm: reset() leaves focus in the field, and the blur that ends it validates nothing", async () => {
  const t = mountResetForm("none");
  await t.typeAndSubmit("Ana");
  assertEqual(document.activeElement, t.input(), "reset() must not move focus: Enter, reset, type the next one");

  t.input().blur(); // the first click anywhere
  await flush();
  assertEqual(t.errorLines(), 0, "the first click after an Enter submit showed an error");
  assert(!t.state.form.touched.name, "the field was touched");

  // Only that one blur is ignored: a new visit behaves like a fresh form.
  t.input().focus();
  t.input().blur();
  await flush();
  assertEqual(t.state.form.field("name").error, "Required", "focusing and leaving the field again validates it");
});

test("useForm: editing the field that kept focus through reset() makes its blur count again", async () => {
  const t = mountResetForm("none");
  await t.typeAndSubmit("Ana");
  await t.type("B");
  await t.type("");
  t.input().blur();
  await flush();
  assertEqual(t.state.form.field("name").error, "Required", "the person used the field after the reset");
});

// ── useRouter (hash mode) ─────────────────────────────────────────────────────

test("useRouter hash: path defaults to '/' when no hash is set", async () => {
  const prevHash = window.location.hash;
  window.location.hash = "";
  await flush();

  let capturedPath;

  function App() {
    const { path } = useRouter({ mode: "hash" });
    capturedPath = path;
    return h("div", null);
  }

  const container = mountPoint();
  render(App, container);
  await flush();

  assertEqual(capturedPath, "/");

  window.location.hash = prevHash;
  await flush();
});

test("useRouter hash: navigate updates path and re-renders dependent UI", async () => {
  const prevHash = window.location.hash;
  window.location.hash = "#/home";
  await flush();

  let capturedPath;
  let navigateFn;

  function App() {
    const { path, navigate } = useRouter({ mode: "hash" });
    capturedPath = path;
    navigateFn = navigate;
    return h("div", null, path === "/home" ? "Home" : "Other");
  }

  const container = mountPoint();
  render(App, container);
  await flush();

  assertEqual(capturedPath, "/home");
  assertEqual(container.querySelector("div").textContent, "Home");

  navigateFn("/about");
  await flush();

  assertEqual(capturedPath, "/about");
  assertEqual(container.querySelector("div").textContent, "Other");

  window.location.hash = prevHash;
  await flush();
});

// ── matchPath ─────────────────────────────────────────────────────────────────

test("matchPath: static segments match exactly", () => {
  assert(matchPath("/about", "/about") !== null);
  assertEqual(matchPath("/about", "/contact"), null);
  assertEqual(matchPath("/", "/").rest, "");
});

test("matchPath: :param captures a URL-decoded segment", () => {
  const m = matchPath("/users/:id", "/users/42");
  assert(m !== null);
  assertEqual(m.params.id, "42");
  const decoded = matchPath("/tags/:name", "/tags/a%20b");
  assertEqual(decoded.params.name, "a b");
});

test("matchPath: extra segments fail an exact (end) match", () => {
  assertEqual(matchPath("/users/:id", "/users/42/edit"), null);
});

test("matchPath: trailing * captures the remainder", () => {
  const m = matchPath("/files/*", "/files/a/b.png");
  assert(m !== null);
  assertEqual(m.params["*"], "a/b.png");
});

test("matchPath: { end:false } prefix-matches and returns the rest", () => {
  const m = matchPath("/users", "/users/42/edit", { end: false });
  assert(m !== null);
  assertEqual(m.rest, "42/edit");
});

// ── useRoutes ─────────────────────────────────────────────────────────────────

test("useRoutes: renders the matching route by path", async () => {
  const prevHash = window.location.hash;
  window.location.hash = "#/about";
  await flush();

  const routes = [
    { path: "/", element: h("p", null, "home") },
    { path: "/about", element: h("p", null, "about") },
  ];

  function App() {
    return useRoutes(routes);
  }

  const container = mountPoint();
  render(App, container);
  await flush();

  assertEqual(container.querySelector("p").textContent, "about");

  window.location.hash = prevHash;
  await flush();
});

test("useRoutes: nested routes render the parent's outlet with merged params", async () => {
  const prevHash = window.location.hash;
  window.location.hash = "#/users/42/posts/7";
  await flush();

  function UsersLayout({ params, outlet }) {
    return h("section", null, h("span", { className: "uid" }, params.id), outlet);
  }
  function Post({ params }) {
    return h("span", { className: "pid" }, params.postId);
  }

  const routes = [
    {
      path: "/users/:id",
      component: UsersLayout,
      children: [{ path: "/posts/:postId", component: Post }],
    },
  ];

  function App() {
    return useRoutes(routes);
  }

  const container = mountPoint();
  render(App, container);
  await flush();

  assertEqual(container.querySelector(".uid").textContent, "42");
  assertEqual(container.querySelector(".pid").textContent, "7");

  window.location.hash = prevHash;
  await flush();
});

test("useRoutes: falls back to notFound when nothing matches", async () => {
  const prevHash = window.location.hash;
  window.location.hash = "#/nope";
  await flush();

  const routes = [{ path: "/home", element: h("p", null, "home") }];

  function App() {
    return useRoutes(routes, { notFound: h("p", { className: "nf" }, "404") });
  }

  const container = mountPoint();
  render(App, container);
  await flush();

  assertEqual(container.querySelector(".nf").textContent, "404");

  window.location.hash = prevHash;
  await flush();
});

test("useRoutes: lazy route shows fallback then the loaded component", async () => {
  const prevHash = window.location.hash;
  window.location.hash = "#/lazy";
  await flush();

  function Loaded() {
    return h("p", { className: "loaded" }, "loaded");
  }

  // A deferred promise lets us hold the route in its loading state across a
  // flush, then resolve it deterministically.
  let resolveLoader;
  const loaderPromise = new Promise((resolve) => {
    resolveLoader = resolve;
  });

  const routes = [
    {
      path: "/lazy",
      lazy: () => loaderPromise,
      fallback: h("p", { className: "fallback" }, "loading"),
    },
  ];

  function App() {
    return useRoutes(routes);
  }

  const container = mountPoint();
  render(App, container);
  await flush();

  // still pending → fallback is shown
  assert(container.querySelector(".fallback") !== null, "expected the lazy fallback while pending");
  assert(container.querySelector(".loaded") === null, "did not expect the component before resolve");

  // resolve the loader and let the root re-render
  resolveLoader({ default: Loaded });
  await flush();
  await flush();

  assert(container.querySelector(".loaded") !== null, "expected the loaded component after resolve");
  assert(container.querySelector(".fallback") === null, "expected the fallback gone after resolve");

  window.location.hash = prevHash;
  await flush();
});

test("useRoutes: css + lazy route holds the fallback until both module and stylesheet are ready", async () => {
  const prevHash = window.location.hash;
  window.location.hash = "#/styled-lazy";
  await flush();

  function Page() {
    return h("p", { className: "cssr-a" }, "styled");
  }

  // The deferred loader makes the pending state deterministic; the stylesheet
  // is a real fixture fetched over HTTP, so Promise.all also gates on it.
  let resolveLoader;
  const loaderPromise = new Promise((resolve) => {
    resolveLoader = resolve;
  });

  const routes = [
    {
      path: "/styled-lazy",
      lazy: () => loaderPromise,
      css: "./css-route-a.fixture.css",
      fallback: h("p", { className: "css-fallback" }, "loading"),
    },
  ];

  function App() {
    return useRoutes(routes);
  }

  const container = mountPoint();
  render(App, container);
  await flush();

  assert(container.querySelector(".css-fallback") !== null, "expected the fallback while pending");
  assert(container.querySelector(".cssr-a") === null, "did not expect the page before resolve");

  resolveLoader({ default: Page });
  // Wait (bounded) for the stylesheet fetch + re-render to settle.
  for (let i = 0; i < 200 && !container.querySelector(".cssr-a"); i += 1) await flush();

  const page = container.querySelector(".cssr-a");
  assert(page !== null, "expected the page after module + stylesheet resolved");
  assert(container.querySelector(".css-fallback") === null, "expected the fallback gone");
  assertEqual(
    getComputedStyle(page).paddingLeft,
    "9px",
    "expected the route CSS to be applied by the time the page shows (no FOUC)",
  );

  window.location.hash = prevHash;
  await flush();
});

test("useRoutes: css on a non-lazy route injects the stylesheet and renders the page styled", async () => {
  const prevHash = window.location.hash;
  window.location.hash = "#/styled-static";
  await flush();

  function Page() {
    return h("p", { className: "cssr-b" }, "styled static");
  }

  const routes = [
    {
      path: "/styled-static",
      component: Page,
      css: "./css-route-b.fixture.css",
      fallback: h("p", { className: "css-fallback" }, "loading"),
    },
  ];

  function App() {
    return useRoutes(routes);
  }

  const container = mountPoint();
  render(App, container);
  // Wait (bounded) for the stylesheet fetch + re-render to settle.
  for (let i = 0; i < 200 && !container.querySelector(".cssr-b"); i += 1) await flush();

  const page = container.querySelector(".cssr-b");
  assert(page !== null, "expected the page once its stylesheet loaded");
  assertEqual(
    getComputedStyle(page).letterSpacing,
    "3px",
    "expected the route CSS to be applied by the time the page shows",
  );

  const url = new URL("./css-route-b.fixture.css", document.baseURI).href;
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')].filter(
    (link) => link.href === url,
  );
  assertEqual(links.length, 1, "expected the route stylesheet to be injected exactly once");

  window.location.hash = prevHash;
  await flush();
});

