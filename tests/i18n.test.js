// createI18n, the I18n context, useI18n, useLocale, matchLocale — and the
// components reading their own texts from the locale their tree was given.

import {
  h, render, memo, renderToString, createI18n, I18n, useI18n, useLocale, matchLocale, FX_MESSAGES,
} from "../dist/fluxaway.js";
import { Dialog } from "../dist/fluxaway-components-overlay.js";
import { Pagination } from "../dist/fluxaway-components-data.js";
import { DatePicker } from "../dist/fluxaway-components-forms.js";
import ptBR from "../dist/locales/pt-BR.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

const APP_PT = {
  files: { one: "{count} arquivo", other: "{count} arquivos" },
  greet: "Olá, {name}!",
  onlyPt: "só em português",
};
const APP_EN = { files: { zero: "no files", one: "{count} file", other: "{count} files" }, greet: "Hi, {name}!", onlyEn: "English only" };

const store = (locale = "pt-BR") => createI18n({ locale, messages: { "pt-BR": [ptBR, APP_PT], en: APP_EN } });

test("i18n: the locale, then its language, then the fallback, then FluxaWay's English, then the key", () => {
  const i18n = createI18n({
    locale: "pt-BR",
    messages: { pt: { lang: "do pt" }, "pt-BR": { exact: "do pt-BR" }, en: { fallback: "from en" } },
  });
  assertEqual(i18n.t("exact"), "do pt-BR");
  assertEqual(i18n.t("lang"), "do pt");
  assertEqual(i18n.t("fallback"), "from en");
  assertEqual(i18n.t("fx.close"), "Close", "FX_MESSAGES is the last dictionary");
  assertEqual(i18n.t("nope"), "nope");
  assert(i18n.has("lang") && !i18n.has("nope"));
});

test("i18n: locales are canonical, and a later dictionary wins over an earlier one", () => {
  const i18n = createI18n({ locale: "pt-br", messages: { "PT-br": [{ a: "1", b: "1" }, { b: "2" }] } });
  assertEqual(i18n.locale, "pt-BR");
  assertEqual(i18n.t("a") + i18n.t("b"), "12");
  i18n.addMessages("pt-BR", { a: "3" });
  assertEqual(i18n.t("a"), "3");
  let threw = false;
  try { i18n.addMessages("not a tag!", {}); } catch (err) { threw = err instanceof RangeError; }
  assert(threw, "a bad locale is an error, not a silent no-op");
  i18n.setLocale("??");
  assertEqual(i18n.locale, "pt-BR", "setLocale ignores what isn't a language tag");
});

test("i18n: plurals follow Intl.PluralRules, an optional zero wins for 0", () => {
  const pt = store("pt-BR");
  assertEqual(pt.t("files", { count: 1 }), "1 arquivo");
  assertEqual(pt.t("files", { count: 5 }), "5 arquivos");
  assertEqual(pt.t("files", { count: 0 }), "0 arquivo", "Portuguese CLDR: 0 takes the 'one' form…");
  pt.addMessages("pt-BR", { files: { zero: "nenhum arquivo", one: "{count} arquivo", other: "{count} arquivos" } });
  assertEqual(pt.t("files", { count: 0 }), "nenhum arquivo", "…which is what `zero` is for");
  const en = store("en");
  assertEqual(en.t("files", { count: 0 }), "no files");
  assertEqual(en.t("files", { count: 1 }), "1 file");
  assertEqual(en.t("files", { count: 2 }), "2 files");
  assertEqual(en.t("files"), "{count} files", "no count: the 'other' form, placeholder left as written");
});

test("i18n: values go in literally and once", () => {
  const i18n = store();
  assertEqual(i18n.t("greet", { name: "{name} $& $1" }), "Olá, {name} $& $1!");
  assertEqual(i18n.t("greet", {}), "Olá, {name}!");
  assertEqual(i18n.t("greet", { name: 0 }), "Olá, 0!");
});

test("i18n: numbers, dates and lists format in the locale", () => {
  const pt = store("pt-BR");
  assertEqual(pt.formatNumber(1234.5), "1.234,5");
  assertEqual(pt.formatDate(new Date(2026, 9, 17), { dateStyle: "short" }), "17/10/2026");
  assertEqual(pt.formatList(["a", "b", "c"]), "a, b e c");
  const en = store("en-US");
  assertEqual(en.formatNumber(1234.5), "1,234.5");
  assertEqual(en.formatList(["a", "b", "c"]), "a, b, and c");
});

test("i18n: matchLocale picks exactly, then by language, then the fallback", () => {
  assertEqual(matchLocale(["pt-BR", "en"], ["pt-BR", "en"]), "pt-BR");
  assertEqual(matchLocale(["pt-BR", "en"], ["pt-PT"]), "pt-BR");
  assertEqual(matchLocale(["pt-BR", "en"], ["fr-FR", "en-GB"]), "en");
  assertEqual(matchLocale(["pt-BR", "en"], ["fr"]), "pt-BR", "the first available");
  assertEqual(matchLocale(["pt-BR", "en"], ["fr"], "en"), "en");
  assertEqual(matchLocale(["pt-BR", "en"], ["???", "en-US"]), "en", "a bad tag is skipped");
  assert(["pt-BR", "en"].includes(matchLocale(["pt-BR", "en"])), "defaults to the browser's languages");
});

test("i18n: the pt-BR pack translates every key FluxaWay writes, and nothing else", () => {
  assertEqual(Object.keys(ptBR).sort().join(" "), Object.keys(FX_MESSAGES).sort().join(" "));
  for (const [key, english] of Object.entries(FX_MESSAGES)) {
    assertEqual(typeof ptBR[key], typeof english, `${key}: same shape as the English`);
  }
});

test("i18n: without a provider, useI18n is FluxaWay's English", async () => {
  let seen;
  render(() => {
    seen = useI18n();
    return h("p", null, seen.t("fx.close"));
  }, mountPoint());
  await flush();
  assertEqual(seen.locale, "en");
  assertEqual(seen.t("fx.pagination.next"), "Next page");
});

test("i18n: setLocale re-renders the provided tree, memo() children included", async () => {
  const i18n = store("pt-BR");
  let memoRenders = 0;
  const Count = memo(() => {
    memoRenders += 1;
    return h("span", { className: "count" }, useI18n().t("files", { count: 2 }));
  });
  function App() {
    const translator = useLocale(i18n);
    return I18n.provide(translator, () => h("div", null, h(Count, null), h(Pagination, { page: 1, total: 3 })));
  }
  const container = mountPoint();
  render(App, container);
  await flush();
  assertEqual(container.querySelector(".count").textContent, "2 arquivos");
  assertEqual(container.querySelector("nav").getAttribute("aria-label"), "Paginação");

  i18n.setLocale("en");
  await flush();
  assertEqual(container.querySelector(".count").textContent, "2 files");
  assertEqual(container.querySelector("nav").getAttribute("aria-label"), "Pagination");
  assertEqual(memoRenders, 2, "the memo child saw the new translator");

  i18n.addMessages("en", { files: { one: "{count} doc", other: "{count} docs" } });
  await flush();
  assertEqual(container.querySelector(".count").textContent, "2 docs", "new messages re-render too");
});

test("i18n: two languages on one page, each subtree with its own", async () => {
  const pt = store("pt-BR").translator;
  const en = store("en").translator;
  const container = mountPoint();
  render(() => h("div", null,
    I18n.provide(pt, () => h(Pagination, { page: 1, total: 3, key: "pt" })),
    I18n.provide(en, () => h(Pagination, { page: 1, total: 3, key: "en" })),
  ), container);
  await flush();
  const labels = [...container.querySelectorAll("nav")].map((nav) => nav.getAttribute("aria-label"));
  assertEqual(labels.join(" | "), "Paginação | Pagination");
});

test("i18n: a prop still wins over the locale", async () => {
  const container = mountPoint();
  render(() => I18n.provide(store().translator, () => h(Pagination, { page: 1, total: 3, ariaLabel: "Páginas" })), container);
  await flush();
  assertEqual(container.querySelector("nav").getAttribute("aria-label"), "Páginas");
});

test("i18n: Dialog's close button speaks the locale", async () => {
  const container = mountPoint();
  render(() => I18n.provide(store().translator, () => h(Dialog, { open: true, title: "Título", onClose: () => {} }, "corpo")), container);
  await flush();
  const labels = [...document.querySelectorAll("[aria-label]")].map((node) => node.getAttribute("aria-label"));
  assert(labels.includes("Fechar"), JSON.stringify(labels));
});

test("i18n: DatePicker's calendar comes from Intl in another language, unchanged in English", async () => {
  const open = async (translator) => {
    const container = mountPoint();
    render(() => I18n.provide(translator, () =>
      h(DatePicker, { id: `i18n-date-${translator.locale}`, label: "Data", value: "2026-09-20" })), container);
    await flush();
    container.querySelector(`#i18n-date-${translator.locale}`).click();
    await flush();
    return container;
  };
  const pt = await open(store("pt-BR").translator);
  assertEqual(pt.querySelector(".m-datepicker-month").textContent, "setembro 2026");
  assertEqual(pt.querySelector(".m-datepicker-weekdays").textContent, "DomSegTerQuaQuiSexSáb");
  assertEqual(pt.querySelector(`#i18n-date-pt-BR`).textContent, "20/09/2026");
  assertEqual(pt.querySelector('[aria-current="date"]').getAttribute("aria-label"), "domingo, 20 de setembro de 2026");

  const en = await open(store("en").translator);
  assertEqual(en.querySelector(".m-datepicker-month").textContent, "September 2026");
  assertEqual(en.querySelector(".m-datepicker-weekdays").textContent, "SuMoTuWeThFrSa");
  assertEqual(en.querySelector(`#i18n-date-en`).textContent, "2026-09-20");
});

test("i18n: renderToString renders in the provided locale", () => {
  const translator = store().translator;
  const html = renderToString(() => I18n.provide(translator, () => h(Pagination, { page: 2, total: 5 })));
  assert(html.includes('aria-label="Paginação"') && html.includes("Próxima página"), html);
  assert(!renderToString(() => h(Pagination, { page: 2, total: 5 })).includes("Paginação"), "nothing leaks out of provide");
});
