import { h, useHead } from "/dist/fluxaway.js";
import { Card } from "/dist/fluxaway-components-core.js";
import { CodeBlock } from "./reference/CodeBlock.js";
import { ADDON_LINKS, HOME_CARDS, QUICK_START } from "../data.js";

export function HomePage() {
  useHead({
    title: "FluxaWay Docs — code flows directly to the browser",
    meta: [
      {
        name: "description",
        content: "FluxaWay is the no-build, ESM-native JavaScript UI framework.",
      },
    ],
  });

  return h(
    "div",
    { className: "nd-home" },
    h(
      "section",
      { className: "nd-hero" },
      h("p", { className: "nd-hero-kicker" }, "The secure, AI-ready, no-build UI framework"),
      h("h1", { className: "nd-hero-title" }, "Code flows. Your way."),
      h(
        "p",
        { className: "nd-hero-lead" },
        "FluxaWay is the direct path from idea to interface. Plain JavaScript flows directly into the browser, ",
        "zero runtime dependencies keep the supply chain small, and AI_SPEC guides reliable AI-assisted development.",
      ),
      h(
        "div",
        { className: "nd-hero-actions" },
        h("a", { className: "m-button m-button-contained", href: "#/getting-started" }, "Get started"),
        h("a", { className: "m-button m-button-outline", href: "#/ai-security" }, "Build with AI"),
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
        "Presentations, timeline animation, node pipelines and full code editing use dedicated FluxaWay modules.",
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
