import { h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

const icon = (name) => h("i", { className: `bi ${name}` });

export function PageButtons() {
  return h(
    "div",
    { className: "m-stack button-catalog" },
    h(
      "header",
      { className: "button-catalog-header" },
      h("h2", { className: "m-title", style: { fontSize: "1.5rem" } }, "Buttons"),
      h(
        "p",
        { className: "m-body m-text-sm m-text-muted" },
        "Variantes, ícones e estados do Button usando apenas tokens do tema.",
      ),
    ),

    h(
      CatalogSection,
      {
        title: "Variantes",
        description: "A mesma ação nas cinco hierarquias visuais oficiais.",
      },
      h(Button, { variant: "text" }, "Text"),
      h(Button, { variant: "contained" }, "Contained"),
      h(Button, { variant: "tonal" }, "Tonal"),
      h(Button, { variant: "outline" }, "Outline"),
      h(Button, { variant: "danger" }, "Danger"),
    ),

    h(
      CatalogSection,
      {
        title: "Outline com destaque lateral",
        description: "accent: true usa --m-primary; altere a paleta no cabeçalho para comparar.",
        featured: true,
      },
      h(
        Button,
        {
          variant: "outline",
          accent: true,
          icon: icon("bi-kanban"),
        },
        "Kanban",
      ),
      h(
        Button,
        {
          variant: "outline",
          accent: true,
          icon: icon("bi-funnel"),
        },
        "Filtros",
      ),
      h(
        Button,
        {
          variant: "outline",
          accent: true,
          icon: "close",
        },
        "Limpar",
      ),
    ),

    h(
      CatalogSection,
      {
        title: "Conteúdo",
        description: "Texto, ícone à esquerda e botão somente com ícone.",
      },
      h(Button, { variant: "outline" }, "Somente texto"),
      h(Button, { variant: "outline", icon: icon("bi-download") }, "Exportar"),
      h(Button, { variant: "outline", icon: "close", ariaLabel: "Fechar" }),
    ),

    h(
      CatalogSection,
      {
        title: "Estados",
        description: "Passe o mouse ou navegue com Tab para conferir hover e foco.",
      },
      h(Button, { variant: "outline", icon: "close" }, "Normal"),
      h(Button, { variant: "outline", icon: "close", disabled: true }, "Disabled"),
      h(
        Button,
        {
          variant: "outline",
          accent: true,
          icon: icon("bi-kanban"),
          disabled: true,
        },
        "Accent disabled",
      ),
    ),
  );
}

function CatalogSection({ title, description, featured = false, children }) {
  return h(
    "section",
    { className: `button-catalog-section${featured ? " is-featured" : ""}` },
    h("div", { className: "button-catalog-copy" },
      h("h3", null, title),
      h("p", null, description),
    ),
    h("div", { className: "button-catalog-row" }, children),
  );
}
