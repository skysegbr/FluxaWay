import { h, render } from "../dist/fluxaway.js";
import { Alert, Button, TextField } from "../dist/fluxaway-components.js";
import { METAL_THEMES, useMetalTheme } from "../dist/fluxaway-metallic.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

function resetMetalTheme() {
  document.documentElement.removeAttribute("data-design");
  document.documentElement.removeAttribute("data-metal-theme");
  document.documentElement.removeAttribute("data-theme");
  localStorage.removeItem("fluxaway-metal-theme");
}

test("useMetalTheme: exposes seven finishes and persists a valid selection", async () => {
  resetMetalTheme();
  let captured;

  function Widget() {
    captured = useMetalTheme();
    return h("div", null);
  }

  render(Widget, mountPoint());
  await flush();

  assertEqual(captured.metalTheme, "aurum");
  assertEqual(captured.metalThemes.join(","), METAL_THEMES.join(","));
  assertEqual(METAL_THEMES.length, 7);

  captured.setMetalTheme("black-inox");
  await flush();

  assertEqual(captured.metalTheme, "black-inox");
  assertEqual(document.documentElement.dataset.metalTheme, "black-inox");
  assertEqual(localStorage.getItem("fluxaway-metal-theme"), "black-inox");

  captured.setMetalTheme("plastic");
  await flush();
  assertEqual(captured.metalTheme, "black-inox", "unknown finishes are ignored");
  resetMetalTheme();
});

test("useMetalTheme: rejects an invalid stored finish", async () => {
  resetMetalTheme();
  localStorage.setItem("fluxaway-metal-theme", "plastic");
  let captured;

  function Widget() {
    captured = useMetalTheme();
    return h("div", null);
  }

  render(Widget, mountPoint());
  await flush();

  assertEqual(captured.metalTheme, "aurum");
  assertEqual(document.documentElement.dataset.metalTheme, "aurum");
  assertEqual(localStorage.getItem("fluxaway-metal-theme"), "aurum");
  resetMetalTheme();
});

test("metallic skin: materials reskin controls while semantic alerts remain recognizable", async () => {
  resetMetalTheme();
  document.documentElement.dataset.design = "metallic";
  document.documentElement.dataset.metalTheme = "cobalt";
  const container = mountPoint();

  function Specimen() {
    return h(
      "div",
      null,
      h(Button, { variant: "contained" }, "Engage"),
      h(Alert, { variant: "danger", title: "Blocked" }, "Signature mismatch"),
      h(TextField, { label: "Endpoint", error: "Invalid endpoint" }),
    );
  }

  render(Specimen, container);
  await flush();

  const button = container.querySelector(".m-button-contained");
  const alert = container.querySelector(".m-alert-danger");
  const field = container.querySelector(".m-field-error");
  const buttonStyle = getComputedStyle(button);
  const alertStyle = getComputedStyle(alert);

  assert(buttonStyle.backgroundImage !== "none", "contained button keeps a metallic reflection");
  assertEqual(buttonStyle.backgroundRepeat, "no-repeat", "metallic reflection never tiles into a hard seam");
  assertEqual(buttonStyle.fontWeight, "600", "metallic actions use a readable interface weight");
  assert(parseFloat(buttonStyle.letterSpacing) < 1, "metallic action tracking stays compact");
  assert(alertStyle.backgroundImage !== "none", "semantic alert uses a metallic body");
  assert(alertStyle.borderLeftColor !== "rgba(0, 0, 0, 0)", "semantic alert keeps a visible state rail");
  assert(getComputedStyle(field).backgroundImage !== "none", "invalid field uses the same material language");

  document.documentElement.dataset.metalTheme = "bronze";
  await flush();
  assertEqual(getComputedStyle(document.documentElement).getPropertyValue("--mx-material-name").trim(), "bronze");
  resetMetalTheme();
});
