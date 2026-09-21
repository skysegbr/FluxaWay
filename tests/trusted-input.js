// Fixture for the trusted-input phase of scripts/run_browser_tests.py.
//
// The page only renders; the scenarios live in the Python driver, because they
// need what a script cannot fake: a real mousedown (which blurs the focused
// field), a human pause, then the mouseup.

import { h, render, useForm } from "../dist/fluxaway.js";
import { Button } from "../dist/fluxaway-components-core.js";
import { Checkbox, TextField, Textarea } from "../dist/fluxaway-components-forms.js";
import { Navbar } from "../dist/fluxaway-components-nav.js";

window.__submits = 0;
window.__sends = 0;

// A ResizeObserver that resizes what it observes reports here, not as a throw.
window.__errors = [];
window.addEventListener("error", (event) => window.__errors.push(String(event.message)));

const validate = (v) => ({
  name: v.name.trim().length < 2 ? "Name too short" : "",
  message: v.message.trim().length < 10 ? "Message too short" : "",
  terms: v.terms ? "" : "Accept the terms",
});

// The shape AI_SPEC §6 recommends: a real <form> with a submit button.
function SubmitForm() {
  const form = useForm({
    initialValues: { name: "", message: "", terms: false },
    validate,
    onSubmit: () => {
      window.__submits += 1;
    },
  });

  window.__form = { errors: form.errors, touched: form.touched, values: form.values };

  return h(
    "form",
    { noValidate: true, onSubmit: form.handleSubmit() },
    h(TextField, { ...form.field("name"), label: "Name", id: "t-name" }),
    h(Textarea, { ...form.field("message"), label: "Message", id: "t-message" }),
    h(Checkbox, { ...form.field("terms", { type: "checkbox" }), label: "I accept the terms", id: "t-terms" }),
    h(Button, { type: "submit", id: "t-submit" }, "Send"),
    h(Button, { id: "t-reset", onClick: () => form.reset() }, "Reset"),
  );
}

// The first example of AI_SPEC §6: no <form>, a plain button calling handleSubmit().
function ClickForm() {
  const form = useForm({
    initialValues: { email: "" },
    validate: (v) => ({ email: v.email.includes("@") ? "" : "Invalid e-mail" }),
    onSubmit: () => {
      window.__sends += 1;
    },
  });

  return h(
    "div",
    null,
    h(TextField, { ...form.field("email"), label: "E-mail", id: "t-email" }),
    h(Button, { id: "t-send", onClick: form.handleSubmit() }, "Sign in"),
  );
}

const navItems = [
  { label: "One", href: "#one" },
  { label: "Two", href: "#two" },
];

// Too many links for a narrow desktop: the bar has to measure, not guess.
const manyNavItems = ["Features", "Catalogue", "About us", "Testimonials", "Contact", "Journal", "Our team"].map(
  (label, index) => ({ label, href: `#many-${index}` }),
);

function App() {
  return h(
    "div",
    { style: { display: "grid", gap: "32px" } },
    h(
      "section",
      { id: "s-navbar" },
      h(Navbar, { brand: "Shop", items: navItems, actions: h(Button, { id: "t-nav-action" }, "Action") }),
    ),
    h("section", { id: "s-navbar-bare" }, h(Navbar, { items: navItems })),
    h("section", { id: "s-submit" }, h(SubmitForm, null)),
    h("section", { id: "s-click" }, h(ClickForm, null)),
    // A grid item is never narrower than its content: a bar that could not wrap
    // would push this column out to the width of its links.
    h("section", { id: "s-navbar-column" }, h(Navbar, { items: manyNavItems })),
  );
}

function Wide() {
  return h(
    "section",
    { id: "s-navbar-many" },
    h(Navbar, { brand: "Garden Flowers", items: manyNavItems, actions: h(Button, null, "Sign in") }),
  );
}

render(App, document.getElementById("app"));
render(Wide, document.getElementById("wide"));
window.__ready = true;
