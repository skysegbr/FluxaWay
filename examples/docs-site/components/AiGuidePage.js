import { h, useHead } from "/dist/fluxaway.js";
import { Alert, Card } from "/dist/fluxaway-components-core.js";
import { CodeBlock } from "./reference/CodeBlock.js";
import { PageToc } from "./reference/PageToc.js";
import {
  AI_CHECKLIST,
  AI_PROMPT_EXAMPLE,
  AI_PROMPT_TEMPLATE,
  AI_WORKFLOW,
  SECURITY_PILLARS,
} from "../content/aiGuide.js";

const TOC = [
  { id: "security-by-design", title: "Security by design" },
  { id: "ai-spec", title: "What AI_SPEC does" },
  { id: "prompt-anatomy", title: "Build a reliable prompt" },
  { id: "prompt-template", title: "Reusable prompt template" },
  { id: "prompt-example", title: "Complete example" },
  { id: "review-checklist", title: "Review checklist" },
];

export function AiGuidePage() {
  useHead({
    title: "AI & security — FluxaWay Docs",
    meta: [
      {
        name: "description",
        content:
          "Use FluxaWay's AI_SPEC to generate reviewable, secure-by-design browser applications.",
      },
    ],
  });

  return h(
    "div",
    { className: "nd-page nd-ai-page" },
    h(
      "article",
      { className: "nd-article" },
      h("p", { className: "nd-ai-kicker" }, "Human-readable constraints for AI-generated code"),
      h("h1", { className: "nd-article-title" }, "AI & security"),
      h(
        "p",
        { className: "nd-article-lead" },
        "FluxaWay was designed with a small supply-chain surface and reliable AI-assisted development in mind. AI_SPEC turns the framework's architecture, safety rules and validation workflow into explicit instructions an assistant can follow.",
      ),
      h(PageToc, { variant: "mobile", items: TOC }),

      h(
        Alert,
        { variant: "info", className: "nd-ai-intro-alert" },
        "Security is a process, not a guarantee. FluxaWay removes major sources of accidental complexity, while application code, APIs, deployment and data handling still require review.",
      ),

      h(
        "section",
        { id: "security-by-design", className: "nd-ai-section" },
        h("h2", null, "Security by design"),
        h(
          "p",
          null,
          "The architecture keeps important trust decisions visible. Its main security advantage is reduction: fewer dependencies, fewer generated layers and less hidden code to audit.",
        ),
        h(
          "div",
          { className: "nd-ai-security-grid" },
          SECURITY_PILLARS.map((pillar) =>
            h(
              Card,
              { key: pillar.title, padded: true, className: "nd-ai-card" },
              h("i", { className: `bi ${pillar.icon} nd-ai-card-icon`, ariaHidden: "true" }),
              h("h3", null, pillar.title),
              h("p", null, pillar.body),
            ),
          ),
        ),
      ),

      h(
        "section",
        { id: "ai-spec", className: "nd-ai-section" },
        h("h2", null, "What AI_SPEC does"),
        h(
          "p",
          null,
          h("code", null, "docs/AI_SPEC.md"),
          " is the comprehensive reference for an AI assistant generating FluxaWay code. It explains the eager component model, module selection, critical mistakes, approved project structure, security utilities, add-ons and browser-first validation workflow.",
        ),
        h(
          "p",
          null,
          "Give the entire file to the assistant before coding. A fragment can omit a rule that changes the architecture, such as passing a component function directly to ",
          h("code", null, "render()"),
          " or avoiding Node-based tooling.",
        ),
        h(
          "div",
          { className: "nd-ai-actions" },
          h(
            "a",
            {
              className: "m-button m-button-contained",
              href: "/docs/AI_SPEC.md",
              target: "_blank",
              rel: "noopener",
            },
            h("i", { className: "bi bi-file-earmark-text", ariaHidden: "true" }),
            "Open AI_SPEC.md",
          ),
          h(
            "a",
            {
              className: "m-button m-button-outline",
              href: "/docs/AI_QA.md",
              target: "_blank",
              rel: "noopener",
            },
            "Open the AI QA runbook",
          ),
        ),
      ),

      h(
        "section",
        { id: "prompt-anatomy", className: "nd-ai-section" },
        h("h2", null, "Build a reliable prompt"),
        h(
          "p",
          null,
          "A useful prompt does more than ask for a screen. It connects the desired outcome to FluxaWay's source of truth, identifies trust boundaries and says how the result will be proven.",
        ),
        h(
          "ol",
          { className: "nd-ai-workflow" },
          AI_WORKFLOW.map((step) =>
            h(
              "li",
              { key: step.title },
              h("h3", null, step.title),
              h("p", null, step.body),
            ),
          ),
        ),
      ),

      h(
        "section",
        { id: "prompt-template", className: "nd-ai-section" },
        h("h2", null, "Reusable prompt template"),
        h(
          "p",
          null,
          "Replace the bracketed lines and name every untrusted input. Keep the AI_SPEC instruction at the top so framework constraints are considered before implementation choices.",
        ),
        h(CodeBlock, { code: AI_PROMPT_TEMPLATE, lang: "text", label: "Prompt template" }),
      ),

      h(
        "section",
        { id: "prompt-example", className: "nd-ai-section" },
        h("h2", null, "Complete example"),
        h(
          "p",
          null,
          "This example gives the assistant enough context to select the charts add-on, structure the app, handle untrusted API values and validate the responsive result.",
        ),
        h(CodeBlock, { code: AI_PROMPT_EXAMPLE, lang: "text", label: "Support dashboard prompt" }),
      ),

      h(
        "section",
        { id: "review-checklist", className: "nd-ai-section" },
        h("h2", null, "Review checklist"),
        h(
          "ul",
          { className: "nd-ai-checklist" },
          AI_CHECKLIST.map((item) =>
            h(
              "li",
              { key: item },
              h("i", { className: "bi bi-check-circle-fill", ariaHidden: "true" }),
              h("span", null, item),
            ),
          ),
        ),
      ),
    ),
    h(PageToc, { variant: "desktop", items: TOC }),
  );
}

export default AiGuidePage;
