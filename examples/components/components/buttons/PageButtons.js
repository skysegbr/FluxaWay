import { h } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

const icon = (name) => h("i", { className: `bi ${name}` });

const BUTTON_EFFECTS = [
  {
    id: "reflection",
    name: "Reflection",
    label: "Reflect",
    description: "O reflexo atravessa a superfície e refaz o caminho ao retirar o cursor.",
  },
  {
    id: "edge",
    name: "Edge runner",
    label: "Route",
    description: "A corrente percorre somente o contorno, sem preencher o botão.",
  },
  {
    id: "split",
    name: "Split current",
    label: "Merge",
    description: "Dois metais entram por lados opostos e se encontram no centro.",
  },
  {
    id: "aperture",
    name: "Aperture",
    label: "Open",
    description: "O material ativo se abre radialmente a partir do centro.",
  },
  {
    id: "charge",
    name: "Surface charge",
    label: "Charge",
    description: "Uma linha de energia sobe até carregar toda a superfície.",
  },
  {
    id: "corners",
    name: "Corner trace",
    label: "Lock",
    description: "Cantos opostos se estendem e formam um quadro de precisão.",
  },
  {
    id: "pulse",
    name: "Signal echo",
    label: "Confirm",
    description: "Um pulso de confirmação se expande além do contorno.",
  },
  {
    id: "phase",
    name: "Phase shift",
    label: "Shift",
    description: "A superfície transita entre os dois metais em uma fase diagonal.",
  },
  {
    id: "circuit",
    name: "Alloy circuit",
    label: "Conduct",
    description: "O reflexo metálico percorre o circuito do contorno.",
  },
];

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
        title: "Assinaturas de interação",
        description: "Os nove efeitos desenvolvidos para o Metallic. Passe o mouse, use Tab ou toque para experimentar.",
        layout: "effects",
        featured: true,
      },
      BUTTON_EFFECTS.map((effect, index) =>
        h(
          "article",
          { key: effect.id, className: "button-effect-card" },
          h(
            "div",
            { className: "button-effect-preview" },
            h(
              Button,
              {
                variant: "outline",
                className: `button-effect-button button-effect-${effect.id}`,
              },
              h("span", { className: "button-effect-label" }, effect.label),
            ),
          ),
          h("span", { className: "button-effect-index" }, String(index + 1).padStart(2, "0")),
          h("h4", null, effect.name),
          h("p", null, effect.description),
        ),
      ),
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

function CatalogSection({ title, description, featured = false, layout = "row", children }) {
  return h(
    "section",
    { className: `button-catalog-section${featured ? " is-featured" : ""}` },
    h("div", { className: "button-catalog-copy" },
      h("h3", null, title),
      h("p", null, description),
    ),
    h("div", { className: layout === "effects" ? "button-effect-grid" : "button-catalog-row" }, children),
  );
}
