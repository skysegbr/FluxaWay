# FluxaWay UI

FluxaWay UI is a small CSS framework designed to pair with FluxaWay. It borrows ideas
from Material Design: theme tokens, surfaces, subtle elevation, buttons, fields,
chips, lists, and visual states.

The browsable reference, with live examples and class tables, is available in the
[docs site](https://fluxaway.com/#/css/installation). This file remains the compact
single-page guide.

It does not require Node or a build step. Just import the CSS in your HTML.

```html
<link rel="stylesheet" href="./fluxaway-ui.css" />
```

Or load the public build from jsDelivr:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-ui.css"
/>
```

For component helpers, import the optional JavaScript module:

```js
import {
  // Basic
  Alert, Badge, Button, Card, Checkbox, Chip, FAB, IconButton,
  // Form
  CodeEditor, Combobox, FileDropZone, FormField, Select, Switch,
  Textarea, TextField,
  // Layout
  Collapse, EmptyState, Table,
  // Navigation
  AppBar, BottomNav, BottomSheet, Navbar, Pagination,
  Stepper, TabPanel, Tabs,
  // Feedback
  Progress, Spinner, Toast, ToastStack,
  // Overlay
  ContextMenu, Dialog, Drawer, Dropdown, Tooltip,
  // Mobile
  SwipeableListItem, ThemeToggle,
} from "./fluxaway-components.js";
```

CDN import:

```js
import {
  Button,
  Card,
  TextField,
} from "https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-components.js";
```

## Tokens

The theme lives in CSS variables:

```css
:root {
  --m-primary: #0f766e;
  --m-secondary: #3f4f9f;
  --m-danger: #b42318;
  --m-bg: #f4f6f8;
  --m-surface: #ffffff;
  --m-text: #18212b;
  --m-radius: 8px;
}
```

You can override them in your app:

```css
:root {
  --m-primary: #3157d5;
  --m-focus: #b9c8ff;
}
```

### Chart tokens

The charts add-on ships its own palette in `dist/fluxaway-charts.css`, kept out
of `fluxaway-ui.css` so a page that draws no charts pays nothing for them:

```css
--m-chart-1 … --m-chart-8   /* categorical: WHICH series (fixed order) */
--m-chart-other             /* the folded tail — never a 9th hue */
--m-chart-muted             /* de-emphasised series */
--m-seq-1 … --m-seq-7       /* sequential: HOW MUCH (one hue) */
```

These are not free to edit. The categorical **order** is what keeps adjacent
series distinguishable under simulated colourblindness, and the sequential ramp
has to stay monotone in lightness. Both are re-checked by:

```bash
python3 scripts/validate_chart_palette.py               # categorical
python3 scripts/validate_chart_palette.py --sequential  # magnitude ramp
```

If you re-skin the palette for your brand, change the hexes and run that — it
reads the tokens straight out of the stylesheet, so it tells you whether your
values still hold the guarantees the comments claim.

## Main Classes

Layout:

```html
<section class="m-app">
  <main class="m-page m-stack"></main>
</section>
```

Application shell:

```js
h(
  "div",
  { className: "m-app-shell" },
  h("aside", { className: "m-sidebar" }, "Navigation"),
  h(
    "div",
    null,
    h("header", { className: "m-topbar" }, "Topbar"),
    h("main", { className: "m-content" }, h("div", { className: "m-container" })),
  ),
)
```

Typography:

```js
h("p", { className: "m-eyebrow" }, "FluxaWay UI")
h("h1", { className: "m-title-xl" }, "Todo list")
h("p", { className: "m-body" }, "Supporting text")
```

Card:

```js
h(
  "article",
  { className: "m-card m-card-padded" },
  h("h2", null, "Summary"),
  h("p", { className: "m-body" }, "Card content"),
)
```

Field:

```js
h("input", {
  className: "m-field",
  value: title,
  onInput: (event) => setTitle(event.target.value),
  placeholder: "New task",
})
```

Buttons:

```js
h("button", { className: "m-button" }, "Text")
h("button", { className: "m-button m-button-contained" }, "Save")
h("button", { className: "m-button m-button-tonal" }, "Filter")
h("button", { className: "m-button m-button-outline" }, "Clear")
h("button", { className: "m-button m-button-danger" }, "Remove")
```

Or with component helpers:

```js
h(Button, { variant: "contained", onClick: save }, "Save")
h(Button, {
  variant: "outline",
  icon: "close",
  accent: true,
  disabled: !filtersActive,
  onClick: clearFilters,
}, "Clear filters")
h(Button, { variant: "outline", icon: "close", ariaLabel: "Close" })
h(IconButton, { label: "Previous" }, "<")
```

`outline` is the canonical variant name (`outlined` is retained as a legacy
alias). `icon` adds a leading icon and accepts the built-in name `"close"` or
any FluxaWay VNode/text icon. When the button has no visible text, `ariaLabel` or
`ariaLabelledby` is required. `accent: true` adds a theme-colored leading
border and emphasizes the icon using `--m-primary`; it is most useful with
`variant: "outline"`.

Fields:

```js
h(TextField, {
  id: "email",
  label: "Email",
  value: email,
  onInput: (event) => setEmail(event.target.value),
  error: emailError,
})

h(Select, {
  id: "status",
  label: "Status",
  value: status,
  onChange: (event) => setStatus(event.target.value),
  options: [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
  ],
})
```

Feedback:

```js
h(Alert, { variant: "success", title: "Saved" }, "Your changes are ready.")
h(Badge, null, "4")
h(Spinner, { label: "Loading products" })
h(Toast, { open: saved, variant: "success", title: "Saved", onClose: closeToast })
h(Progress, { value: 60, max: 100, label: "Completion" })
```

Tabs:

```js
h(Tabs, {
  value: tab,
  onChange: setTab,
  items: [
    { value: "overview", label: "Overview" },
    { value: "settings", label: "Settings" },
  ],
})
```

Dialog:

```js
h(
  Dialog,
  {
    open,
    title: "Edit project",
    onClose: closeDialog,
    actions: h(Button, { variant: "contained", onClick: save }, "Save"),
  },
  h(TextField, { id: "name", label: "Name", value: name }),
)
```

Table:

```js
h(Table, {
  columns: [
    { key: "name", header: "Name" },
    { key: "status", header: "Status" },
  ],
  rows: projects,
})

h(EmptyState, {
  title: "No projects",
  description: "Create a project to fill this table.",
})
```

Drawer:

```js
h(
  Drawer,
  {
    open,
    side: "right",
    width: 400,
    title: "Edit task",
    onClose: closeDrawer,
  },
  h(TextField, { id: "task-title", label: "Title", value: title }),
)
```

Dropdown:

```js
h(Dropdown, {
  align: "right",
  trigger: h("button", { type: "button", className: "m-button m-button-tonal" }, "Actions"),
  items: [
    { key: "edit", label: "Edit", onClick: edit },
    { key: "delete", label: "Delete", danger: true, onClick: remove },
  ],
})
```

Tooltip and pagination:

```js
h(Tooltip, { content: "More details" }, h("span", null, "Info"))
h(Pagination, { page, total: 8, siblings: 1, onChange: setPage })
```

Chips:

```js
h("button", { className: "m-chip" }, "All")
h("button", { className: "m-chip m-chip-active" }, "Pending")
```

List:

```js
h(
  "ul",
  { className: "m-list" },
  todos.map((todo) =>
    h(
      "li",
      { className: "m-list-item" },
      h("span", null, todo.title),
      h("button", { className: "m-button" }, "Open"),
    ),
  ),
)
```

Checkbox:

```js
h(
  "label",
  { className: "m-checkbox" },
  h("input", { type: "checkbox", checked: todo.completed }),
  h("span", null, todo.title),
)
```

Inline forms:

```js
h(
  "form",
  { className: "m-form-row" },
  h("input", { className: "m-field", placeholder: "New card" }),
  h("button", { className: "m-button m-button-contained" }, "Add"),
)
```

Actions and icon buttons:

```js
h(
  "div",
  { className: "m-actions" },
  h("button", { className: "m-button m-button-tonal m-icon-button" }, "<"),
  h("button", { className: "m-button m-button-tonal m-icon-button" }, ">"),
)
```

Responsive grid:

```js
h(
  "section",
  { className: "m-responsive-grid" },
  h("article", { className: "m-card m-card-padded" }, "Column 1"),
  h("article", { className: "m-card m-card-padded" }, "Column 2"),
  h("article", { className: "m-card m-card-padded" }, "Column 3"),
)
```

Board/Kanban:

```js
h(
  "article",
  { className: "m-card m-board-column m-dropzone" },
  h(
    "header",
    { className: "m-board-column-header" },
    h("div", null, h("h2", null, "Doing"), h("p", null, "In progress")),
    h("span", { className: "m-chip" }, "2"),
  ),
  h(
    "ul",
    { className: "m-list" },
    h(
      "li",
      { className: "m-list-item m-board-card m-draggable" },
      h("p", null, "Create drag and drop"),
    ),
  ),
)
```

Drag and drop states:

```js
h("li", { className: "m-list-item m-board-card m-draggable m-dragging" })
h("article", { className: "m-card m-board-column m-dropzone m-dropzone-active" })
```

## Typical Project Setup

```html
<link rel="stylesheet" href="/dist/fluxaway-ui.css" />
<link rel="stylesheet" href="./styles.css" />
```

`fluxaway-ui.css` contains the reusable framework tokens and component styles.
`styles.css` contains only the page-specific layout and custom tokens (e.g. `--l-accent`).
