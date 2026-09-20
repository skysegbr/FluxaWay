// Every piece of text a component writes on its own is a prop with an English
// default, so a page in another language can replace each one.

import { h, render } from "../dist/fluxaway.js";
import { AvatarGroup, FormField } from "../dist/fluxaway-components-core.js";
import { Navbar } from "../dist/fluxaway-components-nav.js";
import { TextField, RadioGroup, Combobox, DatePicker } from "../dist/fluxaway-components-forms.js";
import { Toast, ToastStack, BottomSheet, CommandPalette } from "../dist/fluxaway-components-overlay.js";
import { Pagination } from "../dist/fluxaway-components-data.js";
import { ThemeToggle, PaletteSwitcher, DesignSwitcher } from "../dist/fluxaway-components-theme.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

const ENGLISH_DEFAULTS = [
  "Open menu", "Close menu", "Switch to light theme", "Switch to dark theme", "Color palette",
  "Custom color", "Design", "required", "Pagination", "Previous page", "Next page", "Dismiss",
  "Close", "Command palette", "No results", "Previous month", "Next month", "2 more",
  "Violet", "Rose",
];

const OPTIONS = [{ value: "rosas", label: "Rosas" }];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const noop = () => {};

function Sampler({ pt = false } = {}) {
  const when = (props) => (pt ? props : {});
  return h(
    "div",
    null,
    h(Navbar, { brand: "Loja", items: [{ label: "Um", href: "#um" }], ...when({ openMenuLabel: "Abrir menu", closeMenuLabel: "Fechar menu" }) }),
    h(ThemeToggle, when({ switchToLightLabel: "Mudar para o tema claro", switchToDarkLabel: "Mudar para o tema escuro" })),
    h(PaletteSwitcher, when({ ariaLabel: "Paleta de cores", customLabel: "Cor personalizada", paletteLabels: { default: "Padrão", violet: "Violeta", rose: "Rosa", blue: "Azul", amber: "Âmbar", emerald: "Esmeralda" } })),
    h(DesignSwitcher, when({ ariaLabel: "Estilo visual" })),
    h(TextField, { id: "lbl-nome", label: "Nome", required: true, ...when({ requiredLabel: "obrigatório" }) }),
    h(RadioGroup, { id: "lbl-radio", label: "Flor", name: "lbl-flor", required: true, options: OPTIONS, ...when({ requiredLabel: "obrigatório" }) }),
    h(Pagination, { page: 2, total: 5, ...when({ ariaLabel: "Paginação", previousLabel: "Página anterior", nextLabel: "Próxima página" }) }),
    h(Toast, { message: "Salvo", onClose: noop, ...when({ closeLabel: "Dispensar" }) }),
    h(ToastStack, { toasts: [{ id: 1, message: "Enviado" }], onClose: noop, ...when({ closeLabel: "Dispensar" }) }),
    h(BottomSheet, { open: true, title: "Opções", onClose: noop, ...when({ closeLabel: "Fechar" }) }, "Corpo"),
    h(CommandPalette, { open: true, id: "lbl-cmd", commands: [], ...when({ ariaLabel: "Paleta de comandos", emptyLabel: "Nenhum comando", placeholder: "Digite um comando" }) }),
    h(AvatarGroup, { max: 1, avatars: [{ name: "Ana" }, { name: "Bia" }, { name: "Caio" }], ...when({ moreLabel: (count) => `mais ${count}` }) }),
  );
}

// aria-labels, titles and the text of the framework's own empty states — wherever
// they were rendered (overlays portal out of the container).
function spoken(root) {
  const found = [];
  root.querySelectorAll("[aria-label]").forEach((node) => found.push(node.getAttribute("aria-label")));
  root.querySelectorAll("[title]").forEach((node) => found.push(node.getAttribute("title")));
  root.querySelectorAll(".m-combobox-empty, .m-command-empty, .m-datepicker-month").forEach((node) => found.push(node.textContent.trim()));
  return found;
}

test("labels: the defaults are unchanged English", async () => {
  const container = mountPoint();
  render(() => h(Sampler, null), container);
  await flush();

  const found = spoken(document.body);
  for (const expected of ["Open menu", "required", "Pagination", "Previous page", "Next page", "Dismiss", "Close", "Command palette", "Color palette", "Custom color", "Design", "2 more", "Violet"]) {
    assert(found.includes(expected), `missing default "${expected}" in ${JSON.stringify(found)}`);
  }
  assert(found.some((label) => label.startsWith("Switch to ")), "ThemeToggle default");
});

test("labels: every built-in text can be replaced by a prop, leaving no English behind", async () => {
  const container = mountPoint();
  render(() => h(Sampler, { pt: true }), container);
  await flush();

  const found = spoken(container).concat(spoken(document.body).filter((text) => !ENGLISH_DEFAULTS.includes(text)));
  for (const expected of ["Abrir menu", "obrigatório", "Paginação", "Página anterior", "Próxima página", "Dispensar", "Fechar", "Paleta de comandos", "Paleta de cores", "Cor personalizada", "Estilo visual", "mais 2", "Violeta"]) {
    assert(found.includes(expected), `missing "${expected}" in ${JSON.stringify(found)}`);
  }
  assert(found.some((label) => label.startsWith("Mudar para o tema ")), "ThemeToggle prop");

  const leaked = spoken(container).filter((text) => ENGLISH_DEFAULTS.includes(text));
  assertEqual(leaked.join(" | "), "", "an English default leaked through");
  assertEqual(spoken(container).filter((text) => text === "obrigatório").length, 2, "TextField forwards requiredLabel to FormField; RadioGroup has its own");
});

test("labels: requiredLabel \"\" keeps the asterisk visual when the control already says required", async () => {
  const container = mountPoint();
  render(
    () =>
      h(
        "div",
        null,
        h(TextField, { id: "lbl-native", label: "Nome", required: true, requiredLabel: "" }),
        h(FormField, { id: "lbl-plain", label: "Outro", required: true }, h("input", { id: "lbl-plain" })),
      ),
    container,
  );
  await flush();

  const [silent, spokenMark] = container.querySelectorAll(".m-required");
  assertEqual(silent.textContent, "*", "still drawn");
  assertEqual(silent.getAttribute("aria-hidden"), "true");
  assertEqual(silent.hasAttribute("aria-label"), false, "no empty aria-label left for a reader to trip on");
  assertEqual(container.querySelector("#lbl-native").required, true, "the native attribute carries the meaning");
  assertEqual(spokenMark.getAttribute("aria-label"), "required", "FormField's own default is untouched");
});

test("labels: Combobox emptyLabel replaces \"No results\"", async () => {
  const container = mountPoint();
  render(() => h(Combobox, { id: "lbl-combo", label: "Flor", options: OPTIONS, emptyLabel: "Nada encontrado", searchPlaceholder: "Buscar" }), container);
  await flush();

  container.querySelector("#lbl-combo").click();
  await flush();
  const search = container.querySelector(".m-combobox-search");
  search.value = "zzz";
  search.dispatchEvent(new Event("input", { bubbles: true }));
  await flush();

  assertEqual(container.querySelector(".m-combobox-empty").textContent, "Nada encontrado");
});

test("labels: DatePicker takes every calendar text as a prop; without them it is unchanged", async () => {
  const open = async (props) => {
    const container = mountPoint();
    render(() => h(DatePicker, { id: "lbl-date", label: "Data", value: "2026-09-20", ...props }), container);
    await flush();
    container.querySelector("#lbl-date").click();
    await flush();
    return container;
  };

  const english = await open({});
  assertEqual(english.querySelector("#lbl-date").textContent, "2026-09-20");
  assertEqual(english.querySelector(".m-datepicker-month").textContent, "September 2026");
  assertEqual(english.querySelector(".m-datepicker-weekdays").textContent, "SuMoTuWeThFrSa");
  assertEqual(english.querySelector('[aria-current="date"]').getAttribute("aria-label"), new Date(2026, 8, 20).toDateString());

  const portuguese = await open({
    previousMonthLabel: "Mês anterior",
    nextMonthLabel: "Próximo mês",
    monthNames: MONTHS,
    // Repeated letters on purpose: the header must not key its cells by text.
    weekdayNames: ["D", "S", "T", "Q", "Q", "S", "S"],
    formatValue: (date) => date.toLocaleDateString("pt-BR"),
    formatDayLabel: (date) => `dia ${date.getDate()} de ${MONTHS[date.getMonth()]}`,
  });
  assertEqual(portuguese.querySelector("#lbl-date").textContent, "20/09/2026");
  assertEqual(portuguese.querySelector(".m-datepicker-month").textContent, "setembro 2026");
  assertEqual(portuguese.querySelector(".m-datepicker-weekdays").children.length, 7, "all seven cells render despite repeated names");
  assertEqual(portuguese.querySelector(".m-datepicker-weekdays").textContent, "DSTQQSS");
  assertEqual(portuguese.querySelector('[aria-current="date"]').getAttribute("aria-label"), "dia 20 de setembro");

  const labels = spoken(portuguese);
  assert(labels.includes("Mês anterior") && labels.includes("Próximo mês"), JSON.stringify(labels));
  assert(!labels.includes("Previous month") && !labels.includes("Next month"));
});
