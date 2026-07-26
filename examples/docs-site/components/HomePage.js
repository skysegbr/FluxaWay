import { h, useHead } from "/dist/nexa.js";
import { Card } from "/dist/nexa-components-core.js";
import { CodeBlock } from "./reference/CodeBlock.js";
import { ADDON_LINKS, HOME_CARDS, QUICK_START } from "../data.js";

export function HomePage() {
  useHead({
    title: "Nexa Docs — components that run straight in the browser",
    meta: [
      {
        name: "description",
        content: "Documentation for Nexa: a no-build, ESM-native JavaScript UI framework.",
      },
    ],
  });

  return h(
    "div",
    { className: "nd-home" },
    h(
      "section",
      { className: "nd-hero" },
      h("p", { className: "nd-hero-kicker" }, "No build · No npm · No bundler"),
      h("h1", { className: "nd-hero-title" }, "The design system that runs from a ", h("code", null, "<script type=\"module\">")),
      h(
        "p",
        { className: "nd-hero-lead" },
        "Around 60 components, a hooks API and four add-ons — served as plain ES modules. ",
        "Save the file, hit refresh. That is the whole toolchain.",
      ),
      h(
        "div",
        { className: "nd-hero-actions" },
        h("a", { className: "m-button m-button-contained", href: "#/getting-started" }, "Get started"),
        h("a", { className: "m-button m-button-outline", href: "#/components/button" }, "Browse components"),
      ),
    ),

    h(CodeBlock, { code: QUICK_START, lang: "html", label: "index.html" }),

    h(
      "section",
      { className: "nd-home-grid" },
      HOME_CARDS.map((card) =>
        h(
          Card,
          { key: card.title, padded: true, className: "nd-home-card" },
          h("i", { className: `bi ${card.icon} nd-home-icon`, ariaHidden: "true" }),
          h("h2", { className: "nd-home-card-title" }, card.title),
          h("p", { className: "nd-home-card-body" }, card.body),
        ),
      ),
    ),
    h(
      "section",
      { className: "nd-home-addons", ariaLabelledby: "addons-title" },
      h("p", { className: "nd-hero-kicker" }, "First-party add-ons"),
      h("h2", { id: "addons-title", className: "nd-home-addons-title" }, "Go beyond app UI"),
      h(
        "p",
        { className: "nd-home-card-body" },
        "Presentations, timeline animation, node pipelines and full code editing use dedicated Nexa modules.",
      ),
      h(
        "div",
        { className: "nd-home-addon-links" },
        ADDON_LINKS.map((addon) =>
          h(
            "a",
            { key: addon.href, className: "m-button m-button-outline", href: addon.href },
            addon.label,
          ),
        ),
      ),
    ),
  );
}

export default HomePage;
