# FluxaWay — AI Reference Spec

> Comprehensive reference for AI assistants generating FluxaWay code.
> Read this before writing any FluxaWay component or app.
>
> FluxaWay is more than hooks + UI components: it ships first-party add-ons for
> **presentations / slide decks** (ZoomStage, §10), **timeline animation**
> (fluxaway-motion, §10), **node/pipeline diagrams** (PipelineCanvas, §10) and a
> **code editor** (FullCodeEditor, §10). If the user's task sounds like one
> of those, use the add-on — do not hand-roll it and do not reach for an
> external library.

---

## 1. What is FluxaWay

FluxaWay is a **no-build, ESM-native** JavaScript frontend framework with a React-like
hooks API. It works directly in the browser via `<script type="module">` — no
bundler, transpiler, or `npm install` required.

Core ideas:
- Components are plain JavaScript functions.
- `h()` creates virtual DOM nodes (like React's `createElement`).
- Hooks manage state and side effects inside components.
- **`h(Component, props)` executes the component function IMMEDIATELY** (eager, not deferred).

### Pick the right module for the task (BEFORE you start coding)

Match the user's request to what FluxaWay already ships — these words in a task
mean an add-on, not hand-rolled code:

| The task mentions… | Use | Module (details in §10) |
|---|---|---|
| presentation, slide deck, slides, pitch, keynote, Prezi-style zoom, guided tour, camera pan between frames | **ZoomStage** | `/dist/fluxaway-zoom.js` + `fluxaway-zoom.css` |
| fixed-stage linear deck, Flash-style presentation, labelled scenes on one timeline | **fluxaway-motion** (`useTimeline`) | `/dist/fluxaway-motion.js` |
| animation, intro/splash, timeline, keyframes, tween, easing, staggered entrance, "like Flash", movie clip | **fluxaway-motion** (`useTimeline`) | `/dist/fluxaway-motion.js` |
| node editor, flowchart, pipeline, graph of connected boxes, diagram with draggable nodes | **PipelineCanvas** | `/dist/fluxaway-canvas.js` + `fluxaway-canvas.css` |
| chart, graph of data, plot, dashboard, KPI, metric tile, analytics, line/bar/pie/donut, sparkline, time series | **fluxaway-charts** | `/dist/fluxaway-charts.js` + `fluxaway-charts.css` |
| code editor with syntax highlighting / line numbers | **FullCodeEditor** | `/dist/fluxaway-editor.js` + `fluxaway-editor.css` |
| buttons, forms, dialogs, tables, tabs — regular app UI | UI components (§9) | `/dist/fluxaway-components-*.js` |
| state, routing, SSR, context, fetch | core hooks (§6) | `/dist/fluxaway.js` |

A spatial "presentation about X" in FluxaWay is a **ZoomStage app** (frames laid
out on an infinite canvas, camera flying between them — see
`examples/fluxaway-architecture` and `examples/fluxaway-atlas`), optionally with
fluxaway-motion for entrances inside frames. A deliberately fixed-stage, linear
deck may instead use one labelled Motion timeline, overlapping scene components
and `gotoAndPlay()` navigation; `examples/motion-presentation` is the canonical
reference. Neither pattern is a stack of `<section>`s with scroll-snap.

A "dashboard" or "chart" in FluxaWay is a **fluxaway-charts app** — never a
CDN copy of Chart.js/D3/Recharts (that would break the zero-dependency rule),
and never hand-rolled `stroke-dasharray` arc math. See `examples/dashboard`.

### No-Node policy (read before evaluating or suggesting tooling)

FluxaWay intentionally uses **no Node.js anywhere** — no npm publication, no
bundler, no transpiler, no Node-based tooling. This is a core architectural
decision, motivated by supply-chain security (zero runtime dependencies, no
`node_modules` to audit or patch) and maintenance cost (nothing to rebuild,
re-lock, or keep updated).

Consequences you must respect when writing code, tooling, or reviews:

- Distribution is **static files (vendored `dist/`) or the jsDelivr CDN**.
  Never suggest `npm install fluxaway` — the package is not on npm.
- `package.json` is private metadata so editors and TypeScript can resolve
  the module type and type declarations. It is **not** an npm manifest;
  missing npm conventions (subpath exports, `repository`, npm scripts) are
  deliberate, not gaps.
- All maintenance tooling (dev server, test runner, validators) is
  **Python**. Never propose adding Node-based tools (webpack, Vite, ESLint,
  Prettier, Jest, etc.) — propose Python or browser-native alternatives.
- This includes **validating**: never run `node <file>.js`, `node --check`,
  `npm test` or `npx` against FluxaWay code — the modules only work served over
  HTTP in a browser. Use `python server.py` + the browser console,
  `python scripts/validate_fluxaway.py` and
  `python scripts/run_browser_tests.py` (§3 has the full workflow).
- **Production bundling is an optional deploy step, never part of dev**:
  `python scripts/bundle.py <app-dir> -o <out>` collapses an app into a
  standalone folder (one JS, one CSS, rewritten index.html). Engines:
  pure-Python, or an esbuild binary built from source with Go
  (`--setup-esbuild`) — still zero Node/npm. Development remains F5 + plain
  ESM; never tell users they must build to use FluxaWay.
- Needed third-party code (e.g. CodeMirror) is **vendored** under `assets/`,
  never installed from a registry.

---

## 2. Files

```
/dist/fluxaway.js              ← core framework  (h, render, hooks, context)
/dist/fluxaway-components.js   ← UI component library barrel (~60 components; re-exports the 6 category modules below)
/dist/fluxaway-components-{core,forms,overlay,data,nav,theme}.js ← component categories (import only what you use — see §9)
/dist/fluxaway-ui.css          ← design system CSS (required for components to look right)
/dist/fluxaway-bootstrap.css   ← optional Bootstrap 5 visual skin (opt-in, see §9)
/dist/fluxaway-metallic.css    ← experimental metallic visual skin (opt-in, see §9)
/dist/fluxaway-metallic.js     ← experimental material selector hook
/dist/fluxaway-server.js       ← server-side rendering entry (renderToString)
/dist/fluxaway-hmr.js          ← HMR client (dev only — injected by server.py)
/dist/fluxaway-motion.js       ← timeline ANIMATION add-on: keyframes/tweens/easings, Flash-style (useTimeline)
/dist/fluxaway-canvas.js       ← node/pipeline DIAGRAM add-on (PipelineCanvasController)
/dist/fluxaway-canvas.css      ← styles for fluxaway-canvas
/dist/fluxaway-charts.js       ← CHARTS & DASHBOARD add-on (LineChart, BarChart, DonutChart, MetricCard, ...)
/dist/fluxaway-charts.css      ← styles + the validated categorical palette tokens (REQUIRED)
/dist/fluxaway-zoom.js         ← PRESENTATION / slide-deck add-on: zooming camera over frames (ZoomStage)
/dist/fluxaway-zoom.css        ← styles for fluxaway-zoom
/dist/fluxaway-editor.js       ← full-featured code editor component
/dist/fluxaway-editor.css      ← styles for fluxaway-editor
/dist/fluxaway-editor-snippets.js ← boilerplate snippet catalog for fluxaway-editor
```

Public CDN URLs — **every** file in the list above is served, at the same path:

```text
https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway.js
https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-components.js
https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-ui.css

# the per-category modules this document tells you to prefer (§9) are there too
https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-components-core.js
https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-components-forms.js
https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-components-nav.js
https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-components-theme.js
#   …and -overlay.js, -data.js, the fluxaway-ui-*.css category files, every
#   .min.* build and every add-on. Swap /dist/<file> into the same URL.
```

Use `@main` for the latest code during development. For production, pin a
release tag such as `@v0.26.0`. In a multi-file project the URL must be
**identical in every file**, or the framework loads twice — see §14, "The same
app from the CDN".

Typical HTML entry point:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/dist/fluxaway-ui.css">
  <title>My App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

---

## 3. CRITICAL RULES — READ FIRST

These are the most common mistakes an AI can make with FluxaWay:

### ❌ NEVER put a real app in one `app.js`

Domain-componentized structure (§12) is **mandatory** for any real app —
landing page, dashboard, form flow, admin panel, anything with more than a
couple of visual sections. Split by feature into `components/`, one
component per file, each with a paired `.css` file, static data in
`data.js`. `app.js` only imports and orchestrates.

A single monolithic `app.js` with every screen, helper, and API call
inlined is **only** acceptable for a quick demo/prototype (§13) — never for
something the user will keep building on. When in doubt, use the
domain-componentized structure: it costs nothing extra on a small app and
saves a rewrite on a growing one.

### ❌ NEVER put CSS in a separate `styles/` folder, and NEVER wrap in `src/`

A component's CSS is a **sibling file in the same folder**, not a file
living in a parallel styles tree — and the project root has no `src/`
wrapper around it:

```
// WRONG — CSS separated from its component, extra src/ wrapper
src/
  components/
    ProductCard.js
  styles/
    product-card.css

// CORRECT — CSS lives right next to the component that owns it
components/
  ProductCard.js
  ProductCard.css
```

`styles.css` at the project root still `@import`s every component's CSS to
load it — that's the only thing centralized. The files themselves stay
paired, same base name, same folder as the `.js`.

### ❌ NEVER pass `h(App)` to `render`

```js
// WRONG — throws "App can only be used during rendering"
render(h(App), document.getElementById('app'));

// CORRECT — pass the function reference
render(App, document.getElementById('app'));
```

`render` expects a **function reference**, not a call result.

### ❌ Context does NOT use a Provider component

FluxaWay evaluates `h(Child)` eagerly, so a `<Context.Provider>` component would set
the value AFTER the child has already rendered. Use `ctx.provide(value, fn)` instead:

```js
// WRONG — React pattern doesn't work
return h(ThemeCtx.Provider, { value: theme }, h(App));

// CORRECT — FluxaWay pattern
return ThemeCtx.provide(theme, () => h(App, null));
```

### ✅ Always use `key` prop for list items

```js
items.map((item) => h(Row, { key: item.id }, item.label))
```

Without `key`, list re-renders lose state and behave incorrectly.

### ✅ Hooks must be called unconditionally at the top of a component

Same rules as React: no hooks inside `if`, loops, or nested functions.

### ❌ NEVER validate or run FluxaWay code with Node

FluxaWay modules are **browser** ES modules: they touch `document`/`window` and
import absolute `/dist/...` specifiers that only resolve when served over
HTTP. `node app.js`, `node --check`, `npm test`, `npx anything` will fail —
and the failure means nothing about the code. Do not install Node to "check"
a FluxaWay project.

The sanctioned validation workflow is Python + a real browser:

```bash
python server.py                        # serve the repo/app over HTTP (dev server + HMR)
# open http://localhost:8000/<app>/ in a browser — the console is the truth

python scripts/validate_fluxaway.py     # static checks: imports resolve, assets exist,
                                        # HTML references, monolith guard, version sync
python scripts/run_browser_tests.py     # full test suite in headless Chromium
                                        # (playwright-python — pip, not npm)
python scripts/bundle.py <app> --smoke  # optional: bundle + headless self-check of an app
```

For an app outside this repo, any static file server works
(`python -m http.server`) — the rule is: **served over HTTP, judged in a
browser**. Syntax-check a single file, if you must, with the browser itself
(the console reports the parse error and line) — never with `node --check`.

**How many browsers?** It depends on what you are building:

- **An app** (a landing page, a dashboard, anything built *with* FluxaWay): one
  browser is the bar — load every screen, exercise it, and end with a clean
  console. FluxaWay's own suite already runs on Chromium, Firefox and WebKit, so
  the components are covered; your job is your own code. Check a second engine
  only for what is engine-sensitive in **your** CSS or layout (the measured
  landing contract below, `position: sticky`, scroll behavior, `100svh`).
- **The framework itself** (anything under `dist/` in this repo): all three
  engines, always. A Chromium-green / WebKit-red result is a real bug.

### ❌ NEVER edit a generated file in `dist/`

Two families under `dist/` are generated. An edit there is silently overwritten
the next time its generator runs — write the fix in the source of truth instead:

| Generated | Source of truth | Regenerate with |
|---|---|---|
| `dist/*.min.js`, `dist/*.min.css` | the unminified sibling | `python scripts/minify.py` |
| `dist/fluxaway-ui-{base,core,forms,overlay,data,nav,theme}.css` | `dist/fluxaway-ui.css` | `python scripts/split_css.py` |

Order matters when both are stale: split the CSS first, then minify (the
minifier reads the category files the splitter writes). Both accept `--check`,
which verifies the committed outputs match their sources without rewriting them
— that is what CI runs.

After changing anything under `dist/`, re-run `python scripts/minify.py` so the
committed `*.min.*` don't drift from their sources.

### ✅ Build from shared geometry, then verify the navigated viewport

AI-generated interfaces must look deliberately aligned and proportional, not
like independently positioned blocks. Establish a shared content shell and a
small spacing/size system before styling individual sections. Repeated columns,
cards, controls and section headings must share visible axes; use `clamp()`,
`min()` / `max()`, `aspect-ratio` and grid/flex relationships for proportions
instead of accumulating unrelated pixel offsets. Optical exceptions are fine,
but they must be intentional and local — never compensate for a broken parent
layout by nudging every child differently.

For a landing page with section-to-section links such as **Next**, reaching the
target anchor is not enough. The destination must arrive as a composed frame:

- the target heading is fully visible and aligned to the shared shell;
- the primary visual/content block is optically centered in the available
  frame and is not clipped by the bottom of the viewport;
- the following Next control remains visible when the design promises one
  screen per section;
- desktop compaction does not leak into mobile, where natural vertical flow is
  usually the correct behavior.

Treat `100svh` as a vertical **budget**, not a decoration. Account for section
padding, heading height, gaps, the main panel and the Next control together.
Prefer reducing internal gaps, panel height and card padding at an appropriate
desktop breakpoint; do not scale the whole interface down or hide content. If
the content genuinely cannot fit one viewport, abandon the one-screen promise
and make the continuation visually explicit.

Validate the result after real anchor navigation in Chromium, Firefox and
WebKit. This is the engine-sensitive exception that "How many browsers?" above
names, not a contradiction of its one-browser bar: only this contract needs the
three engines, and the rest of the page still needs one. Measure the target and
important descendants with `getBoundingClientRect()` or Playwright
`bounding_box()`; for a one-screen frame their visible bottom must be
`<= window.innerHeight`. A screenshot taken after manually scrolling to a
convenient position does not prove the Next link lands correctly.

`examples/inox-landing` is the reference: its Material → Assembly → Systems →
Protocol controls share one component, and its desktop sections are sized so
the primary content and next transition stay inside the navigated viewport.

---

## 4. `h()` — Creating elements

```js
h(type, props, ...children)
```

| `type` | Result |
|--------|--------|
| `'div'`, `'p'`, `'button'`, etc. | HTML element |
| A function (component) | Calls the function immediately |
| `Fragment` | Flattens children, no wrapper element |

```js
import { h, Fragment } from '/dist/fluxaway.js';

// HTML element
h('p', { className: 'intro' }, 'Hello world')

// Component
h(Button, { variant: 'contained', onClick: save }, 'Save')

// Nesting
h('section', { className: 'card' },
  h('h2', null, 'Title'),
  h('p', null, 'Body text'),
  h(Button, { variant: 'tonal' }, 'Action'),
)

// Fragment — multiple roots without a wrapper
h(Fragment, null,
  h('dt', null, 'Term'),
  h('dd', null, 'Definition'),
)

// Conditional rendering
isLoading && h(Spinner, null)
error ? h(Alert, { variant: 'danger' }, error) : h(Content, null)

// List rendering
users.map((u) => h('li', { key: u.id }, u.name))
```

**Children can be passed as props or as 3rd+ args — both are equivalent:**

```js
h(Card, { padded: true }, h('p', null, 'Content'))
// same as:
h(Card, { padded: true, children: h('p', null, 'Content') })
```

---

## 5. `render()` — Mounting

```js
import { h, render } from '/dist/fluxaway.js';

function App() {
  return h('h1', null, 'Hello');
}

render(App, document.getElementById('app'));
// NOT: render(h(App), ...)
```

`unmount(container)` removes the app and runs all effect cleanups.

---

## 6. Hooks

Import from `/dist/fluxaway.js`.

### `useState`

```js
const [value, setValue] = useState(initialValue);
const [count, setCount] = useState(0);

// Functional update (safe when new value depends on old)
setCount((prev) => prev + 1);
```

### `useEffect`

```js
useEffect(() => {
  // runs after render when deps change
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // cleanup
}, [dep1, dep2]);

useEffect(() => { /* runs once on mount */ }, []);
useEffect(() => { /* runs on every render */ }); // no deps array
```

### `useRef`

```js
const inputRef = useRef(null);
// DOM access: <input ref={inputRef} />
// Read: inputRef.current.focus()

const countRef = useRef(0); // mutable box, changes don't trigger re-render
```

Attach to DOM elements with the `ref` prop:

```js
h('input', { ref: inputRef, type: 'text' })
```

### `useMemo`

```js
const sorted = useMemo(() => [...items].sort(compare), [items]);
```

### `useCallback`

```js
const handleClick = useCallback(() => doSomething(id), [id]);
```

### `useReducer`

```js
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'INCREMENT' });
```

### `useErrorBoundary`

```js
const [error, reset, guard] = useErrorBoundary();

if (error) return h('div', null, 'Error: ', error.message, h('button', { onClick: reset }, 'Retry'));

return guard(() => h(RiskyComponent, null));
// guard() catches render errors from its subtree
```

### `useForm`

```js
const { values, errors, field, handleSubmit, isSubmitting } = useForm({
  initialValues: { email: '', password: '' },
  validate: (v) => ({
    email:    !v.email.includes('@') ? 'Invalid e-mail' : '',
    password: v.password.length < 6 ? 'Minimum 6 characters' : '',
  }),
  onSubmit: async (values) => {
    await api.login(values);
  },
});

// Spread field() into components
h(TextField, { ...field('email'), label: 'E-mail', type: 'email' })
h(TextField, { ...field('password'), label: 'Password', type: 'password' })
h(Button, { onClick: handleSubmit(), disabled: isSubmitting }, 'Sign in')
```

`field(name)` returns `{ name, value, error, onBlur, onInput, onChange }`.
For a checkbox: `field('terms', { type: 'checkbox' })` returns `checked` instead
of `value`. `field(name, { onBlur, onInput, onChange })` chains your own handlers.

Spread it on **every** form control. The native ones (TextField, Textarea,
Select, Checkbox, Switch, Slider) report a DOM event. The value-based ones
(DatePicker, TimePicker, Combobox, RadioGroup, NumberInput, RangeSlider,
CodeEditor) report the value itself, and `values` stores it as reported: a
NumberInput's number stays a number, and a RadioGroup option keeps its type.
Start `initialValues` in the control's own shape: `''` for a date, a time or a
choice, `null` for an empty NumberInput, `[min, max]` for a RangeSlider.

```js
h(DatePicker, { ...form.field('delivery'), label: 'Delivery date' })
h(RadioGroup, { ...form.field('size'), label: 'Size', options: sizes })
```

Options: `initialValues`, `validate(values) → { field: 'message' }`, `onSubmit(values, helpers)`,
`validateOnBlur` (default `true`), `validateOnChange` (default `false`).

**Everything `useForm` returns** (do not inspect the object to find these):

| Key | What it is |
|---|---|
| `values`, `errors`, `touched` | current state, keyed by field name |
| `field(name, options?)` | props to spread on a field component |
| `handleSubmit(fn?)` | returns the event handler: validates; if invalid, touches every field (so all errors show) and resolves `false`; otherwise calls `fn` or `onSubmit` and resolves `true` |
| `isSubmitting` | `true` while an async `onSubmit` is pending — use it for `disabled` |
| `isValid` | no error is currently recorded |
| `dirty` | any value differs from `initialValues` |
| `submitCount` | how many times submit was attempted |
| `reset(nextValues?)` | back to `initialValues` (or new ones); clears errors, touched, submitCount; does not move focus |
| `setValue(name, value)`, `setValues(partial \| fn)` | set programmatically |
| `setFieldError(name, message)` | record an error and touch the field — for **server-side** errors |
| `setErrors(errors)`, `setFieldTouched(name, bool?)`, `setTouched(map)` | low-level setters |
| `validateForm(values?)` | run `validate` now; returns the errors |
| `serialize()` | a plain copy of `values` |

`onSubmit`'s second argument carries the same helpers (`reset`, `setFieldError`,
`setValues`, …), so the usual endings need no outer variable:

```js
onSubmit: async (values, { reset, setFieldError }) => {
  const result = await api.send(values);
  if (result.emailTaken) return setFieldError('email', 'E-mail already registered');
  reset();                       // clear the form after a successful send
}
```

Prefer a real form so Enter submits too:
`h('form', { noValidate: true, onSubmit: handleSubmit() }, …, h(Button, { type: 'submit' }, 'Send'))`.

**When `field(name).error` appears and goes away** (defaults: `validateOnBlur: true`,
`validateOnChange: false`):

- It is `""` until the field is **touched**. A field becomes touched when it
  **blurs** or when `handleSubmit` runs — never by typing.
- Blur validates the whole form, so an error can already be recorded for a field
  the user has not reached. It stays hidden until that field is touched.
- Typing never raises a new error. It re-checks only an error **already recorded
  for the field being edited**, so the message clears the moment the value
  becomes valid — it does not wait for the next blur.
- `validateOnChange: true` opts into the eager mode: the field is touched and
  the whole form validated on every keystroke.
- **A picker is validated on submit, not when it is left.** Combobox,
  DatePicker and TimePicker move focus into their own popup, which is not
  leaving the field. A RadioGroup has no blur of its own, and neither does a
  CodeEditor running CodeMirror. Picking a value re-checks an error already
  recorded, like typing does, so "required" goes away the moment a value is
  picked. NumberInput and RangeSlider are inputs and validate on blur like a
  TextField. A NumberInput that clamps on blur is validated with the clamped
  value.
- **A blur caused by a mouse press waits for the release.** Pressing anything
  blurs the focused field first; an error line appearing at that moment would
  push the pressed button, checkbox or link away and the browser would drop the
  click. So the touch and the validation run right after the click lands — a
  blur from Tab still validates at once. A submit, a `reset()` or an unmount in
  between supersedes the pending blur. **Keep `validateOnBlur: true`**: turning
  it off to "protect" the Submit click is not needed.
- **`reset()` clears values, errors and touched, and leaves focus where it
  is.** Enter submits from inside a field, so that field is still focused, and
  now empty, when `onSubmit` calls `reset()`. The blur that ends that focus (a
  success notice taking it, the next click anywhere) touches and validates
  nothing. That holds whether you move focus in the same handler or in a
  `useEffect`, so no `blur()` around `reset()` is needed. Because focus stays
  put, Enter → `reset()` → type the next entry works. A reset form is empty, not
  valid: once the person edits that field, or later leaves a required empty
  field again, its error appears as on a freshly loaded form.

Do not add your own `onBlur`/`onInput` revalidation on top of `field()` — the
error line appearing or vanishing between a button's `mousedown` and `mouseup`
moves the button and the click is lost.

### `useLocalStorage`

```js
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

### `useFetch`

```js
const { data, loading, error, refetch } = useFetch('/api/users');
// Pass null/undefined as url to skip fetching
// refetch() re-runs the same request on demand
// Second arg is a fetch() init object, forwarded untouched (Headers,
// FormData, functions survive). Requests always use the latest render's
// options, but changing options alone does NOT refetch — call refetch()
// or change the url. A user options.signal is chained into the internal
// AbortController (either can cancel).
```

### `useToast`

```js
const { toasts, toast, dismiss } = useToast();
// toast.success('Saved!')
// toast.error('Failed to save.', { title: 'Error' })
// toast.warning(msg) / toast.info(msg) — same signature
// toast.dismiss(id)
// Render <ToastStack toasts={toasts} onClose={(id) => toast.dismiss(id)} />
// somewhere in the tree (see §9) — useToast only holds the queue, it does
// not render anything itself.
```

### `useRouter`

```js
// Default: mode: 'hash' — "#/path?query". Works on any static host, no
// server configuration. Plain `<a href="#/dashboard">` navigates for free
// (a hash-only href never triggers a real page load).
const { path, navigate, params } = useRouter();
navigate('/dashboard');

// mode: 'history' — clean URLs via pushState/popstate. Same-origin
// `<a href="/dashboard">` clicks are intercepted automatically (no onClick
// needed), except modified clicks (ctrl/cmd/shift/alt, target!="_self",
// download) and same-page fragment links ("#section"), which keep native
// browser behavior.
// Requires the server to serve index.html for every app route — a direct
// load or refresh of e.g. /dashboard must not 404. A plain static file
// server (python -m http.server) does NOT do this; you need a server with
// SPA-fallback/rewrite configured, or stick to hash mode.
const { path, navigate, params } = useRouter({ mode: 'history' });
navigate('/dashboard');
```

### `useRoutes` / `matchPath` (nested routes + lazy)

```js
// matchPath(pattern, path, { end }) — segment-based matcher.
//   ':name' captures one URL-decoded segment; a trailing '*' captures the rest.
//   { end: false } prefix-matches and returns the remainder in `rest`.
matchPath('/users/:id', '/users/42')             // → { params: { id: '42' }, rest: '' }
matchPath('/users/:id', '/users/42/edit')        // → null  (exact match by default)
matchPath('/files/*', '/files/a/b.png')          // → { params: { '*': 'a/b.png' }, rest: '' }
matchPath('/users', '/users/42', { end: false }) // → { params: {}, rest: '42' }

// useRoutes(routes, { mode, notFound }) — resolve the current path against a
// nested route config and return the element to render. First sibling that
// matches wins, so list specific routes before catch-alls.
const routes = [
  { path: '/', element: h(Home, null) },
  {
    path: '/users/:id',
    component: UserLayout,            // rendered with { params, outlet }
    children: [
      { index: true, component: Profile },          // matches /users/:id exactly
      { path: '/posts/:postId', component: Post },  // matches /users/:id/posts/:postId
      { path: '/settings', lazy: () => import('./Settings.js'), fallback: h(Spinner, null) },
    ],
  },
  { path: '*', component: NotFound },  // catch-all
];

function App() {
  return useRoutes(routes, { notFound: h(NotFound, null) });
}

// A parent route renders its matched child through the `outlet` prop:
function UserLayout({ params, outlet }) {
  return h('div', null,
    h('h1', null, `User ${params.id}`),   // params merge parent + child
    outlet,                                // nested route element goes here
  );
}
```

Route object fields: `path` (pattern, relative to parent), `index` (matches the
parent's exact path), `component` (`(props) => vnode`, receives `{ params, outlet }`),
`element` (a vnode or `(params, outlet) => vnode`), `lazy` (`() => import(...)`,
resolved via `createLazy` and cached per route object so its load state survives
re-renders), `css` (stylesheet href or array of hrefs, loaded via `loadCSS()` on
first activation — the fallback holds until the CSS *and* the lazy JS, if any,
are ready; works with or without `lazy`), `fallback` (shown while a `lazy`/`css`
route loads), and `children`.
`useRoutes` calls `useRouter` internally; for `navigate` in the same component,
call `useRouter()` alongside it (both stay in sync).

A `lazy` route's module must expose the page component as `export default`
(or be the component itself). **A `lazy:` route only helps if the page module
is not also statically imported anywhere** — FluxaWay is no-build ESM, so any
static `import` chain reachable from `app.js` is fetched eagerly at startup
regardless. See "Code splitting in large apps" in §12.

### `renderToString` (server-side rendering)

```js
// From the SSR entry (works in the browser and in Deno/Bun/Node — no build).
import { renderToString } from '/dist/fluxaway-server.js';

const html = renderToString(App);                 // a component
const html = renderToString(App, { title: 'Home' }); // with root props
const html = renderToString(h('main', { className: 'm-page' }, 'Hi')); // a vnode

// Typical server response:
//   `<!doctype html><html><body><div id="app">${renderToString(App)}</div>
//    <script type="module" src="/app.js"></script></body></html>`
// The client then `render(App, document.getElementById('app'))` takes over.
```

Server mode runs the same hooks the client does, with these rules:

- `useState` / `useReducer` return their **initial** value; `useMemo` /
  `useCallback` / `useRef` / `useContext` work normally; `useId` is stable.
- `useEffect` effects **do not run** — put side effects and browser-only work
  (fetch, timers, subscriptions, DOM/`window`/`localStorage` access) in effects,
  which are client-only. A hook that reads a browser global *during render*
  (e.g. `useMediaQuery`, `useRouter`, `useWebSocket`) can't run on a non-browser
  runtime.
- Attribute names map exactly as on the client (`className`→`class`,
  `htmlFor`→`for`, `aria*`→`aria-*`, `style` objects → CSS strings, `dataset`
  → `data-*`). All text and attribute values are **HTML-escaped** (no injection).
- Event handlers (`onClick`, …) and `ref`s are omitted — the client wires those
  up when it hydrates. Portals render their children inline.

**Hydration** — adopt the server HTML instead of recreating it:

```js
import { hydrate } from '/dist/fluxaway-server.js';

// The server sent `<div id="app">${renderToString(App)}</div>`.
hydrate(App, document.getElementById('app'));
// Reuses the existing DOM nodes in place, attaching event handlers, refs, and
// any missing attributes. Only mismatches are rebuilt. After this, updates
// (setState) patch exactly as with render().
```

`hydrate(App, container)` expects the container's markup to be `renderToString`'s
own (compact) output. It transparently handles the two text-node quirks of SSR
— adjacent text merged by the parser (split back apart) and empty text nodes
from falsey children (`cond && h(...)`, absent in the HTML) — so the hydrated
DOM ends up identical to a fresh client render. Portals are not hydrated (created
fresh). If hydration throws, it falls back to a clean client render. See
`examples/ssr` for the full round-trip in the browser.

### `useHead` (document title + meta tags)

```js
import { useHead } from '/dist/fluxaway.js';

function DashboardPage() {
  useHead({
    title: 'Dashboard — Acme',
    meta: [
      { name: 'description', content: 'Sales overview' },
      { property: 'og:title', content: 'Dashboard' },
    ],
  });
  return h('main', null, /* ... */);
}
```

- **Last writer wins** — a route page rendered after an app-level `useHead`
  overrides the fields it declares. Nothing is removed on unmount (same
  semantics as writing `document.title` directly), so every page should
  declare its own head.
- Meta tags are keyed by `name` OR `property` and updated **in place** (one
  tag per key, marked `data-fluxaway-head`) — no duplicates accumulate.
- Client: applied after the render commits (an effect).
- Server: `renderToString()` collects the calls; `renderHeadToString()`
  (exported from `/dist/fluxaway-server.js` too) then returns the
  `<title>`/`<meta>` markup — values HTML-escaped, duplicates deduped:

```js
import { renderToString, renderHeadToString } from '/dist/fluxaway-server.js';

const body = renderToString(App);        // must run FIRST (collects useHead calls)
const head = renderHeadToString();       // consumes the collection
const page = `<!doctype html><html><head>${head}</head><body>
  <div id="app">${body}</div></body></html>`;
```

### `useTheme`

```js
const { theme, setTheme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
// Standalone — reads/writes localStorage('fluxaway-theme') and sets data-theme on <html>
// Does NOT require ThemeProvider. Multiple useTheme() instances stay in sync via
// a 'fluxaway:themechange' CustomEvent.
//
// Initial theme: the stored value (the plain string 'light' or 'dark') if there
// is one, else the OS setting (prefers-color-scheme). The first mount stores
// what it resolved, so from then on the choice is the user's, not the OS's.
//
// data-theme is written by a MOUNTED useTheme() — the hook itself or a
// ThemeToggle, which calls it. With neither on the page the stored theme is
// never applied and fluxaway-ui.css just follows the OS. So keep one mounted
// for the whole session: a ThemeToggle in the top bar, or a bare `useTheme()`
// in App. A ThemeToggle in Navbar `actions` counts — it stays mounted while
// the mobile menu is collapsed.
```

### `usePalette`

```js
const { palette, palettes, setPalette, customColor, setCustomColor } = usePalette();
// palette: 'default' | 'violet' | 'rose' | 'blue' | 'amber' | 'emerald' | 'custom'
// palettes: the full list, for building a picker UI
// Standalone, same pattern as useTheme — reads/writes localStorage('fluxaway-palette')
// and sets data-palette on <html>. Independent of useTheme: fluxaway-ui.css pairs
// each preset palette with both a light and a dark variant, so the two compose freely.
// setPalette(x) is a no-op if x isn't in `palettes`.
// A fixed PRESET palette needs no hook: `<html data-palette="violet">` by hand
// is supported, in both themes (the stylesheet only reads the attribute). Do not
// combine the two — a mounted usePalette() overwrites the attribute with the
// stored choice. 'custom' does need the hook: it writes --m-primary inline.
//
// setCustomColor(hex) accepts any '#rgb' or '#rrggbb' color, switches palette
// to 'custom', and writes --m-primary inline on <html>. fluxaway-ui.css derives
// --m-primary-hover/-soft/-secondary/-focus from it via color-mix(), so no
// shade computation is needed on the JS side. Invalid hex strings are ignored.
```

### `useDesign`

```js
const { design, designs, setDesign } = useDesign();
// design: 'fluxaway' | 'bootstrap' | 'metallic'
// designs: the full list, for building a picker UI
// Standalone, same pattern as useTheme/usePalette — reads/writes
// localStorage('fluxaway-design') and sets data-design on <html>.
//
// "fluxaway" (default) needs nothing beyond fluxaway-ui.css. Optional designs
// require their companion stylesheet: fluxaway-bootstrap.css or the
// experimental fluxaway-metallic.css. Both are fully scoped and inert until
// this hook (or a manual data-design attribute) selects them.
// Composes freely with useTheme and usePalette.
```

For the experimental metallic design, select its finish through the optional
add-on. Material selection is independent of light/dark mode:

```js
import { useMetalTheme } from "/dist/fluxaway-metallic.js";

const { metalTheme, metalThemes, setMetalTheme } = useMetalTheme();
// aurum | cobalt | cobalt-aurum | inox | bronze | ferrum | black-inox
setMetalTheme("inox"); // sets data-metal-theme and persists the selection
```

`examples/inox-landing` is the full-page reference for composing the Inox
finish with `fluxaway-motion`. It deliberately gives reveal motion and a
user-controlled mechanical sequence separate timelines, so entering the
viewport never changes the interactive control's declared state.

### `useContext` / `createContext`

See §7 below.

### Mobile hooks

```js
useSwipe(ref, { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold });
useLongPress(ref, { onLongPress, delay });
// These three return a BARE value, not an object — destructuring them
// (`const { online } = useNetworkStatus()`) silently yields undefined, and
// `const { vibrate } = useVibrate()` throws when you call it.
const online      = useNetworkStatus(); // → boolean, tracks online/offline events
const orientation = useOrientation();   // → "portrait" | "landscape"
const vibrate     = useVibrate();       // → (pattern = 10) => void  (no-op where unsupported)
vibrate(10);
vibrate([100, 50, 100]);

const { state, set, undo, redo, canUndo, canRedo } = useHistory(initial, { limit: 50 });
// Undo/redo stack. set(value) or set(prev => next). canUndo/canRedo are booleans.
```

### Utility hooks

```js
// Stable unique ID (survives re-renders)
const id = useId();

// Debounce — returns a copy of value that only updates after delay ms of silence
const query = useDebounce(inputValue, 300);

// Throttle — returns a function that fires at most once per delay ms
const onScroll = useThrottle((e) => setY(e.target.scrollTop), 100);

// CSS media query — reactive boolean. Correct on the FIRST render (it reads
// matchMedia synchronously), so there is no false→true flash to guard against.
const isMobile = useMediaQuery('(max-width: 768px)');

// Intersection observer — returns the latest IntersectionObserverEntry
const entry = useIntersectionObserver(ref, { threshold: 0.5, once: true });
// entry.isIntersecting, entry.intersectionRatio, etc.

// WebSocket with auto-reconnect
const { status, lastMessage, send } = useWebSocket('wss://api.example.com/ws');
// status: 'connecting' | 'open' | 'closed' | 'error'
// send(data) — serializes objects to JSON automatically

// Virtual list — renders only visible rows (all items must have equal fixed height)
const { containerRef, virtualItems, totalHeight, startIndex, endIndex } =
  useVirtualList(rows, { itemHeight: 48, overscan: 3 });
// Attach containerRef to the scrollable wrapper and give it a fixed height.
// virtualItems is [{ item, index, offsetTop }] — there is no ready-made
// `style`, so position each row yourself:
//   h('div', { key: index, style: { position: 'absolute', top: `${offsetTop}px`,
//                                   height: '48px' } }, item.label)
// wrapped in a { height: totalHeight, position: 'relative' } spacer.

// i18n
const { t } = useTranslation({ hello: 'Hello, {name}!' });
t('hello', { name: 'Ana' }) // → 'Hello, Ana!'
// A missing key returns the key itself: t('nope') → 'nope'. A {placeholder} with
// no matching var stays as written. Values go in LITERALLY and in one pass — a
// `$&`, a `$1` or another `{name}` inside a value is not expanded — so text a
// person typed is safe to interpolate. The result is a plain string: pass it as
// a child and h() escapes it. Dictionary entries must be strings.
// Any dictionary works, an inline literal included: t reads the one passed on
// the current render. Only t's identity follows the dictionary's — an inline
// literal makes a new t every render. That matters only when t sits in an
// effect/useMemo dependency list or goes to a memo() child; then pass a
// module-level constant (from data.js, say) so t stays the same function.

// Context menu position state (pair with ContextMenu component)
const { menu, openMenu, closeMenu } = useContextMenu();
// openMenu(e) — call on onContextMenu; menu = { open, x, y }

// Exit transitions — keeps elements mounted while their exit animation plays.
// FluxaWay normally removes a DOM node the instant its vnode disappears, so a CSS
// exit transition never runs; usePresence delays the removal by `duration` ms.

// Boolean form (dialogs, banners, single elements):
const { mounted, exiting } = usePresence(open, { duration: 200 });
return mounted
  ? h('div', { className: exiting ? 'toast toast-exit' : 'toast' }, 'Saved!')
  : null;

// List form (items leaving a collection) — exiting items keep their position,
// re-adding an item mid-exit cancels it. getKey defaults to item.key ?? item.id
// (a primitive item is its own key). Objects with neither collide on one key —
// FluxaWay warns once in the console; pass getKey:
const rows = usePresence(todos, { duration: 200, getKey: (t) => t.id });
return rows.map(({ key, item, exiting }) =>
  h('li', { key, className: exiting ? 'row row-exit' : 'row' }, item.label));
// Pair the exit class with a CSS transition/animation (see §11 utilities).
```

### Component utilities

```js
// memo — skip re-render when props are shallowly equal (or pass custom compare fn)
// Also re-renders when a descendant calls setState or when a context value
// read (useContext) anywhere inside the memoized subtree changes. Context
// values compare with Object.is — providers should useMemo their value
// object, or memo boundaries below them will never skip.
const MemoRow = memo(Row);
const MemoRow = memo(Row, (prev, next) => prev.id === next.id);

// Note on re-render scope: setState re-renders ONLY the component that owns
// the state (and its subtree) — ancestors and siblings do not re-run. State
// held at the root component (the function passed to render()) still
// re-renders from the root, and a component whose output is a fragment/array
// falls back to a root pass — one more reason to keep app.js a thin
// orchestrator and give components a single root element. memo remains
// useful for skipping children that receive equal props when their PARENT
// re-renders.

// createPortal — render children into a different DOM node (escapes overflow/z-index)
return h('div', null,
  h('p', null, 'Normal'),
  createPortal(h(Modal, { onClose }), document.body),
);

// createLazy — lazy-load a component via dynamic import()
const Chart = createLazy(() => import('./components/Chart.js'));
const Chart = createLazy(() => import('./Chart.js'), h(Spinner, null)); // custom fallback
// Shows fallback while loading. On error, throws — catch with useErrorBoundary.

// loadCSS — load a stylesheet once, deduped by resolved URL
await loadCSS('/components/reports/reports.css');
await loadCSS(new URL('./reports.css', import.meta.url));
// Injects <link rel="stylesheet"> and resolves on load; a <link> already in
// the document counts as loaded. Rejects on error (entry evicted for retry).
// Resolves immediately in a DOM-less runtime (renderToString on a server).
```

---

## 7. Context

FluxaWay's context works differently from React because children render eagerly.

```js
import { createContext, useContext, h } from '/dist/fluxaway.js';

// Create
const AuthCtx = createContext({ user: null, login: () => {} });

// Provide — use ctx.provide(value, renderFn), NOT a Provider component.
// The provider must construct its subtree INSIDE the renderFn thunk, so that
// h(Header)/h(Main) execute while `ctx` is on top of the context stack.
function AuthProvider() {
  const [user, setUser] = useState(null);
  const ctx = { user, login: (u) => setUser(u) };

  return AuthCtx.provide(ctx, () =>
    h('div', null, h(Header), h(Main))
  );
}

// Consume
function UserBadge() {
  const { user } = useContext(AuthCtx);
  return h('span', null, user?.name ?? 'Guest');
}
```

### ❌ A "Provider component" that takes `children` as a prop does NOT work

```js
// WRONG — by the time h(ThemeProvider, null, h(App)) can call ThemeProvider,
// JS has already evaluated h(App) as an argument expression — meaning App()
// (and everything inside it) already ran, with nothing on the context stack.
// Wrapping the already-evaluated `children` vnode in `() => children` does
// NOT defer that evaluation; it happened before this function body started.
function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  return ThemeCtx.provide({ theme, toggleTheme: () => {} }, () => children);
}
render(() => h(ThemeProvider, null, h(App)), document.getElementById('app'));
// → useContext(ThemeCtx) anywhere inside App always sees the default value.
```

`useTheme()` (§6) is standalone and does NOT need a context — it already
reads/writes `localStorage` directly. Only reach for a custom context like
the one above when you need state that isn't already covered by a hook.

### Composing multiple contexts

Because a provider must own the construction of what it wraps, the way to
combine several contexts is to nest `.provide()` calls in one
composition-root component — typically the function passed to `render()`:

```js
function App() {
  const auth = useAuthState();  // plain hooks, not components — see §12
  const cart = useCartState();

  return AuthCtx.provide(auth, () =>
    CartCtx.provide(cart, () =>
      h(Shell)
    )
  );
}

render(App, document.getElementById('app'));
```

`useAuthState()`/`useCartState()` hold each domain's state and return the
value object for that domain's context. See §12 for where these hooks live
in a domain-componentized project.

---

## 8. Props & DOM Bindings

### Naming conventions

| FluxaWay prop | HTML/DOM equivalent |
|-----------|---------------------|
| `className` | `class` |
| `htmlFor` | `for` |
| `onClick` | `addEventListener('click', fn)` |
| `onChange` | `addEventListener('change', fn)` |
| `onInput` | `addEventListener('input', fn)` |
| `onMouseDown` | `addEventListener('mousedown', fn)` |
| `onKeyDown` | `addEventListener('keydown', fn)` |
| `ariaLabel` | `aria-label` |
| `ariaHidden` | `aria-hidden` |
| `ariaExpanded` | `aria-expanded` |
| `ariaLive` | `aria-live` |
| `ariaControls` | `aria-controls` |
| `ariaHaspopup` | `aria-haspopup` |
| `ariaCurrent` | `aria-current` |
| `ariaModal` | `aria-modal` |
| `ariaSelected` | `aria-selected` |
| `ariaLabelledby` | `aria-labelledby` |
| `ariaDescribedby` | `aria-describedby` |
| `ariaInvalid` | `aria-invalid` |
| `ariaActivedescendant` | `aria-activedescendant` |
| `ariaAutocomplete` | `aria-autocomplete` |
| `ariaValuenow/min/max` | `aria-valuenow/min/max` |
| `ref` | DOM ref (see §6 useRef) |
| `key` | Reconciler key (not set on DOM) |
| `dataset` | `data-*` attributes |

Any prop starting with `on` + uppercase letter is treated as an event listener.
`eventName` is derived as `propName.slice(2).toLowerCase()` — so `onClick` → `click`,
`onMouseDown` → `mousedown`, `onInput` → `input`.

`aria*` props are reflected IDL string properties, not booleans — pass the
literal string `"true"` / `"false"`, not a JS boolean:

```js
h('span', { ariaHidden: 'true' })              // CORRECT
h('button', { ariaExpanded: isOpen ? 'true' : 'false' })

h('span', { ariaHidden: true })                 // WRONG — sets aria-hidden=""
```

The attribute name itself also works as a key, on any element (not only SVG):
`h('div', { 'aria-owns': listId })` is set verbatim. Use that form for an
`aria-*` attribute the table does not list; the string rule above applies to it too.

Any other HTML attribute is written **exactly as HTML spells it** — lower-case,
hyphens and all — and passed straight through: `inputmode: 'email'`,
`autocomplete: 'given-name'`, `'data-testid': 'submit'`. Only the handful in the
table above have a camelCase alias. This holds on a field component too, where
extra props reach the control:
`h(TextField, { ...form.field('email'), inputmode: 'email', autocomplete: 'email' })`.

A true boolean attribute takes a JS boolean — `disabled: true`, `hidden: isHidden`,
`required: true` — and `false` removes it. `spellcheck`, `draggable` and
`translate` are neither: HTML gives them a *value* (`spellcheck="false"`), so
both forms are accepted and mean the same thing — `spellcheck: false` and
`spellcheck: 'false'` both turn it off.

### SVG through `h()`

`h('svg', …)` and everything inside it is created in the SVG namespace — inline
icons and illustrations need nothing special. `className`, `viewBox`, `width`,
`fill`, `d`, `ariaHidden` work as written. **Presentation attributes keep their
real hyphenated names, as quoted keys** — there is no camelCase alias for them:

```js
h('svg', { className: 'l-icon', viewBox: '0 0 24 24', width: 24, height: 24,
           fill: 'none', stroke: 'currentColor',
           'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
           ariaHidden: 'true', focusable: 'false' },
  h('path', { d: 'M4 12h16M12 4v16' }),
)

h('path', { strokeWidth: '2' })   // WRONG — writes a dead strokeWidth="2" attribute;
                                  // the stroke keeps its inherited width, silently
```

A decorative icon gets `ariaHidden: 'true'`; an icon that carries meaning on its
own gets `role: 'img'` + `ariaLabel`. Use `stroke: 'currentColor'` /
`fill: 'currentColor'` so it follows the text color and the theme.

### `style` prop

Accepts a **camelCase object** or a CSS string:

```js
h('div', { style: { color: 'red', fontSize: '1.25rem', padding: '8px 16px' } })
h('div', { style: 'color: red; font-size: 1.25rem' })

// CSS custom properties:
h('div', { style: { '--m-primary': '#ff6600' } })
```

### `dataset` prop

```js
h('div', { dataset: { id: 'user-42', active: 'true' } })
// → <div data-id="user-42" data-active="true">
```

### `ref` prop

```js
const el = useRef(null);
h('input', { ref: el })          // el.current → the DOM node
h('div',   { ref: (node) => { } }) // callback ref
```

### Boolean props

```js
h('input', { disabled: true })    // sets attribute
h('input', { disabled: false })   // removes attribute
h('input', { required: true })
```

### `innerHTML` prop (raw HTML)

FluxaWay's equivalent of React's `dangerouslySetInnerHTML` — injects a string as
raw HTML into the element:

```js
h('article', { className: 'post', innerHTML: markdownToHtml(post.body) })
```

- **Never combine with children** on the same element — `h()` drops the
  children and warns in the console (raw HTML owns the whole subtree).
  Give the raw HTML its own dedicated leaf element.
- Re-injected only when the string changes; removing the prop (or passing
  `null`) clears the content.
- Works in `renderToString` too: emitted **verbatim** (not escaped) in place
  of children.
- The string is **not sanitized**. Never pass user input or third-party
  content without sanitizing it first (XSS).

### `href` / `src` with untrusted URLs → wrap in `safeUrl()`

HTML-escaping (which the SSR serializer applies to every attribute) stops
attribute **breakout**, but it does NOT stop a dangerous URL **scheme**:
`h('a', { href: 'javascript:alert(1)' })` renders a valid, fully-escaped
attribute whose scheme still runs code on click. This is the same class of
gap as `innerHTML`, and the fix is the same shape — a blessed helper you opt
into wherever the value is untrusted:

```js
import { safeUrl } from '/dist/fluxaway.js';

h('a',   { href: safeUrl(user.website) }, user.website)
h('img', { src:  safeUrl(user.avatar) })
h('a',   { href: safeUrl(user.link, '#') }, 'Profile')  // custom fallback
```

`safeUrl(url, fallback = '')` checks only the scheme. What passes comes back
**unchanged**; what is blocked comes back as `fallback` (default `""`):

| Input | Result |
|---|---|
| `#catalogue` (fragment) | unchanged |
| `images/roses.jpg`, `./a`, `../b` (relative path) | unchanged |
| `/shop` (root-relative), `//cdn.example.com/x.js` | unchanged |
| `https://…`, `http://…`, any other scheme (`ftp:`, an app's own) | unchanged |
| `mailto:…`, `tel:…` | unchanged |
| `data:image/png;base64,…` (any `data:image/*`) | unchanged, a safe inline image |
| `javascript:…`, `vbscript:…` | `fallback` |
| `data:text/html,…` (any `data:` that is not an image) | `fallback` |
| `null`, `undefined`, `false` | `fallback` |

- The scheme test ignores case and strips control characters and whitespace
  first, so `"java\tscript:"` and `" JAVASCRIPT:"` are blocked too.
- Pure string logic: it works the same on the client and in `renderToString`.

FluxaWay never rewrites URLs automatically (a `data:` image or a custom app scheme
may be exactly what you want), so this is opt-in — reach for it on any URL that
originated from user input, an API, or third-party content.

---

## 9. UI Components (`/dist/fluxaway-components.js`)

~60 components + CSS-only primitives, organized in **six category modules**.
`fluxaway-components.js` is a barrel that re-exports all of them — convenient,
but in no-build ESM importing the barrel downloads every category. Production
apps should import only the categories they use:

| Module | Components |
|---|---|
| `fluxaway-components-core.js` | Button, IconButton, Card, Alert, Badge, Chip, FormField, Spinner, Divider, Skeleton, EmptyState, Avatar, AvatarGroup, Progress |
| `fluxaway-components-forms.js` | TextField, Textarea, Select, Checkbox, Radio, RadioGroup, Switch, Slider, RangeSlider, NumberInput, Combobox, DatePicker, TimePicker, FileDropZone, CodeEditor |
| `fluxaway-components-overlay.js` | Dialog, Drawer, Dropdown, Tooltip, Popover, Menu, ContextMenu, BottomSheet, CommandPalette, Toast, ToastStack |
| `fluxaway-components-data.js` | Table, DataTable, Pagination, Stat, StatGrid, TreeView, Accordion, Collapse |
| `fluxaway-components-nav.js` | Tabs, TabPanel, Navbar, AppBar, BottomNav, Breadcrumb, Stepper, FAB, SpeedDial, SwipeableListItem |
| `fluxaway-components-theme.js` | ThemeToggle, PaletteSwitcher, DesignSwitcher |

```js
// preferred: category imports (loads only what the page needs)
import { Button, Card } from '/dist/fluxaway-components-core.js';
import { TextField } from '/dist/fluxaway-components-forms.js';

// also valid: the barrel (same names, loads ALL categories)
import { Button, Card, TextField } from '/dist/fluxaway-components.js';
```

Every category depends only on `fluxaway-components-core.js`, an internal
`fluxaway-components-util.js` helper module (not public API) and `fluxaway.js`.
Both forms have identical exports — the same component name never moves
between the barrel and its category.

### Category CSS (match the JS split)

`fluxaway-ui.css` (~114 KB) is the full design system in one file — the simplest
option (one `<link>`), and unchanged. But it mirrors the JS: it's also
available **pre-split by category**, so a page loads only the CSS it uses.

| File | Contents |
|---|---|
| `fluxaway-ui-base.css` | tokens, dark mode, palettes, reset, 12-col grid, all utilities, typography, animations — the shared foundation |
| `fluxaway-ui-core.css` | Card (+ variants), Button, Chip, Badge, Alert, form-field base, Progress, Spinner, Divider, Avatar, Skeleton, EmptyState |
| `fluxaway-ui-forms.css` | Switch, Slider/RangeSlider, Combobox, DatePicker, TimePicker, NumberInput, Radio, FileDropZone, CodeEditor |
| `fluxaway-ui-overlay.css` | Dialog, Drawer, Dropdown, Tooltip, Popover, Menu, ContextMenu, BottomSheet, CommandPalette, Toast(Stack) |
| `fluxaway-ui-data.css` | Table, DataTable, Pagination, Stat/StatGrid, TreeView, Accordion, Collapse |
| `fluxaway-ui-nav.css` | Tabs, Navbar, App shell, AppBar, BottomNav, Breadcrumb, Stepper, FAB, SpeedDial, Sidebar, SwipeableListItem |
| `fluxaway-ui-theme.css` | PaletteSwitcher, DesignSwitcher |

```html
<!-- simplest: the whole design system (default) -->
<link rel="stylesheet" href="/dist/fluxaway-ui.css">

<!-- granular: base is always required; add core, then only the categories
     you import components from (categories build on base + core) -->
<link rel="stylesheet" href="/dist/fluxaway-ui-base.css">
<link rel="stylesheet" href="/dist/fluxaway-ui-core.css">
<link rel="stylesheet" href="/dist/fluxaway-ui-forms.css">
```

Loading `base + core + forms + overlay + data + nav + theme` is byte-for-byte
identical to loading `fluxaway-ui.css`. The category files are **generated** from
the monolith by `python scripts/split_css.py` (which asserts the split is
lossless) — edit `fluxaway-ui.css`, never the `fluxaway-ui-*.css` files. Prefer the
monolith for a quick page; reach for the split on a production page that uses
only part of the library (a core-only page drops ~114 KB → ~52 KB before
minify/gzip).

### Local design scope (for example, Cobalt buttons only)

Design selectors are descendant-based. `useDesign()` switches the whole
document by writing to `<html>`; when only one component group should use an
optional skin, set the design attributes on a narrow wrapper instead. Load the
normal component CSS first and the companion skin last:

```html
<link rel="stylesheet" href="/dist/fluxaway-ui-base.css">
<link rel="stylesheet" href="/dist/fluxaway-ui-core.css">
<link rel="stylesheet" href="/dist/fluxaway-metallic.css">
```

```js
import { h, useTheme } from "/dist/fluxaway.js";
import { Button } from "/dist/fluxaway-components-core.js";

function CobaltActions() {
  const { theme } = useTheme();

  return h('div', {
    className: 'm-cluster',
    dataset: { design: 'metallic', metalTheme: 'cobalt', theme },
  },
    h(Button, { variant: 'contained' }, 'Deploy'),
    h(Button, { variant: 'tonal' }, 'Review'),
    h(Button, { variant: 'outline' }, 'Cancel'),
  );
}
```

The wrapper affects **every FluxaWay descendant inside it**, not only Buttons.
Keep only the controls that should share the material inside that wrapper. Pass
the current `theme` so local Metallic light/dark recipes follow the document;
material selection itself remains independent. The docs-site Button reference
is the canonical live example.

### `className` and extra props pass through

Every component accepts `className` and **merges** it onto its root element —
it never replaces the component's own `m-*` classes. Use it to position or size
a component from your CSS: `h(Card, { className: 'l-plan' })`.

Any prop the component does not know (`id`, `style`, `dataset`, `aria*`, `on*`,
`title`, `ref`…) is forwarded to that same root element, so
`h(Navbar, { id: 'top', ariaLabel: 'Main' })` puts both on the `<nav>`. The
exceptions take **only** their documented props plus `className`: `Tabs`,
`BottomNav`, `Pagination`, `ContextMenu`, `ToastStack`, `BottomSheet`.

`ref` travels the same way: `h(Alert, { ref: boxRef })` gives you the alert's root
`<div>` — no wrapper element needed — and on a field component, the control.
These keep their own ref on the root and ignore yours: `Navbar`, `SpeedDial`,
`Dialog`, `Drawer`, `Dropdown`, `Menu`, `Popover`, `CommandPalette`, `Combobox`,
`DatePicker`, `TimePicker`, `CodeEditor`, `TreeView`. Give those an `id`, or put
the ref on an element of your own around them.

Field components (TextField, Textarea, Select, NumberInput…) split it: `className`
styles the **wrapper** (label + control + help), `inputClassName` styles the
control, and extra props go to the **control** — that is why `...field('name')`,
`placeholder`, `type`, `autocomplete` and `onInput` reach the `<input>`.

Do not inspect the DOM to find the `m-*` class names and restyle them from
outside: they are not API. Add your own class through `className`, or set `--m-*`
tokens on a wrapper (§11).

### Built-in text is always a prop (pages that are not in English)

A few components have to write text of their own: mostly *invisible*
`aria-label`s a screen reader speaks ("Open menu", "required", "Next page"),
plus some visible placeholders and the DatePicker calendar. Each one is a prop
with an English default. **On a page in another language, pass them** —
otherwise a screen reader announces English in the middle of your page.

| Component | Props (English default) |
|---|---|
| every field — TextField, Textarea, Select, Combobox, Slider, RangeSlider, DatePicker, NumberInput, TimePicker, RadioGroup, FormField | `requiredLabel` ("required") |
| Navbar | `openMenuLabel` ("Open menu"), `closeMenuLabel` ("Close menu") |
| ThemeToggle | `switchToLightLabel`, `switchToDarkLabel` |
| PaletteSwitcher / DesignSwitcher | `ariaLabel`, `customLabel`, `paletteLabels` ({ violet: 'Violeta' }) / `ariaLabel` |
| Dialog, Drawer, BottomSheet / Toast, ToastStack | `closeLabel` ("Close") / `closeLabel` ("Dismiss") |
| Pagination | `ariaLabel` ("Pagination"), `previousLabel`, `nextLabel` |
| Combobox | `placeholder` ("Select..."), `searchPlaceholder` ("Search..."), `emptyLabel` ("No results") |
| DatePicker | `placeholder`, `previousMonthLabel`, `nextMonthLabel`, `monthNames` (12, January first), `weekdayNames` (7, Sunday first), `formatValue(date)`, `formatDayLabel(date)` |
| TimePicker / NumberInput / RangeSlider / FileDropZone | `placeholder` / `decrementLabel`, `incrementLabel` / `minLabel`, `maxLabel` / `label` |
| Table, DataTable / EmptyState / Spinner | `emptyTitle` ("No rows"), `emptyDescription` ("Try changing the filters.") / `title` ("No results"; `description` has no default and renders nothing when absent) / `label` ("Loading") |
| CommandPalette | `ariaLabel`, `placeholder`, `emptyLabel` |
| AvatarGroup | `moreLabel` — a function: `(count) => 'mais ' + count` |
| SpeedDial / Breadcrumb, TreeView, ContextMenu | `label` / `ariaLabel` |

```js
// A Brazilian Portuguese contact form
h(Navbar, { brand: 'Flor & Cia', items, openMenuLabel: 'Abrir menu', closeMenuLabel: 'Fechar menu' })
h(ThemeToggle, { switchToLightLabel: 'Mudar para o tema claro', switchToDarkLabel: 'Mudar para o tema escuro' })
h(TextField, { ...field('nome'), label: 'Seu nome', required: true, requiredLabel: '' })  // see below
h(DatePicker, {
  label: 'Data da entrega', value, onChange, placeholder: 'Escolha uma data',
  required: true, requiredLabel: 'obrigatório',
  previousMonthLabel: 'Mês anterior', nextMonthLabel: 'Próximo mês',
  monthNames: MESES, weekdayNames: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  formatValue: (date) => date.toLocaleDateString('pt-BR'),            // trigger shows 20/09/2026
  formatDayLabel: (date) => date.toLocaleDateString('pt-BR', { dateStyle: 'full' }),
})  // value / onChange stay ISO 'YYYY-MM-DD'
```

Keep repeated wording in `data.js` (e.g. `export const UI = { required: 'obrigatório' }`)
or in a `useTranslation(dict)` dictionary (§6) and pass it where needed.

`requiredLabel: ''` hides the asterisk from screen readers (it stays visible).
Use it on TextField / Textarea / Select: their native `required` attribute
already makes the reader say "required" in the **user's** language, so a spoken
asterisk only repeats it. Translate `requiredLabel` on the fields that have no
native `required` control to speak for them — DatePicker, Combobox, TimePicker,
RangeSlider — as the example above does.

### Basic

```js
// Button
h(Button, {
  variant: 'outline',     // 'text' | 'contained' | 'tonal' | 'danger' | 'outline'
  icon: 'close',          // optional leading icon; 'close' is built in, or pass a VNode/text icon
  accent: true,           // optional theme-colored leading border + icon emphasis
  effect: 'conductor',    // optional official interaction signature (nine choices below)
  type: 'button',         // 'button' | 'submit' | 'reset'
  disabled: false,
  onClick: fn,
}, 'Clear filters')

// Button as a LINK — pass `href` and it renders <a class="m-button …"> instead of
// <button>, identical to look at. Use it for every call-to-action that navigates
// (anchors, other pages, WhatsApp/mailto/tel) — never onClick + location.href,
// and never hand-write the m-button classes on your own <a>.
h(Button, { variant: 'contained', href: '#pricing' }, 'See plans')
h(Button, { variant: 'outline', href: 'https://example.com', target: '_blank' }, 'Docs')
//   target: '_blank' gets rel="noopener noreferrer" unless you pass your own rel.
//   disabled + href → the href is dropped (role="link" aria-disabled="true"):
//   out of the tab order, nothing to navigate to. `type` is ignored on a link.
//   IconButton forwards href the same way.
// SECURITY: `href` is passed through UNTOUCHED, exactly like h('a', { href }) —
// FluxaWay never rewrites URLs. Any URL that came from user input, an API or
// third-party content goes through safeUrl() (§8):
h(Button, { href: safeUrl(shop.website, '#') }, 'Visit the shop')

// Official Button effects — exported as BUTTON_EFFECTS from the core module:
// 'reflection' | 'edge' | 'split' | 'aperture' | 'charge' | 'corners' |
// 'pulse' | 'phase' | 'conductor'
//
// Effects own the animated surface while variant still supplies its semantic
// hierarchy/class. `outline` is the canonical pairing. They use theme tokens in
// FluxaWay and Bootstrap; Metallic supplies exact finish recipes, including a
// distinct conductor contour for all seven materials. Hover and focus-visible
// run the same motion, disabled removes it, and prefers-reduced-motion settles
// transitions immediately.

// Icon-only Button: ariaLabel or ariaLabelledby is required at runtime.
h(Button, {
  variant: 'outline',
  icon: 'close',
  ariaLabel: 'Close',
  onClick: close,
})

// `outline` is the canonical name. `outlined` remains a compatibility alias
// for early declarations/examples, but new code should use `outline`.
// `accent` composes especially well with `outline`; it uses --m-primary and
// logical border properties, so it follows palettes, themes and RTL layouts.

// IconButton — square 44×44 button for a single icon (corners follow --m-radius)
h(IconButton, {
  label: 'Close',         // aria-label (required)
  variant: 'tonal',       // same variants as Button
  onClick: fn,
}, '✕')

// Badge
h(Badge, null, 'New')
h(Badge, { className: 'm-badge-success' }, '3')
// Status variants are classes, not a prop: m-badge-success | m-badge-warning |
// m-badge-danger. No class = the default primary tint.

// Chip — a static label, or a toggle/filter when it has onClick
h(Chip, { active: form.dirty }, 'Modified')             // no onClick → <span>, not focusable
h(Chip, { active: on, onClick: () => setOn(!on) }, 'Design')
// with onClick → <button type="button" aria-pressed="true|false">: focusable,
// Enter/Space work, `disabled` is supported. This is the component for filter
// chips — never put onClick on a Badge or a plain <span>. For a one-of-many
// group, wrap the chips in h('div', { role: 'group', ariaLabel: 'Filter by…' }).
// Passing your own `role` (e.g. 'radio' + ariaChecked) turns aria-pressed off.

// FAB — Floating Action Button
h(FAB, {
  label: 'Add',           // aria-label when not extended
  extended: false,        // true = shows label as text
  onClick: fn,
}, '+')

// SpeedDial — trigger that expands a row of IconButtons
h(SpeedDial, {
  label: 'Quick actions', // aria-label for the trigger
  icon: h('i', { className: 'bi bi-plus-lg' }),
  orbit: false,           // true = items stack upward above the trigger instead of inline
  items: [
    { label: 'Message', icon: h('i', { className: 'bi bi-chat-dots' }), onClick: fn },
    { label: 'Share',   icon: h('i', { className: 'bi bi-share' }),     onClick: fn },
  ],
})
// Manages its own open/close state (useState) and closes on outside click or
// after an item is picked — no controlled-state prop needed.

// Avatar — initials fallback derived from `name` when there is no src
h(Avatar, { name: 'Ada Lovelace', size: 'md' })   // renders "AL"
// Initials = first letter of the FIRST word + first letter of the LAST word,
// uppercased: 'Ada' → "A", 'Ada King Lovelace' → "AL". Pass children to show
// something else: h(Avatar, { name: 'Ada Lovelace' }, 'AK').
h(Avatar, { src: '/u/ada.png', name: 'Ada Lovelace' })
// a11y: Avatar names itself — role="img" + aria-label from `name` (or the img alt).
// Right when it stands ALONE. When the same name is written next to it, a screen
// reader says it twice; hide the avatar from readers and let the text speak:
h('div', { className: 'author' },
  h(Avatar, { name: 'Ada Lovelace', ariaHidden: 'true' }),   // drops role + aria-label too
  h('span', null, 'Ada Lovelace'),
)
// sizes: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// AvatarGroup — overlapping stack; avatars beyond `max` collapse into "+N"
h(AvatarGroup, {
  max: 4,
  avatars: [{ name: 'Ada' }, { name: 'Grace' }, { src: '/u/alan.png', name: 'Alan' }],
})

// Divider
h(Divider)                    // <hr class="m-divider">
h(Divider, { vertical: true }) // inline separator, role="separator"
```

### Layout

```js
// Card — `padded` DEFAULTS TO TRUE (16px). Writing it is optional; the examples
// in this document spell it out only for clarity.
h(Card, null, h('p', null, 'Content'))                 // padded
h(Card, { padded: false }, h('img', { src, alt }))     // edge-to-edge: media, tables, lists
// `padded` is 16px or nothing — there is no size in between. For another padding
// or another background, pass your own class; that is supported, restyling
// `.m-card` is not:
//   h(Card, { padded: false, className: 'l-plan' }, …)
//   .l-plan { padding: var(--m-space-6); background: var(--m-surface-muted); }
// (`padded: false` so the padding never depends on which stylesheet loads last.)
// Renders an <article>. It does NOT clip its content (a Menu, Combobox or
// DatePicker opened inside a card must be able to overflow it), so an
// edge-to-edge image keeps square corners over the card's rounded ones. Round
// the image — border-radius: var(--m-radius) var(--m-radius) 0 0 — or, in a
// card that holds no popover, pass a className that sets overflow: hidden.
// CSS: add m-card-hover for a clickable card (pointer + hover border/shadow)
// Equal heights in a grid come free: a CSS grid stretches its items, so sibling
// Cards in `grid-template-columns` already match the tallest — unless you wrote
// `align-items: start`, which opts out. What does NOT come free is lining up
// what is INSIDE cards of different content lengths (a price, a button on the
// bottom edge). Make the card itself the column and let one row absorb the
// slack — the Card takes `className`, so this is your CSS, not a restyle:
//   .l-plan { display: grid; grid-template-rows: auto 1fr auto; }

// Card variants — CSS-only modifier classes on top of Card/.m-card, combine
// with a plain `<article className="...">` when you need children the Card()
// helper doesn't pass through (see examples/components/components/cards/PageCards.js):
//
// m-card-media (+ m-card-media-zoom)
//   Image-backed card: absolutely-positioned `.m-card-media-img`,
//   `.m-card-media-shadow` (gradient overlay) and `.m-card-media-body`
//   (overlaid text), bottom-aligned. `-zoom` scales the image on hover.
//
// m-card-reveal (goes on top of m-card-media)
//   Adds a `.m-card-reveal-trigger` (round corner button) and a
//   `.m-card-reveal-panel` (full-bleed overlay) that expands from a
//   clip-path circle on hover/focus. Trigger must come before the panel in
//   the DOM (sibling selector).
//
// m-card-float
//   Image (`.m-card-float-img`) with a `.m-card-float-panel` parked below
//   it, clipped away by the card's own `overflow: hidden` at rest (genuinely
//   hidden, not just transparent). Defaults intentionally match the
//   landscape reference card: 328px image width (348px at >=1120px), 1.5rem
//   image radius, centered 280px panel (316px at >=1120px), `bottom: -9rem`,
//   overshoot to `-10rem`, and settle at `-7rem`. Override with CSS variables
//   such as `--m-card-float-width`, `--m-card-float-aspect`,
//   `--m-card-float-panel-width`, `--m-card-float-panel-rest`, and
//   `--m-card-float-panel-overshoot` when a different composition is needed.
//   On hover/focus-within it uses the same overflow-toggling keyframe trick
//   as the reference so the panel appears to grow out of the clipped card.
//   The panel itself is a frosted-glass surface at rest (`color-mix(in srgb,
//   var(--m-surface) 88%, transparent)` + `backdrop-filter: blur(12px)`) but
//   solidifies to opaque `var(--m-surface)` for the 30%-50% stretch of each
//   rise/sink keyframe — solid while it's actually moving, translucent once
//   it settles — since a moving translucent panel over a busy photo is hard
//   to read.
//   On exit it rises once more, sinks below the image, then gets clipped.
//
// m-card-glow (+ m-card-glow-amber / -violet / -emerald)
//   Standalone gradient-border card driven by --m-card-hue-1/--m-card-hue-2
//   (default 210/265). Children: `.m-card-glow-blur-1` / `-blur-2` (decorative,
//   empty divs), `.m-card-glow-icon`, and `.m-card-glow-body` wrapping the
//   actual content — the blur discs sit behind it and bloom on hover.
//
// m-card-expand-group / m-card-expand
//   Flex accordion of image strips; the active item is controlled with
//   useState + an `is-active` class (not the CSS `:has()` trick), so it also
//   expands on hover for free. Children: `.m-card-expand-img`,
//   `.m-card-expand-shadow`, `.m-card-expand-data` (icon + title, fades in
//   only while expanded/active — the fade is delayed 0.1s behind the 0.5s
//   `flex` expansion so the text settles in after the strip has widened,
//   instead of racing it). Hovering the already-active strip also zooms
//   `.m-card-expand-img` slightly (`scale(1.1)`).
//
// m-card-pricing
//   Adds a `.m-card-pricing-badge` (price tag with a clipped notch via
//   `::after`) positioned top-right of a regular Card; `.m-card-pricing-period`
//   for the "/month" sublabel.

// Divider — CSS-only, no JS component needed
h('hr', { className: 'm-divider' })
h('span', { className: 'm-divider-vertical' })   // inline vertical separator

// Avatar — CSS-only
h('span', { className: 'm-avatar m-avatar-md' }, 'AB')          // initials
h('span', { className: 'm-avatar m-avatar-md' },
  h('img', { src: url, alt: name })                              // photo
)
// Sizes: m-avatar-xs (24px) | m-avatar-sm (32px) | m-avatar-md (40px) | m-avatar-lg (56px) | m-avatar-xl (72px)

// Avatar group (overlapping)
h('div', { className: 'm-avatar-group' },
  h('span', { className: 'm-avatar m-avatar-sm' }, 'A'),
  h('span', { className: 'm-avatar m-avatar-sm' }, 'B'),
  h('span', { className: 'm-avatar m-avatar-sm' }, '+3'),
)

// Skeleton — CSS-only loading placeholder
h('div', { className: 'm-skeleton', style: { width: '100%', height: 20 } })
h('div', { className: 'm-skeleton m-skeleton-text', style: { width: '60%' } })
h('div', { className: 'm-skeleton m-skeleton-circle', style: { width: 40, height: 40 } })

// Breadcrumb — CSS-only
h('ol', { className: 'm-breadcrumb' },
  h('li', { className: 'm-breadcrumb-item' },
    h('a', { className: 'm-breadcrumb-link', href: '/' }, 'Home'),
    h('span', { className: 'm-breadcrumb-sep' }, '/'),
  ),
  h('li', { className: 'm-breadcrumb-item' },
    h('a', { className: 'm-breadcrumb-link', href: '/projects' }, 'Projects'),
    h('span', { className: 'm-breadcrumb-sep' }, '/'),
  ),
  h('li', { className: 'm-breadcrumb-item' }, 'Current page'),
)

// Collapse — single collapsible section
h(Collapse, {
  title: 'Click to expand',
  defaultOpen: false,
}, h('p', null, 'Hidden content'))

// Accordion — multiple collapsible panels grouped together.
// The body uses the same grid-template-rows: 0fr → 1fr animation as Collapse.
//
// items   [{ key, title, children, disabled? }]  — required
// multiple  allow several panels open at once (default false)
// defaultOpen  initially-open key (or array) — uncontrolled
// open         controlled: key | key[]  (omit for uncontrolled)
// onToggle     (key, nextOpenKeys) => void
h(Accordion, {
  items: [
    { key: 'faq-1', title: 'What is FluxaWay?',     children: h('p', null, 'A no-build ESM-native framework.') },
    { key: 'faq-2', title: 'Is it free?',        children: h('p', null, 'Yes, MIT licensed.') },
    { key: 'faq-3', title: 'Disabled panel',     children: h('p', null, 'Never seen.'), disabled: true },
  ],
  defaultOpen: 'faq-1',
})

// Controlled + multiple
const [open, setOpen] = useState(['faq-1']);
h(Accordion, {
  items: FAQ_ITEMS,
  multiple: true,
  open,
  onToggle: (_key, nextKeys) => setOpen(nextKeys),
})

// EmptyState
h(EmptyState, {
  title: 'No results',
  description: 'Try adjusting the filters.',
})

// Table
h(Table, {
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'E-mail' },
    { key: 'role', header: 'Role', align: 'right' },
  ],
  rows: [
    { id: 1, name: 'Ana', email: 'ana@ex.com', role: 'Admin' },
    { id: 2, name: 'Bruno', email: 'b@ex.com', role: 'User' },
  ],
  sortable: true,
  getRowKey: (row) => row.id,
})

// DataTable — Table + Pagination combined: sorts the full row set, then
// renders only the current page (Table alone can't paginate — its sort
// state is internal, invisible to whatever would need to slice by page).
// Same columns shape as Table.
h(DataTable, {
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'E-mail' },
  ],
  rows: allUsers,       // full, unsliced data
  pageSize: 10,         // rows per page
  sortable: true,       // default
  onSort: (sort) => console.log(sort),       // { key, dir }
  onPageChange: (page) => console.log(page),
})
// Pagination footer only renders when rows.length > pageSize. page/onPageChange
// let you control the current page; omit page for uncontrolled (starts at 1).
```

### Form

```js
// FormField — label + input + help/error wrapper
h(FormField, { label: 'Name', help: 'Optional', error: '' },
  h('input', { className: 'm-field', type: 'text' })
)
// With no `id` and a single input/select/textarea/button child, FormField wires
// it for you: the child gets an id (its own, or a generated one), the label's
// `for`, and aria-describedby/aria-invalid for help and error. When the control
// sits inside a wrapper, pass the same id to both:
h(FormField, { id: 'price', label: 'Price' },
  h('div', { className: 'price-row' }, h('input', { id: 'price', className: 'm-field' }), ' USD')
)

// How a field's error reaches the DOM, for tests and for your own CSS. While
// `error` is non-empty, every form control (TextField, Textarea, Select,
// Checkbox, Radio, RadioGroup, Slider, RangeSlider, NumberInput, DatePicker,
// TimePicker, and a control FormField wires) renders
//   <p class="m-error" id="{id}-error">message</p>
// and gives the control aria-invalid="true" with that id in aria-describedby
// (for RadioGroup, the role="radiogroup" element). {id} is yours or a
// generated one. When `error` goes back to '', the line and aria-invalid are
// removed. Query `#email-error`, `.m-error` or `[aria-invalid="true"]`; the
// line has no role="alert".

// TextField
h(TextField, {
  label: 'E-mail',
  type: 'email',           // 'text' | 'email' | 'password' | 'number' | 'search' | 'tel'
  placeholder: 'Type...',
  value: state,
  onInput: (e) => setState(e.target.value),
  disabled: false,
  required: false,
  error: 'Required field',
  help: 'Help text',
})
// `help` and `error` show TOGETHER (help first, error below it) and both ids go
// into the input's aria-describedby — true for every field component and
// FormField. To swap one for the other, do it yourself: help: error ? '' : '…'.

// Textarea
h(Textarea, {
  label: 'Description',
  rows: 4,
  value, onInput,
  disabled, error, help,
})

// Select
h(Select, {
  label: 'Plan',
  value: 'pro',
  options: [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
  ],
  onChange: (e) => setPlan(e.target.value),
  disabled: false,
  error: '',
})
// The dropdown body is token-styled out of the box. On engines with
// customizable-select support (Chromium, WebKit) and a fine pointer, the
// stylesheet opts into `appearance: base-select` so the whole picker uses
// --m-surface/--m-border/--m-radius plus a --m-primary-soft checked row.
// Firefox and touch devices keep the native picker with tinted options.
// Do not re-style the picker per app — the tokens already theme it.

// Checkbox
h(Checkbox, {
  label: 'I accept the terms',
  checked: agreed,
  onChange: (e) => setAgreed(e.target.checked),
  disabled: false,
})

// Switch
h(Switch, {
  label: 'Notifications',
  checked: enabled,
  onChange: (e) => setEnabled(e.target.checked),
})

// Combobox — searchable select with dropdown
h(Combobox, {
  label: 'Country',
  value: selected,
  onChange: (val) => setSelected(val),
  options: [
    { value: 'br', label: 'Brazil' },
    { value: 'pt', label: 'Portugal' },
  ],
  placeholder: 'Select...',
  searchPlaceholder: 'Search...',
  error: '',
})
// a11y: ArrowUp/ArrowDown/Home/End/Enter drive selection via
// aria-activedescendant (no real DOM focus moves off the search input);
// Escape closes and returns focus to the trigger button.

// FileDropZone — drag-and-drop file upload area
h(FileDropZone, {
  onFiles: (files) => upload(files),  // files: File[]
  accept: 'image/*',                  // optional MIME filter
  multiple: true,
  label: 'Drop files here or click to browse',
  hint: 'PNG, JPG up to 10 MB',
  progress: 60,                       // 0–100, shows Progress bar when set
  disabled: false,
})

// DatePicker — trigger button + one-month calendar popover
h(DatePicker, {
  label: 'Start date',
  value: startDate,          // "YYYY-MM-DD" | null
  onChange: (iso) => setStartDate(iso),
  min: '2026-01-01',         // optional "YYYY-MM-DD" bounds, inclusive
  max: '2026-12-31',
  placeholder: 'Select a date',
})
// a11y: roving tabindex over the day grid — ArrowLeft/Right/Up/Down move by
// day/week (panning the calendar across month boundaries as needed),
// Home/End jump to the start/end of the focused week, Enter/Space selects,
// Escape closes and returns focus to the trigger button.

// CodeEditor — thin wrapper for CodeMirror or Monaco (whichever is on window)
h(CodeEditor, {
  value: code,
  onChange: (v) => setCode(v),
  mode: 'javascript',   // language mode
  theme: 'default',
  options: {},          // passed through to the underlying editor
})

// Slider — wraps a native <input type="range"> (free keyboard support)
h(Slider, {
  label: 'Volume',
  min: 0, max: 100, step: 1,
  value: volume,
  onInput: (e) => setVolume(Number(e.target.value)),
  showValue: true,   // shows the current numeric value next to the track
})

// RangeSlider — dual-thumb range, value/onChange use a [lower, upper] tuple
h(RangeSlider, {
  label: 'Price range',
  min: 0, max: 1000, step: 10,
  value: [priceMin, priceMax],
  onChange: ([lo, hi]) => { setPriceMin(lo); setPriceMax(hi); },
  showValue: true,
})
// Each thumb clamps against the other (lower can never cross upper) and has
// its own aria-label ("Minimum"/"Maximum" by default, override with
// minLabel/maxLabel) since there's no single native element to label both.

// RadioGroup — "choose one of N" with visible options (use Select for long lists)
h(RadioGroup, {
  id: 'size',
  label: 'Size',
  value: size,                 // controlled
  onChange: (v) => setSize(v),
  inline: false,               // true = options laid out horizontally
  options: [
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large', disabled: true },
  ],
})
// Native radios under the hood — Arrow-key roving comes for free. The group
// shares `name` (defaults to `id`); label/help/error match the other fields.

// Radio — single option, same anatomy as Checkbox (rarely needed alone)
h(Radio, { id: 'r1', label: 'Accept', checked, onChange: fn })

// NumberInput — numeric TextField with −/+ steppers
h(NumberInput, {
  id: 'qty',
  label: 'Quantity',
  min: 0, max: 99, step: 1,
  value: qty,                       // number | null (null = cleared field)
  onChange: (n) => setQty(n),
})
// Steppers clamp at min/max and round to the step's precision (no float
// drift with step: 0.1); ArrowUp/Down on the input come from the native
// number input. A typed value passes through onChange as-is while editing and
// is clamped to min/max on blur (one more onChange with the clamped number).

// TimePicker — trigger + listbox of "HH:MM" options every `step` minutes
h(TimePicker, {
  id: 'start',
  label: 'Start time',
  value: start,              // "HH:MM" | null
  onChange: (t) => setStart(t),
  min: '08:00', max: '18:00',
  step: 30,                  // minutes between options
})
// a11y: opening focuses the selected option; ArrowUp/Down/Home/End move,
// Enter selects, Escape closes and returns focus to the trigger.
```

### Feedback


```js
// Alert
h(Alert, {
  variant: 'info',    // 'info' | 'success' | 'warning' | 'danger'
  title: 'Attention',
}, 'Alert message')
// Already has role="status" (announced politely) — do not wrap it in a live
// region. Pass role: 'alert' for an error that must interrupt. `title` renders a
// <strong>, not a heading: it stays out of the page's heading outline.
// It has NO close button and no `onClose` / `dismissible` prop: it shows for as
// long as you render it. To dismiss it, keep a boolean in state and stop
// rendering it (`sent && h(Alert, …)`); for an ✕, put your own IconButton in the
// children. For a message that leaves by itself, use useToast() instead.

// Spinner
h(Spinner, { label: 'Loading...' })

// Progress
h(Progress, {
  value: 60,
  max: 100,
  label: 'Upload',
  showValue: true,    // shows percentage
})

// Toast — inline notification, always visible when open: true
h(Toast, {
  open: true,
  variant: 'success', // 'info' | 'success' | 'warning' | 'danger'
  title: 'Saved!',
  message: 'Your changes have been saved.',
  onClose: () => setOpen(false),
})

// ToastStack — floating toast container (place once near root)
// Use with useToast() hook
h(ToastStack, { toasts, onClose: (id) => removeToast(id) })

// Skeleton — loading placeholder (pairs with useFetch's loading state)
h(Skeleton, { width: 240, height: 16 })                 // rect
h(Skeleton, { variant: 'circle', width: 40, height: 40 })
h(Skeleton, { variant: 'text', lines: 3 })              // paragraph stub
// Decorative only (aria-hidden) — announce loading on the region itself.

// Stat / StatGrid — KPI tiles
h(StatGrid, null,
  h(Stat, { value: '1.2k', label: 'Users', delta: '+12%' }),
  h(Stat, { value: '37',   label: 'Churn', delta: '-3%', icon: '📉' }),
  h(Stat, { value: '99.9%', label: 'Uptime', help: 'last 30 days' }),
)
// delta colors itself by its leading sign (+ green, − red).
```

### Navigation

```js
// Tabs
h(Tabs, {
  value: activeTab,
  onChange: (val) => setActiveTab(val),
  items: [
    { value: 'overview', label: 'Overview' },
    { value: 'settings', label: 'Settings' },
    { value: 'logs',     label: 'Logs', disabled: true },   // optional
  ],
  // className: 'm-tabs-pills',   // optional — filled "pill" style instead of underline
})
// Tabs renders ONLY the horizontal tab strip (it is the role="tablist" element);
// the strip scrolls sideways when it does not fit. Put each TabPanel after it.
// TabPanel — renders children only when active
h(TabPanel, { id: 'overview', activeId: activeTab },
  h('p', null, 'Overview content')
)
// a11y: roving tabindex (only the active tab is in the Tab order),
// ArrowLeft/ArrowRight/Home/End move focus + selection together
// ("automatic activation"). Each tab/panel pair is linked via
// aria-controls/aria-labelledby using `${value}`/`${id}` — no extra prop.

// Navbar
h(Navbar, {
  brand: 'My App',
  items: [
    { label: 'Home',     href: '/',         active: true },
    { label: 'Projects', href: '/projects' },
    { label: 'Contact',  href: '/contact'  },
  ],
  actions: h(Button, { variant: 'tonal' }, 'Login'),
})
// brand: a string or any VNode (a logo <img>, an <a> you build). It is rendered
//   as given — NOT turned into a link; pass h('a', { href: '#top' }, 'My App')
//   if you want one.
// items[].href is passed through UNTOUCHED, like Button's: wrap a URL you did
//   not write yourself in safeUrl(). A missing href becomes '#'.
// items[].active is yours alone — the Navbar never sets it. A link that looks
//   lit right after a click is only `:hover` (the pointer is still on it). On a
//   one-page site either track the current section yourself or leave it out.
// `items` AND `actions` collapse together behind a ☰ button below 768px — and
// from 768px up for as long as the links do not fit on one line beside the brand.
// The bar measures that itself: the labels, the brand, the `actions`, the font
// and the bar's own width all count, so there is no breakpoint to choose and no
// prop for one. It never wraps onto a second line, with any number of links.
// Do NOT shrink the brand, drop a link or write a media query to make the links
// fit, and do not switch layouts on the viewport width yourself — add the items
// you need and let the bar decide.
// A ThemeToggle or Login button in `actions` moves inside the menu. Whatever must
// stay on the bar while it is collapsed goes in `brand`, not `actions`. Collapsed
// means hidden: nothing inside takes keyboard focus or is read out, yet `actions`
// stay MOUNTED (a ThemeToggle there keeps applying the theme). Do not mount and
// unmount `items` / `actions` yourself with useMediaQuery to "fix" focus.
// Uncontrolled by default (`defaultOpen: false`). Controlled: pass `open` and
//   onToggle(nextOpen: boolean) — called with !open by the ☰, and with false by
//   Escape, by a press outside the bar, and by a click on any item (at every
//   width, also when the menu is already closed).
// The closed bar is 60px tall at every width, full-width, with 16px side padding
// (24px from 768px). Keep it as wide as its container (the default): in a parent
// that shrinks to its content the bar has no width of its own to measure against.
// To line the brand and links up with a centred content column, keep the bar
// full-bleed and move the padding — `className` lands on the <nav>. The bar has
// to clear TWO things: how far the shell is inset by being centred, AND the
// shell's own side padding, because `box-sizing: border-box` (§11) puts that
// padding inside its max-width. Add them:
//   .a-shell { max-width: 1120px; margin-inline: auto; padding-inline: var(--m-space-4); }
//   h(Navbar, { className: 'a-nav', … })
//   .a-nav { padding-inline: max(var(--m-space-4), calc((100% - 1120px) / 2 + var(--m-space-4))); }
//   /* 1120px = your shell's max-width; var(--m-space-4) = ITS side padding,
//      written twice on purpose — change the shell's and change both here. */
// Dropping the second `+ var(--m-space-4)` lines the brand up with the shell's
// outer edge instead of its text, which is 16px off at every width WIDER than
// the shell and exact below it — so a phone screenshot will not show it.
// How many links fit, measured with a ~125px brand and a ThemeToggle in
// `actions`, labels of 5-11 characters at the default font: 5 links ride the bar
// from 768px, 6 from ~820px, 7 from ~900px. Roughly 100px per link, plus the
// brand and the actions. Below that the ☰ takes over — which is correct, not a
// layout to fix. Use it to judge what a menu item costs, never as a breakpoint.
// The mobile menu is IN-FLOW: it pushes the page down instead of covering it.
// Anchor links (`href: '#contact'`) are safe with a sticky header
// and `scroll-behavior: smooth`: a tapped link closes the menu in the same
// frame, so the section lands where it should. For a sticky header wrap it
// yourself and reserve its height for anchors:
//   header { position: sticky; top: 0; z-index: var(--m-z-appbar); }
//   html   { scroll-padding-top: 60px; }        /* the closed Navbar's height, at any width */
// 60px is the bar alone, its own bottom border included. Reserve the height of
// what is sticky: a border, padding or second row on YOUR <header> adds to it
// (`border-bottom: 1px` on the header → 61px).
// Do NOT rebuild the menu as a position:fixed/absolute overlay to work around
// scrolling — that was only needed before this was fixed.

// AppBar — sticky top bar
h(AppBar, {
  title: 'Dashboard',
  leading: h(IconButton, { label: 'Menu', onClick: openDrawer }, '☰'),
  actions: h(IconButton, { label: 'Profile' }, '👤'),
})

// BottomNav — mobile bottom navigation
h(BottomNav, {
  value: currentTab,
  onChange: (val) => setCurrentTab(val),
  items: [
    { value: 'home',    label: 'Home',    icon: '🏠' },
    { value: 'search',  label: 'Search',  icon: '🔍' },
    { value: 'profile', label: 'Profile', icon: '👤' },
  ],
})

// ThemeToggle — icon button that calls useTheme().toggleTheme()
h(ThemeToggle)  // renders sun/moon SVG icon; switchToLightLabel / switchToDarkLabel set its spoken name

// PaletteSwitcher — row of color swatches, calls usePalette().setPalette()
h(PaletteSwitcher)  // no props required

// DesignSwitcher — chip toggle, calls useDesign().setDesign()
// Optional choices require their companion Bootstrap or Metallic stylesheet.
h(DesignSwitcher)  // no props required

// Sidebar nav links — CSS-only, use inside .m-sidebar
h('nav', { className: 'm-sidebar-section' },
  h('p', { className: 'm-sidebar-label' }, 'Main'),
  h('a', { className: 'm-sidebar-link m-sidebar-link-active', href: '/dashboard' },
    h('span', { className: 'm-sidebar-link-icon' }, '⊞'),
    'Dashboard',
  ),
  h('a', { className: 'm-sidebar-link', href: '/projects' },
    h('span', { className: 'm-sidebar-link-icon' }, '◫'),
    'Projects',
    h('span', { className: 'm-sidebar-link-badge m-badge' }, '3'),
  ),
)

// SwipeableListItem — swipe (touch, pen) or drag (mouse) left to reveal actions
h(SwipeableListItem, {
  actions: [
    { label: 'Delete', className: 'm-swipeable-action-danger', onClick: del },
    { label: 'Archive', onClick: archive },
  ],
  actionWidth: 72,  // px per action button
},
  h('div', { className: 'list-row' }, 'Row content')
)
// a11y: the actions are real buttons behind the row — tabbing to one reveals
// them (the keyboard alternative to the swipe) and focus moving on hides them.
// An action with `icon` shows only the icon; ALWAYS pass `label` too, it becomes
// the button's aria-label.

// Stepper
h(Stepper, {
  activeStep: 1,             // 0-based index
  orientation: 'horizontal', // 'horizontal' | 'vertical'
  steps: [
    { label: 'Details',      description: 'Name and e-mail' },
    { label: 'Address',      description: 'Zip code and city' },
    { label: 'Confirmation' },
  ],
})

// Pagination
h(Pagination, {
  page: 3,
  total: 12,
  onChange: (p) => setPage(p),
})

// Breadcrumb — ancestors are links, the last item is the current page
h(Breadcrumb, {
  items: [
    { label: 'Home', href: '#/' },
    { label: 'Projects', href: '#/projects' },
    { label: 'FluxaWay' },                       // current — aria-current="page"
  ],
  separator: '/',                            // optional
})

// TreeView — WAI-ARIA tree over `{ id, label, icon?, children? }` nodes
h(TreeView, {
  items: [
    { id: 'src', label: 'src', children: [
        { id: 'app', label: 'app.js' },
        { id: 'data', label: 'data.js' },
      ] },
    { id: 'readme', label: 'README.md' },
  ],
  selected: selectedId,                      // selection is controlled
  onSelect: (id, node) => setSelectedId(id),
  defaultExpanded: ['src'],                  // uncontrolled expansion…
  // expanded + onExpandedChange              // …or controlled
})
// a11y: roving tabindex over visible nodes — ArrowUp/Down walk, ArrowRight
// expands/enters a branch, ArrowLeft collapses/climbs to the parent,
// Home/End jump, Enter/Space select. Caret clicks toggle without selecting.
```

### Overlay

```js
// Dialog — modal
h(Dialog, {
  open: isOpen,
  onClose: () => setOpen(false),
  title: 'Confirm deletion',
},
  h('p', null, 'This action cannot be undone.'),
  h(Button, { variant: 'danger', onClick: doDelete }, 'Delete'),
)

// Drawer — side panel
h(Drawer, {
  open: drawerOpen,
  onClose: () => setDrawerOpen(false),
  side: 'left',   // 'left' | 'right'
  title: 'Menu',
},
  h('nav', null, /* nav items */)
)

// BottomSheet
h(BottomSheet, {
  open,
  onClose,
  title: 'Options',
}, /* content */)
// a11y: same modal focus lifecycle as Dialog/Drawer — initial focus on
// open, Tab is trapped inside, focus restores to the invoking element on close.

// Dropdown
h(Dropdown, {
  open: dropOpen,
  onClose: () => setDropOpen(false),
  trigger: h(Button, { onClick: () => setDropOpen(true) }, 'Actions'),
  items: [
    { label: 'Edit', onClick: edit },
    { label: 'Delete', onClick: del, danger: true },
  ],
})
// a11y: opening focuses the first item; ArrowUp/ArrowDown/Home/End move
// through items; Tab closes the menu (non-modal — focus is meant to leave).

// Menu — like Dropdown, but items can nest a `children` array to open a
// flyout submenu (any depth). Manages its own open state internally, same
// as Dropdown — no open/onClose props.
h(Menu, {
  trigger: h(Button, null, 'File'),
  items: [
    { label: 'New', onClick: fn },
    { label: 'Open Recent', children: [
        { label: 'project-a.js', onClick: fn },
        { label: 'project-b.js', onClick: fn },
      ] },
    { divider: true },
    { label: 'Exit', onClick: fn, danger: true },
  ],
})
// a11y: same base interaction as Dropdown (initial focus, arrow-key nav,
// Tab/Escape close everything). Additionally: hovering an item with
// `children` opens its submenu; ArrowRight, Enter or Space on it opens the
// submenu and focuses its first item; a pointer click toggles it. ArrowLeft
// closes that submenu and returns focus to the parent item. Only one submenu
// per level is open at a time.

// Tooltip
h(Tooltip, { content: 'Click to save' },
  h(Button, null, 'Save')
)
// a11y: the tooltip text is a real element (role="tooltip") referenced by
// the wrapped trigger's aria-describedby (cloned onto it automatically when
// there's a single element child); Escape dismisses it.

// ContextMenu — right-click context menu (pair with useContextMenu hook)
const { menu, openMenu, closeMenu } = useContextMenu();
h('div', { onContextMenu: openMenu },
  'Right-click me',
  h(ContextMenu, {
    open: menu.open,
    x: menu.x,
    y: menu.y,
    onClose: closeMenu,
    ariaLabel: 'Row actions', // optional, defaults to "Context menu"
    items: [
      { label: 'Edit',   icon: '✏️', onClick: edit },
      { divider: true },
      { label: 'Delete', icon: '🗑️', onClick: del, danger: true },
    ],
  }),
)
// a11y: same as Dropdown (initial focus, arrow-key nav, Tab closes), plus
// focus restores to whatever invoked the menu when it closes.

// Popover — generic anchored panel for arbitrary interactive content
// (Tooltip = text on hover; Dropdown/Menu = action lists; Popover = the rest)
h(Popover, {
  id: 'filters',
  trigger: h(Button, { variant: 'tonal' }, 'Filters'),
  placement: 'bottom',   // 'top' | 'bottom' | 'left' | 'right'
  title: 'Filter results',
},
  h(Checkbox, { id: 'f1', label: 'Only active' }),
  h(Button, { variant: 'contained' }, 'Apply'),
)
// Manages its own open state. Escape and outside clicks close it (Escape
// also refocuses the trigger); Tab is NOT trapped — it's not a modal.

// CommandPalette — Ctrl/Cmd-K launcher, controlled like Dialog
h(CommandPalette, {
  open: paletteOpen,
  onClose: () => setPaletteOpen(false),
  commands: [
    { id: 'new',   label: 'New file',     section: 'Files', hint: 'Ctrl+N', onSelect: fn },
    { id: 'theme', label: 'Toggle theme', section: 'View',  keywords: ['dark'], onSelect: fn },
  ],
})
// Bind the global shortcut in the app (document keydown → setPaletteOpen);
// the palette only handles what happens while it's open. Filtering is a
// substring match over label/hint/section/keywords. The input keeps focus
// and drives the list via aria-activedescendant — ArrowUp/Down move the
// active option, Enter runs it (then closes), Escape closes.
```

---

## 10. Canvas, Charts, Editor & Motion Add-ons

Optional add-ons, each its own `dist/fluxaway-<name>.js` (+ `.css` where noted) —
**not** part of `fluxaway-components.js`, import them directly. Full prop tables
and a longer walkthrough live in the README's "Canvas & Editor" section;
this is the quick-reference version so an agent that only loads this file
still knows the API exists and how to call it.

**Routing reminder** (same table as §1): spatial presentation / camera tour →
**ZoomStage**; fixed-stage Flash-style deck / animation / intro / keyframes →
**fluxaway-motion**;
node graph / flowchart / pipeline → **PipelineCanvas**; chart / dashboard /
KPI → **fluxaway-charts**; embedded code editor → **FullCodeEditor**. These
are first-party — never substitute reveal.js, GSAP, mermaid, Chart.js, D3 or
CodeMirror-from-CDN when the task fits an add-on. Working references:
`examples/fluxaway-architecture` and
`examples/fluxaway-atlas` (presentations), `examples/fluxaway-motion`,
`examples/motion-landing`, `examples/inox-landing` and
`examples/motion-editor` (animation),
`examples/star-atlas` (free-zoom explorer), `examples/dashboard` and
`examples/drug-recalls` (charts). **PipelineCanvas and
FullCodeEditor currently have no example app** — their APIs below and the
README's "Canvas & Editor" section are the reference (`examples/mindmap` is a
hand-rolled SVG mindmap, *not* a PipelineCanvas demo).

### `fluxaway-motion` — Flash-style timeline animation

`dist/fluxaway-motion.js` (no CSS file — it animates inline `transform`/`opacity`).
The Macromedia Flash mental model on browser primitives: a timeline with
keyframes and tweens, labels, frame scripts, and `play() / stop() /
gotoAndPlay() / gotoAndStop()`. One `requestAnimationFrame` ticker per
timeline; only `transform` and `opacity` are tweened (GPU-friendly).

```js
import { useTimeline, createTimeline, easings, stagger } from "/dist/fluxaway-motion.js";

function Intro() {
  const tl = useTimeline({
    duration: 3000,            // ms; inferred from the last keyframe if omitted
    loop: false,               // true = forever, n = extra passes
    labels: { voo: 500 },
    tracks: {
      logo: [
        { at: 0,   x: -200, opacity: 0 },
        { at: 500, x: 0,    opacity: 1, ease: "outBack" },
        { at: 2500, rotate: 360,        ease: "inOutCubic" },
      ],
    },
    onFrame: { voo: () => somDeEntrada() },  // frame scripts (ms or label keys)
    onComplete: () => setDone(true),
  });

  return h("div", null,
    h("img", { ref: tl.track("logo"), src: "logo.png" }),  // bind via ref
    h("button", { onClick: () => tl.gotoAndPlay("voo") }, "Replay"),
  );
}
```

- **Keyframes**: `{ at: ms, x?, y?, scale?, scaleX?, scaleY?, rotate?, skewX?,
  skewY?, opacity?, color?, backgroundColor?, fill?, stroke?, path?, orient?,
  set?, ease? }` — x/y in px, angles in deg. `ease` names how the playhead
  ARRIVES at that keyframe; a property absent from a keyframe tweens straight
  through it (per-property tracks).
- **Color tweens**: `color`/`backgroundColor`/`fill`/`stroke` interpolate per
  RGBA channel; values are hex (`#rgb`, `#rrggbb`, `#rrggbbaa`) or
  `rgb()`/`rgba()` strings (parsed at compile time).
- **Motion guides** (Flash's motion guide layer): `path: "M 0 0 C ..."` on a
  keyframe makes the element follow that SVG path from the PREVIOUS keyframe
  to this one; the curve's start/end become x/y keyframes so surrounding
  tweens continue seamlessly. `orient: true` rotates along the tangent
  (Flash's "orient to path") and HOLDS the boundary tangent outside the span
  when the track keys no explicit `rotate`. Contract: inside the span the
  curve owns x/y — if you also key x/y at the guide's own keyframe, make
  them match the curve's endpoint or the element jumps at the boundary
  (likewise, back-to-back guides should join end-to-start).
- **Frame-by-frame**: `set: { styleProp: value }` applies styles DISCRETELY
  at the keyframe and holds them until the next `set` (no tween) — sprite
  sheets via `backgroundPosition` steps, visibility flips, class-free state.
- **Easings**: the classic Penner set (written for Flash!): `linear`,
  `in/out/inOutQuad`, `in/out/inOutCubic`, `in/out/inOutBack`, `outElastic`,
  `outBounce` — exported as `easings`.
- **Controller**: `play`, `stop`, `gotoAndPlay(msOrLabel)`,
  `gotoAndStop(msOrLabel)`, `seek`, `reverse()`, `setSpeed(n)`,
  `track(name)` → ref, `time`, `duration`, `isPlaying`, `label(name)`,
  `destroy`.
- **Frame scripts** fire when the playhead crosses them while playing
  (direction-aware); `gotoAndPlay` also executes a script sitting exactly on
  the target (as Flash did); plain seeks fire nothing.
- **MovieClips**: a child component with its own `useTimeline` is a movie
  clip — nest freely, each ticks independently (see `examples/fluxaway-motion`'s
  pulsing ring).
- **`stagger(keyframes, eachMs, index)`** shifts a keyframe list for cascade
  entrances. `createTimeline(spec)` is the imperative, hook-free variant
  (call `destroy()` yourself). `useTimeline` captures its spec on first
  render (like `createLazy` — treat it as static) and autoplays on mount
  unless `autoplay: false`.
- **A loop must close its own motion.** For every continuously animated
  property, the last visual state must equal the first visual state before the
  playhead wraps. If a sequence is left → center → right → center, add the
  center → left return leg; otherwise `loop: true` teleports from center to
  left at the boundary. Repeat a keyframe to create a deliberate pause, then
  finish the return path. This contract applies to transform, opacity, color
  and discrete `set` state — either close them all or make an instantaneous
  reset an explicit part of the design.
- **Explicit duration must include stagger.** `stagger()` moves the final
  keyframe by `index * eachMs`; it does not extend an explicit `duration`.
  For `count` tracks whose unshifted last key is at `endMs`, the minimum
  duration is `endMs + (count - 1) * eachMs`. At that time every staggered
  track must have reached the same state it holds at the beginning of the
  next pass. Test at least one complete wrap in a real browser; a still image
  or a partial playthrough cannot reveal a seam.
- **Compositor promotion**: while a timeline moves, each tracked element is
  promoted to its own GPU layer (`will-change` + `translate3d`) for a smooth
  tween, then **de-promoted at rest** (an identity transform becomes `none`
  and the `will-change` hint is released). So do **not** animate `x`/`y`/
  `scale` on a very large node — a full `ZoomStage` frame, or an SVG wider/
  taller than ~4096px. While it animates it becomes a layer bigger than the
  GPU's max texture, which the browser must tile; the tiles blank out and
  flicker when an ancestor (like `ZoomStage`'s world) is scaled at the same
  time. Animate its `opacity` instead, or animate a small child element.

Full showcase: `examples/fluxaway-motion` — preloader, flying logo, letter
cascade, SKIP INTRO, scrubber and scene-jump deck. Visual authoring:
`examples/motion-editor` — a Flash-IDE-style timeline editor (draggable
keyframe diamonds with multi-selection, undo/redo via `useHistory`, motion
guides drawn by clicking on the stage, scrubbing, inspector, live
`useTimeline` code export). `examples/motion-presentation` is the canonical
Motion-only presentation: four overlapping scenes share one labelled master
timeline, frame scripts keep navigation state synchronized, a nested MovieClip
runs independently, and the fixed stage is recomposed for mobile without
ZoomStage. For a production-shaped composition, see
`examples/inox-landing`: an Inox landing page with independent in-view reveals,
an inspection scanner, a replayable three-state mechanical assembly and a
staggered alloy seal whose final left-edge state closes its infinite loop.

### `PipelineCanvas`

`dist/fluxaway-canvas.js` + `dist/fluxaway-canvas.css`. An SVG-based node/pipeline
editor: drag nodes, draw connections, pan and zoom, mini-map, undo/redo.

| Prop | Description |
|---|---|
| `nodes` | Array of node descriptors to render |
| `onNodeEdit` / `onNodeDelete` / `onNodeMove` | Node lifecycle callbacks |
| `onNodeConnect` / `onConnectionDelete` | Edge lifecycle callbacks |
| `onContextMenu` | Right-click handler — pair with `useContextMenu` + `ContextMenu` |

```js
import { PipelineCanvas } from "/dist/fluxaway-canvas.js";

h(PipelineCanvas, {
  nodes,
  onNodeMove: (id, x, y) => moveNode(id, x, y),
  onNodeConnect: (fromId, toId) => connect(fromId, toId),
})
```

### `ZoomStage`

`dist/fluxaway-zoom.js` + `dist/fluxaway-zoom.css` (types in `dist/fluxaway-zoom.d.ts`). A
pan/zoom presentation, in the style of non-linear zooming presentation tools:
every frame's `content` is normal FluxaWay vdom, positioned with plain CSS on one
large shared canvas (all frames are mounted at once) — only the *camera* is
imperative, easing pan/zoom/rotate between frames via `requestAnimationFrame`.
The visible surface and camera target are independent: a camera still fits a
rectangular viewport, but the subject may be frameless, circular, pill-shaped or
custom-clipped instead of looking like a slide.
Navigation respects `prefers-reduced-motion` (it jumps instead of animating).
ZoomStage v2 is an in-place, backward-compatible expansion of the same module:
existing v1 frame descriptors and props remain valid; there is no separate v2
import or migration package.

| Prop | Description |
|---|---|
| `frames` | Array of `{ id, x, y, w, h, rotate?, camera?, transition?, surface?, shape?, clipPath?, label?, content?, render? }`; `render(state)` receives `idle` / `departing` / `arriving` / `settled` without a per-animation-frame render |
| `path` | Array of frame ids for navigation order — defaults to `frames` order |
| `index` / `defaultIndex` / `onIndexChange` | Controlled/uncontrolled current frame |
| `duration` / `easing` | Camera animation duration (`number` or `"auto"`) and easing function; automatic timing uses travel, zoom and rotation distance |
| `transition` | `"glide"`, `"arc"`, `"dolly"`, `"orbit"`, `"focus"`, `"cut"`, an options object, or `({ from, to }) => options`; a destination frame may override it |
| `padding` | Viewport-margin fraction (0–0.45) kept around each framed frame (default `0.06`; `0` fills the viewport) |
| `controllerRef` | ref, set to `{ next, prev, goTo, reset, fitAll, zoomIn, zoomOut, prepare, index, settledIndex, moving, frames }` every render |
| `keyboardNav` | Arrow/Space step, Home/End jump to first/last (default `true`); with `freeZoom`, `+`/`-` zoom and `0`/`Esc` recenter; ignores keys typed into inputs, `<select>` and contentEditable |
| `advanceOnClick` | Tap the stage background to advance (default `true`) — a drag/pan/swipe never counts as a tap |
| `swipeNav` | Horizontal swipe steps frames on touch/pen (default `true`; a `freeZoom` drag pans instead) |
| `freeZoom` | Wheel/pinch to zoom toward the cursor and drag to pan freely, with flick momentum (default `false`); double-click zooms toward the point when `advanceOnClick` is off |
| `minZoom` / `maxZoom` | `freeZoom` scale bounds as multiples of the frame fit (defaults `0.2` / `12`) |
| `autoplay` | Auto-advance the frames; a number sets the interval ms (default `4000`), looping back to the first |
| `hashNav` | Sync the current frame id to `location.hash` for deep-linking (default `false`) |
| `onInteract` | `() => void`, fired when the user first grabs the camera (wheel/pinch/drag) — e.g. to pause an `autoplay` tour |
| `onTransitionStart` / `onTransitionEnd` | Flight lifecycle with `{ from, to, preset, duration }`; use settlement, not selection, to start expensive content motion |
| `onSettledIndexChange` | Destination index after the camera has actually arrived |
| `preload` | `"adjacent"` (default), `"all"` or `false`; requests image decode around the selected frame so a lazy image does not flash during arrival |
| `ariaLabel` | Accessible name for the whole stage |

```js
import { ZoomStage } from "/dist/fluxaway-zoom.js";

h(ZoomStage, {
  frames,
  index,
  onIndexChange: setIndex,
  controllerRef,
  duration: "auto",
  transition: "arc",
  freeZoom: true, // scroll/pinch to zoom, drag to roam
})
```

Camera movement is a small, deliberate grammar rather than a random effect
picker. `glide` is direct and technical; `arc` curves the world-space centre;
`dolly` creates depth by pulling back at mid-flight; `orbit` adds a restrained
curved route and camera roll; `focus` commits attention through a small scale
overshoot; `cut` jumps (and is also the reduced-motion result). Scale is
interpolated logarithmically, so large zoom changes do not feel hard at one end.

```js
const frame = {
  id: "sensor",
  x: 1200, y: 300, w: 900, h: 620,
  surface: "none",
  shape: "circle",
  // Fit this local instrument instead of the whole visible scene.
  camera: { x: 1450, y: 470, w: 320, h: 260, padding: 0.14 },
  transition: { preset: "dolly", duration: "auto", lift: 0.2 },
  render: ({ phase, settled }) => h(SensorScene, { phase, active: settled }),
};
```

`onIndexChange` still reports selection immediately for navigation UI.
`onSettledIndexChange` and `frame.render(state)` report when the camera is truly
there. Never reset an incoming frame's Motion timeline merely because it became
selected: doing that blanks content while the camera is still travelling and
looks like a transition flicker. Start its entrance at `settled`, keep departing
content in its readable resting state, and preload adjacent imagery. For an
image-led scene, prepare the incoming timeline at its first frame during
`arriving` and cover it with a lightweight blurred preview of the decoded image.
Fade and deblur that preview only after `settled` starts the real entrance. This
prevents the finished composition from flashing for one paint before an effect
rewinds the timeline; do not apply the blur to the complete ZoomStage world.

#### ZoomStage composition and viewport contract

A technically correct camera fit is not automatically a good composition.
Author every destination as a measured viewport, not as a collection of objects
that happen to exist in world space. These rules are required for generated
ZoomStage applications:

- **Define the usable viewport first.** Fixed headers, navigation rails,
  captions and safe-area insets consume real space. Either keep the stage out of
  that chrome with CSS (`inset-block-end`, for example), or make the frame's
  `camera` target and `padding` leave equivalent clearance. A surface touching
  the top of a fixed rail is a layout failure even when no pixels overlap.
- **Build one proportional geometry system.** Choose a small family of frame
  dimensions/aspect ratios, shared content insets and visible alignment axes.
  Titles, media, readouts and navigation should recur on those axes. Place
  frames relative to that system; do not accumulate unrelated `x`/`y` values
  and then repair each destination with arbitrary child offsets.
- **Separate world geometry, visible surface and camera target.** `x`/`y`/`w`/`h`
  describe where a frame lives; `shape`/`clipPath` describe what is painted;
  `frame.camera` describes what the viewer must see. Use an independent camera
  target for optical centering or for a subject smaller than its surrounding
  artwork. Prefer a modest per-frame `padding` adjustment over scaling or
  translating every child to fix a bad fit.
- **Keep semantic content inside the shape's safe area.** The usable width of a
  circle, pill or polygon narrows near its top and bottom. Put headings and body
  copy in an inner rectangular safe zone, or clip only the artwork layer while
  leaving semantic content outside the decorative clip. Never rely on
  `overflow: hidden` to conceal text that did not fit.
- **Budget the complete scene.** Heading, body, image, controls, status panels
  and the desired breathing room above fixed chrome must all fit at settlement.
  Use `clamp()`, grid/flex relationships, intentional line lengths and a small
  spacing scale. Reduce gaps or internal panel padding at constrained desktop
  heights before shrinking the entire scene. Do not hide required content just
  to satisfy a one-screen composition.
- **Align optically as well as mathematically.** A photograph with visual weight
  on one side, a rotated frame or a circular subject may look off-centre even
  when its bounding box is centered. Use `camera.anchorX`/`anchorY`, a local
  camera rectangle or `object-position` for that exception; keep the rest of
  the layout on the shared axes.
- **Design image and text contrast together.** Reserve negative space in the
  image composition, add a restrained local gradient when needed, and keep text
  as HTML instead of baking it into an image. If only a small run crosses a
  changing light/dark surface, scope the contrast treatment to that run; do not
  dim the whole photograph or recolor the whole paragraph.
- **Author compact geometry, do not merely scale desktop.** At the responsive
  breakpoint, provide compact `x`/`y`/`w`/`h` and override or clear a desktop
  `camera` target. Recompose the scene for the narrower safe area, preserve
  readable type and touch targets, and let content flow naturally when it
  cannot remain a single frame.
- **Keep the route legible.** Adjacent world positions and transition choices
  should explain spatial relationships. Use the small Glide/Arc/Dolly/Orbit/
  Focus grammar, prefer `duration: "auto"`, and reserve large rotation, zoom or
  curved detours for a meaningful change in hierarchy. Motion should connect
  compositions, not compensate for inconsistent ones.

Validate **every destination after real navigation**, once the frame reports
`settled`; the initial render alone proves nothing. At minimum, exercise a
short desktop viewport, a common desktop viewport and a narrow mobile viewport.
For each frame, inspect a screenshot and measure the settled surface, copy and
interactive panels with `getBoundingClientRect()` or Playwright
`bounding_box()`. Assert that:

- the surface and all required content stay inside the usable viewport;
- the surface retains visible breathing room above any fixed bottom rail;
- headings, body text and controls remain inside their rectangular or shaped
  safe zones without clipping;
- repeated edges and centers remain aligned from frame to frame;
- images are decoded, controls remain reachable and the console is clean;
- the overview still exposes selectable subjects without accidental stacking
  or an oversized frame hiding the route.

Do not approve a ZoomStage layout from a static world view or a conveniently
resized screenshot. The acceptance surface is the camera's settled composition
in Chromium, Firefox and WebKit. `examples/zoom-lab` is the geometry/trajectory
reference; `examples/vitra-protocol` is the reference for image-led scenes,
fixed navigation chrome, shaped safe areas and settlement-driven content.

**Free exploration (`freeZoom`)** turns the stage into a roamable canvas:
scroll or pinch zooms toward the cursor, drag pans (a fast flick glides on with
momentum), and zoom is clamped between `minZoom`/`maxZoom` × the frame's fit.
What you explored survives a resize (it isn't snapped back to the frame), and
navigating still eases smoothly from wherever the camera is to the next frame.
`controllerRef.reset()` (or the `0`/`Esc` keys) eases back to the current
frame's fit, and `controllerRef.fitAll()` zooms out to an overview of every
frame. While `freeZoom` is on a one-finger drag pans (so `swipeNav` steps only
when it's off); a plain tap still advances. For a self-running deck, `autoplay`
auto-advances and `onInteract` lets you pause it the moment the viewer grabs the
canvas; `hashNav` deep-links each frame to the URL hash. See
[examples/star-atlas](../examples/star-atlas) — a zoomable night sky built on
`freeZoom` with a guided tour flying between constellations.
[examples/zoom-lab](../examples/zoom-lab) is the canonical comparison surface
for the five animated trajectories, automatic duration, non-card shapes,
independent camera bounds and the flight lifecycle.
[examples/vitra-protocol](../examples/vitra-protocol) is the combined
ZoomStage + FluxaWay Motion reference: six domain-componentized scenes use
settlement-driven entrances, closed small-element loops, glass and non-card
surfaces, an interactive overview, and an independent final camera target
measured to keep the complete console above its fixed control rail.

**Frames can legitimately overlap in world space** — an "overview" frame
that zooms out to show the whole canvas is, by definition, as big as every
other frame combined. `ZoomStage` renders frames sorted by descending area
(`w * h`), so larger frames paint *behind* smaller ones automatically. You
don't need to manage `z-index` yourself, but keep it in mind when authoring
geometry: a frame that's smaller than something it overlaps will always be
the one left visible on top.

**Mind the GPU texture ceiling (~4096px).** The world — the union of every
frame — is one layer the camera scales. Past ~4096px on either axis it exceeds
the GPU's max texture, so the browser tiles the layer and the tiles blank out /
flicker while zooming. `ZoomStage` guards the *world* automatically (above that
size it paints on the main thread instead of compositing it), but the same
limit applies to your **content**: never `fluxaway-motion`-animate `x`/`y`/`scale`
on a giant node — a full-canvas overview SVG, a background that spans the whole
frame. Animate its `opacity` (or a small child) instead; see fluxaway-motion's
"Compositor promotion" note. Flicker or vanishing elements *while zooming* is
almost always an oversized animated element.

**Structuring a multi-frame deck:** once a presentation has more than a
couple of frame *kinds* (title slide, bullet list, code sample, …), give
each kind its own component under `components/` (e.g.
`components/TitleFrame.js`, `components/CodeFrame.js`), with a small
dispatcher component that maps `data.kind` to the right one — the same
domain-componentized rule from §12 applies here. Keep `data.js` holding
plain geometry + content *descriptors* (`{ kind: "title", heading, body }`),
and build the actual `content: h(...)` vdom in `app.js` right before passing
`frames` to `ZoomStage`. See
[examples/fluxaway-architecture](../examples/fluxaway-architecture) for the full
pattern (`components/FrameContent.js` dispatches on `data.kind`).

### `FullCodeEditor`

`dist/fluxaway-editor.js` + `dist/fluxaway-editor.css` (+ `dist/fluxaway-editor-snippets.js`
for the snippet browser). A CodeMirror 5 wrapper with a toolbar, language
switcher, snippet browser, and autocomplete. Requires the local CodeMirror
assets in `assets/codemirror/` (no CDN).

| Prop | Description |
|---|---|
| `value`, `onChange` | Controlled source code |
| `language`, `onLanguageChange` | Active language (`python`, `cython`, `go`, `rust`, `kotlin`, …) |
| `snippets` | Snippet catalog — see `BOILERPLATES` in `fluxaway-editor-snippets.js` |
| `onCheckSyntax` | Async `(code) => { ok, message }` — wired to the toolbar's "check" action |
| `showToolbar`, `showSnippets`, `height` | Layout toggles |

```js
import { FullCodeEditor } from "/dist/fluxaway-editor.js";
import { BOILERPLATES } from "/dist/fluxaway-editor-snippets.js";

h(FullCodeEditor, { value: code, onChange: setCode, language: "python", snippets: BOILERPLATES })
```

### `fluxaway-charts` — charts & dashboards

`dist/fluxaway-charts.js` + **`dist/fluxaway-charts.css` (required — it carries
the palette tokens)**; types in `dist/fluxaway-charts.d.ts`. Plain SVG through
the normal vdom, so charts are reactive like any other component. This is the
only add-on that imports another (`fluxaway-motion`, for the `animate` presets).

Working reference: `examples/dashboard`. `examples/drug-recalls` uses it against
a live API.

```js
import {
  LineChart, AreaChart, BarChart, DonutChart, PieChart, Sparkline,
  DashboardGrid, ChartCard, MetricRow, MetricCard, Meter,
} from "/dist/fluxaway-charts.js";

const rows = [{ month: "Jan", visits: 1200, signups: 300 }, /* … */];

h(LineChart, {
  data: rows,
  x: "month",                                    // key or (row) => value
  series: [                                      // or `y: "visits"` for one
    { key: "visits",  label: "Visits" },
    { key: "signups", label: "Signups" },
  ],
  height: 260,
  animate: true,
})
```

| Component | For |
|---|---|
| `LineChart` / `AreaChart` | Trend over time. Crosshair tooltip; arrow keys walk the x-axis; `brush` to zoom |
| `BarChart` | Magnitude. `stacked` for part-to-whole, `horizontal` for long labels |
| `DonutChart` / `PieChart` | Part-to-whole at a glance; folds past `maxSlices` (6) into "Other" |
| `Heatmap` | Magnitude across a grid, on the SEQUENTIAL ramp (one hue) |
| `ScatterChart` | Two continuous measures. Nearest-point hover; caps at 3 coloured groups |
| `SmallMultiples` | One facet per series on a SHARED scale — the way out of "too many series" |
| `LikertChart` | Ordered-scale share (agree/disagree, sentiment) as a diverging stacked bar |
| `DumbbellChart` | Before → after per item; the connector IS the change |
| `Sparkline` | Trend glyph, no chrome — for tiles and table cells |
| `DashboardGrid` / `ChartCard` | Auto-fit card grid; `loading` dims instead of flashing a skeleton |
| `MetricRow` / `MetricCard` | KPI row: value, delta, sparkline. `countUp` animates the number |
| `Meter` | One ratio against a limit |

Also exported: `scaleLinear`, `scaleBand`, `niceTicks`, `formatCompact`,
`formatNumber`, `seriesColor`, `seqColor`, `divergingColor`, `CHART_SLOTS`,
`SEQ_STEPS`, `DIV_STEPS`, `ALL_PAIRS_SLOTS` — for building a custom chart on
the same scales and palette.

**Export**: `exportCSV(spec, { filename })` and `chartToCSV(spec)` write the
same rows the table view shows; `exportPNG(svgOrRef, { filename, scale })`
rasterises a rendered chart. PNG export inlines every computed colour first,
because a serialised SVG carries no stylesheet and `var(--m-chart-N)` would
otherwise export black.

**Two more props worth knowing**, both there to keep a chart honest:

- `emphasis: "<series key>"` — one series keeps its hue, the rest go grey. When
  the story is "this one moved", eight competing hues bury it.
- `yDomain: [min, max]` — force the value axis. `SmallMultiples` sets it across
  facets, because a grid of independently scaled charts looks comparable and
  is not.

**Animation** (`animate`) rides fluxaway-motion: bars scale up from the
baseline, lines are wiped in by a clip rect, donut arcs pop, all staggered.
`animate: { duration, stagger, ease, key }` tunes it; changing `key` replays it
(a "replay" button, or a filter swap). It respects `prefers-reduced-motion`,
and the resting render is the untransformed chart — animation never changes
what a mark reports.

**Rules the module enforces — do not work around them:**

- **No dual-axis.** There is deliberately no `yRight`. Two measures of
  different magnitude are two charts; a second y-scale invents a correlation
  that is not in the data.
- **Color follows the entity, not its rank.** Slots come from a series' position
  by default. If the app *filters* its series list, pin `slot: n` on each series
  so survivors keep their hue.
- **Eight slots, never a ninth.** `seriesColor(8)` returns the neutral
  "Other" token rather than cycling — a generated hue is indistinguishable from
  an existing one under simulated colorblindness.
- **Three slots in all-pairs forms.** In a bar or line chart only neighbouring
  colors touch, but in a **scatter** any two dots can, and the palette is only
  validated that far (`ALL_PAIRS_SLOTS`). `ScatterChart` folds past it
  automatically — do not raise the cap; facet instead.
- **Magnitude uses the sequential ramp, identity uses categorical hues.**
  `Heatmap` takes `--m-seq-1..7` (one hue, more-is-darker). A rainbow for
  magnitude has no reading order, and categorical hues on a value scale
  misstate it.
- **Polarity uses the diverging ramp.** `--m-div-1..7`, two opposite hues
  meeting at a NEUTRAL GREY middle (`--m-div-4`), for values against a
  baseline: `BarChart`'s `diverging`, `LikertChart`, `divergingColor()`. The
  midpoint is grey on purpose and never a hue — it has to read as "nothing".
  Which pole is "good" is the app's call (`diverging: { invert: true }`),
  because red means loss in finance and heat on a map. When a colour actually
  *means* good/bad, that is **status**, not diverging — use the status tokens.
- **Nominal bars take one color.** A single series colors every bar slot 1;
  shading bars by value re-encodes what the length already shows.
- **Status colors stay status.** For severity tiers (Class I/II/III, good→
  critical) pass `sliceColor` / `series[].color` with `--m-danger` /
  `--m-warning` / `--m-info` — hue means state there, not identity.
- **Every chart ships a table twin** (`showTable`, on by default), so no value
  is reachable only by hovering.

---

## 11. CSS Design Tokens

All tokens are CSS custom properties set on `:root` by `fluxaway-ui.css`.

```css
/* Colors */
--m-bg             /* page background #f4f6f8 */
--m-surface        /* card/panel background #ffffff */
--m-surface-soft   /* tinted surface #eef4f2 */
--m-surface-muted  /* subtle surface #f8fafc */
--m-surface-raised /* interactive hover surface #f1f5f9 */
--m-text           /* primary text #18212b */
--m-text-muted     /* secondary text #617080 */
--m-border         /* borders #cbd6e0 */

--m-primary        /* primary teal #0f766e (the design-system default; the
                      FluxaWay brand palette in docs/BRAND.md is separate) */
--m-primary-hover  /* #115e59 */
--m-primary-soft   /* light tint #d9f3ef */
--m-on-primary     /* text/icons ON a solid --m-primary fill: #ffffff light, #0f172a dark */
--m-secondary      /* #3f4f9f */

--m-danger         /* red #b42318 */
--m-danger-soft    /* #fee4e2 */
--m-on-danger      /* text/icons ON a solid --m-danger fill: #ffffff light, #0f172a dark */
--m-success        /* green #067647 */
--m-success-soft   /* #dcfae6 */
--m-warning        /* orange #b54708 */
--m-warning-soft   /* #fef0c7 */
--m-info           /* blue #175cd3 */
--m-info-soft      /* #dbeafe */

/* Spacing (4-point scale) */
--m-space-1   /* 4px */
--m-space-2   /* 8px */
--m-space-3   /* 12px */
--m-space-4   /* 16px */
--m-space-5   /* 20px */
--m-space-6   /* 24px */
--m-space-8   /* 32px */
--m-space-10  /* 40px */
--m-space-12  /* 48px */

/* Shape */
--m-radius     /* 8px */
--m-radius-sm  /* 4px */
--m-radius-lg  /* 16px */
--m-radius-xl  /* 24px */

/* Elevation */
--m-shadow-1   /* subtle */
--m-shadow-2   /* medium */
--m-shadow-3   /* strong */

/* Typography */
--m-font              /* Inter stack */
--m-font-size-xs      /* 0.75rem */
--m-font-size-sm      /* 0.875rem */
--m-font-size-base    /* 1rem */
--m-font-size-lg      /* 1.125rem */
--m-font-size-xl      /* 1.25rem */
--m-font-size-2xl     /* 1.5rem */
--m-font-size-3xl     /* 1.875rem */

/* Transitions */
--m-transition-fast   /* 120ms ease */
--m-transition-base   /* 200ms ease */
--m-transition-slow   /* 400ms ease — hover zoom/glow/expand effects */

/* Chart palette — set by fluxaway-charts.css, NOT fluxaway-ui.css.
   Eight categorical slots in a FIXED order (slot 1 is the brand teal), plus
   a neutral for the folded tail. The order is the colorblind-safety
   mechanism: it was derived and validated, not picked by eye. Re-check any
   change with `python3 scripts/validate_chart_palette.py`. */
--m-chart-1 … --m-chart-8  /* categorical series slots, assigned in order */
--m-chart-other            /* "Other" — the folded tail, never a 9th hue */
--m-chart-muted            /* de-emphasised series (the `emphasis` prop) */
--m-seq-1 … --m-seq-7      /* SEQUENTIAL ramp for magnitude (Heatmap): one hue,
                              seq-1 is always the lowest value; the stylesheet
                              flips which end is pale per theme */
--m-div-1 … --m-div-7      /* DIVERGING ramp for polarity: cool pole → neutral
                              grey (--m-div-4) → warm pole. Re-check any change
                              with `validate_chart_palette.py --diverging` */
--m-chart-grid             /* hairline gridlines */
--m-chart-axis             /* axis rules and the crosshair */
--m-chart-ink              /* axis label text */
--m-chart-area-opacity     /* area fill wash (0.1 light / 0.16 dark) */

/* Card: glow accent hues (see m-card-glow in §9) */
--m-card-hue-1        /* 210 — default gradient-border hue 1 */
--m-card-hue-2        /* 265 — default gradient-border hue 2 */

/* Z-index layers */
--m-z-dropdown  /* 30 */
--m-z-drawer    /* 40 */
--m-z-dialog    /* 50 */
--m-z-toast     /* 60 */
--m-z-tooltip   /* 70 */
--m-z-appbar    /* 20 */
--m-z-bottomnav /* 20 */
```

Override tokens on a scoped element or globally:

```css
:root { --m-primary: #7c3aed; --m-on-primary: #ffffff; } /* purple brand */
.my-widget { --m-radius: 0; }   /* square corners for this widget */
```

**Whoever sets `--m-primary` sets `--m-on-primary` in the same rule** (same for
`--m-danger` / `--m-on-danger`). The fill flips from a dark color in the light
theme to a light one in the dark theme, so no fixed text color survives both:
white on the dark-theme teal is 1.86:1. Every built-in theme and palette rule
follows this; your override must too, with a pair that reaches 4.5:1. A brand
color that should change per theme needs both halves:

```css
:root               { --m-primary: #7c3aed; --m-on-primary: #ffffff; }
[data-theme="dark"] { --m-primary: #a78bfa; --m-on-primary: #0f172a; }
```

Never hard-code `color: #fff` on a `var(--m-primary)` background in app CSS —
use `color: var(--m-on-primary)`. `usePalette().setCustomColor(hex)` derives
`--m-on-primary` for you (white or black, whichever contrasts more).

**Text over a photo** (a landing page's cover) has no token, because the photo
is the same in both themes and so is the text on it. Dim the photo over black
and write light text. Put the image in an `<img>`, not in a CSS `url()`, so a
URL from data still goes through `safeUrl()` (§8):

```js
h('section', { className: 'a-cover' },
  h('img', { className: 'a-cover-photo', src: safeUrl(cover.image), alt: '' }),
  h('h1', null, cover.title),
)
```

```css
.a-cover       { position: relative; isolation: isolate; background: #000; color: #fff; }
.a-cover-photo { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%;
                 object-fit: cover; opacity: 0.4; } /* same as a 60% black scrim */
```

At `opacity: 0.4`, white text reaches 5.7:1 even where the photo is pure white.
Do not go above 0.45 (4.8:1; the 4.5:1 floor is near 0.46). This is the one
place a fixed `#fff` is right. A contained `Button` on the cover keeps its own
`--m-primary` fill and needs nothing. If the text sits in a `Card` over the
photo instead, the Card is opaque `--m-surface` with `--m-text` and already
follows the theme. Do not make it translucent.

### The reset, the grid and the utility classes

All of it ships in `fluxaway-ui.css` (category file: `fluxaway-ui-base.css`).

**The reset is small.** `box-sizing: border-box` on everything. `body` gets
`margin: 0`, `min-height: 100dvh`, `background: var(--m-bg)`,
`color: var(--m-text)`, `font-family: var(--m-font)` at `--m-font-size-base` and
`line-height: 1.5`. Form controls inherit the font; `img` and `video` get
`max-width: 100%; height: auto`. Nothing else: headings, paragraphs and lists
keep the browser's default margins — space them in your own CSS.

**These `m-*` classes are public API** — unlike the class names inside a
component (§9), write them freely in `className`. Breakpoints: `sm` 576px,
`md` 768px, `lg` 992px, `xl` 1200px, all `min-width`.

| Group | Classes |
|---|---|
| Container | `m-container` (centred; max-width 540 / 720 / 960 / 1140px by breakpoint, 16px side padding), `m-container-fluid` |
| 12-col grid | `m-row` > `m-col`, `m-col-auto`, `m-col-{1-12}`, and `m-col-{sm,md,lg,xl}-{1-12}` / `-auto`. Gutters: `m-row-gap-0`, `m-row-gap-2`, `m-row-gap-4` (default 12px each side) |
| Layout helpers | `m-stack` (grid, 16px gap), `m-cluster` (wrapping flex row, centred, 12px gap), `m-split` (space-between row), `m-center` (place-items: center), `m-grid-2` / `m-grid-3` / `m-grid-4` (1 column on phones, up to N) |
| Display | `m-d-{none,block,flex,grid,inline,inline-flex,inline-block}` and `m-d-{sm,md,lg,xl}-*` |
| Flex | `m-flex-row`, `m-flex-column`, `m-flex-wrap`, `m-flex-nowrap`, `m-flex-grow`, `m-flex-shrink-0`, `m-justify-{start,end,center,between,around}`, `m-align-{start,end,center,baseline,stretch}` |
| Spacing (the number is the `--m-space-N` step) | `m-m-*`, `m-mt-*`, `m-mb-*`, `m-p-*` with 0–6 and 8; `m-px-*`, `m-py-*` with 0–6; `m-ms-*`, `m-me-*` with 0–4 and `auto`; `m-m-auto`, `m-mx-auto`; `m-gap-*` with 0–6, 8, 10, 12 |
| Text | `m-text-{start,center,end}` (+ `m-text-sm-*`, `m-text-md-*`), sizes `m-text-{xs,sm,base,lg,xl,2xl,3xl}`, weights `m-fw-{normal,medium,bold,black}`, colors `m-text-{muted,primary,danger,success,warning,info}`, `m-text-truncate` |
| Size / position / overflow / cursor | `m-w-full`, `m-w-auto`, `m-h-full`, `m-min-w-0`; `m-relative`, `m-absolute`, `m-fixed`, `m-sticky`; `m-overflow-{hidden,auto,x-auto,y-auto,x-hidden}`; `m-cursor-{pointer,default,not-allowed}` |

They are conveniences, not a requirement: a component's own paired CSS file
(§12) is just as correct, and is the better home for anything a utility cannot say.

Public animation utility classes (apply directly to any element — distinct
from the internal `m-fade-in`/`m-scale-in`/`m-slide-up` keyframes used by
Dialog/Toast/Drawer):

```css
.m-anim-fade-up     /* one-shot fade + translateY entrance, var(--m-transition-slow) */
.m-anim-pulse-glow  /* looping soft box-shadow pulse in var(--m-primary), 2.2s */
```

---

## 12. Component Patterns

### Basic component

```js
function UserCard({ name, email, avatar, onEdit }) {
  return h(Card, { padded: true },
    h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
      h('img', { src: avatar, alt: name, style: { width: 48, height: 48, borderRadius: '50%' } }),
      h('div', null,
        h('strong', null, name),
        h('p', { style: { color: 'var(--m-text-muted)', margin: 0 } }, email),
      ),
    ),
    h(Button, { variant: 'tonal', onClick: onEdit }, 'Edit'),
  );
}
```

### State in parent, data down / events up

```js
function UserList() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

  return h('div', null,
    users.map((u) =>
      h(UserCard, {
        key: u.id,
        name: u.name,
        email: u.email,
        onEdit: () => setSelected(u),
      })
    ),
    selected && h(EditDialog, {
      user: selected,
      onSave: (updated) => {
        setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
        setSelected(null);
      },
      onClose: () => setSelected(null),
    }),
  );
}
```

### Derived state (no double useState)

```js
function SearchableList({ items }) {
  const [query, setQuery] = useState('');

  // Compute on every render — no separate state for filtered list
  const visible = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return h('div', null,
    h(TextField, { label: 'Search', value: query, onInput: (e) => setQuery(e.target.value) }),
    visible.map((i) => h('li', { key: i.id }, i.label)),
  );
}
```

### useEffect for data fetching

```js
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setUser(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return h(Spinner, { label: 'Loading...' });
  if (!user)   return h(EmptyState, { title: 'User not found' });
  return h(UserCard, { name: user.name, email: user.email });
}
```

### Form with useForm

```js
function LoginForm({ onSuccess }) {
  const { field, handleSubmit, isSubmitting, errors } = useForm({
    initialValues: { email: '', password: '' },
    validate: (v) => ({
      email:    !v.email.includes('@') ? 'Invalid e-mail' : '',
      password: v.password.length < 8  ? 'Minimum 8 characters' : '',
    }),
    onSubmit: async (values) => {
      const user = await api.login(values);
      onSuccess(user);
    },
  });

  return h('form', { onSubmit: handleSubmit() },
    h(TextField, { ...field('email'),    label: 'E-mail',   type: 'email'    }),
    h(TextField, { ...field('password'), label: 'Password', type: 'password' }),
    h(Button, { variant: 'contained', type: 'submit', disabled: isSubmitting },
      isSubmitting ? h(Spinner, { label: 'Please wait' }) : 'Sign in'
    ),
  );
}
```

### Context provider + consumer

```js
const CartCtx = createContext({ items: [], add: () => {}, remove: () => {} });

function CartProvider() {
  const [items, setItems] = useState([]);
  const add    = (item) => setItems((prev) => [...prev, item]);
  const remove = (id)   => setItems((prev) => prev.filter((i) => i.id !== id));

  return CartCtx.provide({ items, add, remove }, () =>
    h('div', null, h(Header), h(ProductGrid), h(CartSidebar))
  );
}

function CartBadge() {
  const { items } = useContext(CartCtx);
  return h(Badge, null, items.length);
}
```

### Error boundary

```js
function SafeWidget({ children }) {
  const [error, reset, guard] = useErrorBoundary();

  if (error) {
    return h(Alert, { variant: 'warning', title: 'Something went wrong' },
      h(Button, { variant: 'tonal', onClick: reset }, 'Try again')
    );
  }

  return guard(() => children);
}

// Usage — wrap risky subtrees:
h(SafeWidget, null, h(ComplexChart, { data }))
```

### Domain-componentized structure

> **This is the FluxaWay way.** Split by domain (visual section / feature), not by
> type. Every real app beyond a demo should follow this layout.

```
my-app/
  index.html          ← HTML entry point — loads styles.css + app.js
  app.js              ← orchestrator: imports, top-level state, render()
  styles.css          ← global layout + @import for every component CSS
  data.js             ← ALL static/mock/seed data as UPPER_CASE exports
  components/
    Hero.js           ← one component per file
    Hero.css          ← paired CSS — same base name as the JS file
    Features.js
    Features.css
    Footer.js
    Footer.css
    useMyHook.js      ← custom hooks live here too (prefix: use)
```

**Rules — follow all of them:**

| Rule | Detail |
|------|--------|
| **No `src/` wrapper** | Projects live directly in their named folder |
| **No `pages/` / `store/` / `utils/`** | Not used in FluxaWay — keep it flat |
| **Small helpers get a named module** | A pure function that is neither a component nor a hook (format a price, build a WhatsApp URL) lives in its own lower-case file **named after what it does** — `format.js`, `links.js` — next to what uses it: in `components/` (or the domain folder) when one area uses it, at the root when the whole app does. Never a `utils/` folder or a grab-bag `utils.js`, never inlined in `app.js`, never a second export squeezed into a component file. **Not a helper:** a function that only makes sense inside one component — the `validate` of that form's `useForm`, with its messages, or an event handler — stays in that component's file, as every `useForm` example in §6 writes it. It becomes a module the day a second file needs it |
| **One component per file** | Small, single-purpose function |
| **Paired CSS** | `Hero.js` → `Hero.css` — always a sibling file |
| **CSS imported centrally** | `styles.css` collects all component CSS via `@import`. Components do NOT import CSS themselves |
| **`data.js` at root** | All static data as `UPPER_CASE` named exports. Never hardcode data inside components |
| **`app.js` is orchestrator only** | Imports data + components, holds top-level UI state (open/closed, active tab). Zero business logic |
| **Hooks in `components/`** | `useXxx.js` alongside the components — centralizes fetching and complex state |
| **CSS class prefix** | Pick a short prefix per project (`l-` landing, `tm-` task-manager) to avoid collisions with FluxaWay's `m-*` classes |
| **Shared layout lives in `styles.css`** | A class more than one component uses — the page shell's width and gutter, an alternating section background, a shared band — belongs in the root `styles.css`, next to its `@import`s, NOT in one component's paired file. The test: if inserting a new section would make you edit a *sibling* component's CSS, the rule was in the wrong file. Keep the cross-component **decision** there too (`.l-shell`, `.l-band:nth-of-type(even)`), so a component's own file only ever styles that component |

### Scaling to domain subfolders

**The trigger is a domain, not a count.** Create `components/<domain>/` when
**three or more files belong to the same feature** — `LoginForm.js`,
`RegisterForm.js`, `useAuth.js` → `auth/`. Every `.js` file that belongs to the
feature counts — a component, its hook, **and a small helper only that feature
uses** (`catalog/format.js`); a component's paired `.css` does not. Until then, stay flat, however many components there
are: a landing page of eight independent sections (`Hero`, `Features`, `Pricing`,
… `Footer`) is eight flat component files, because no two of them share a
feature. Never group by type (`forms/`, `ui/`, `shared/`).

Decide the split first, then count — never the other way round. One component
per file, split when a file outgrows one job; if that leaves a feature with
three files (`Catalog.js`, `ProductCard.js`, `useCatalogFilter.js`) it gets
`catalog/`, and if it leaves two they stay flat. Both are correct. Do not carve
a third file out to earn a folder, and do not merge two to avoid one. A helper
counts because the "small helpers" rule above already made it a file; a helper
the whole app uses lives at the root and counts for no domain.

```
my-app/
  index.html
  app.js
  styles.css
  data.js
  components/
    auth/
      LoginForm.js
      LoginForm.css
      RegisterForm.js
      RegisterForm.css
      useAuth.js          ← third .js file of the feature: this is what earns the folder
    dashboard/
      MetricsRow.js
      MetricsRow.css
      RevenueChart.js
      RevenueChart.css
      useDashboard.js     ← domain hook lives inside the domain folder
    settings/
      ProfileForm.js
      ProfileForm.css
      BillingSection.js
      BillingSection.css
      plans.js            ← a helper only `settings/` uses counts too
```

**Rules for domain subfolders:**

| Rule | Detail |
|------|--------|
| **Domain = feature, not type** | `auth/`, `dashboard/`, `settings/` — never `forms/`, `modals/`, `shared/` |
| **Paired CSS stays next to the JS** | `auth/LoginForm.js` → `auth/LoginForm.css` |
| **`styles.css` still collects everything** | Even nested CSS is imported at root — components never import their own CSS. Exception: in a large app with lazy routes, each route's domain CSS moves to a per-route `css:` collector and `styles.css` keeps only the critical shell (see "Code splitting in large apps") |
| **Domain hook lives in its domain** | `dashboard/useDashboard.js`, not a separate `hooks/` folder |
| **`data.js` stays at root** | Unless the project is very large, keep one `data.js`; don't split per domain |
| **Flat first, then split** | Start flat. A subfolder needs 3+ `.js` files of the **same** domain (paired `.css` not counted) — never one folder per component, and never a folder just because the app passed some number of components |

### Domain-owned context

A domain whose own components need to share state (not just one parent
prop-drilling into its children) gets its own `createContext` call, living
in the domain folder next to the hook that owns the state:

```
components/
  cart/
    CartContext.js     ← createContext(...) + useCartState() hook
    CartButton.js
    CartButton.css
    CartDrawer.js
    CartDrawer.css
  auth/
    AuthContext.js      ← createContext(...) + useAuthState() hook
    AuthMenu.js
    AuthMenu.css
```

```js
// components/cart/CartContext.js
import { createContext, useCallback, useMemo, useState } from '/dist/fluxaway.js';

export const CartContext = createContext({ items: [], addItem: () => {} });

// A hook, not a component — the actual h(Shell) call that needs this value
// on the stack happens in app.js. See "Composing multiple contexts" in §7.
export function useCartState() {
  const [items, setItems] = useState([]);
  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);
  return useMemo(() => ({ items, addItem }), [items, addItem]);
}
```

```js
// app.js — the one place all domain contexts get composed
import { h, render } from '/dist/fluxaway.js';
import { CartContext, useCartState } from './components/cart/CartContext.js';
import { AuthContext, useAuthState } from './components/auth/AuthContext.js';
import { Shell } from './components/Shell.js';

function App() {
  const cart = useCartState();
  const auth = useAuthState();

  return CartContext.provide(cart, () =>
    AuthContext.provide(auth, () =>
      h(Shell)
    )
  );
}

render(App, document.getElementById('app'));
```

Each domain's own components consume their own context directly:

```js
// components/cart/CartButton.js
import { h, useContext } from '/dist/fluxaway.js';
import { Badge, IconButton } from '/dist/fluxaway-components-core.js';
import { CartContext } from './CartContext.js';

export function CartButton({ onClick }) {
  const { items } = useContext(CartContext);
  return h(IconButton, { label: 'Cart', onClick },
    h(Badge, null, items.reduce((n, i) => n + i.qty, 0)),
  );
}
```

**Rules for domain-owned context:**

| Rule | Detail |
|------|--------|
| **Context + its hook live together** | `cart/CartContext.js` exports both `CartContext` and `useCartState()` |
| **The hook holds state, the context just carries it** | `useCartState()` is a plain hook (`useState`/`useCallback`/`useMemo`) — not a component |
| **Only `app.js` composes providers** | Nest `.provide()` calls in the root component — never a separate `<XProvider>` component that takes `children` as a prop (see §7) |
| **Domains don't read each other's context** | Cross-domain interaction happens through props/callbacks passed at the composition root (`app.js`), not by importing another domain's context |

CSS imports in `styles.css` for a domain-structured app:

```css
/* styles.css */
@import './components/auth/LoginForm.css';
@import './components/auth/RegisterForm.css';
@import './components/dashboard/MetricsRow.css';
@import './components/dashboard/RevenueChart.css';
@import './components/settings/ProfileForm.css';
@import './components/settings/BillingSection.css';
```

JS imports use the full relative path:

```js
// app.js
import { LoginForm }    from './components/auth/LoginForm.js';
import { MetricsRow }   from './components/dashboard/MetricsRow.js';
import { ProfileForm }  from './components/settings/ProfileForm.js';
```

**Two CSS strategies:**

| Scenario | Approach |
|----------|----------|
| Custom-designed UI (no FluxaWay components) | Own tokens (`--l-bg`, `--l-accent`, etc.); no `fluxaway-ui.css` in `<head>` |
| Using FluxaWay UI components | Load `fluxaway-ui.css` first; `styles.css` adds layout-only rules; reuse `--m-*` tokens |

**Concrete pattern — data isolation:**

```js
// data.js
export const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#pricing',  label: 'Pricing'  },
];

export const FEATURES = [
  { id: 'speed',    icon: '⚡', title: 'Fast',     description: '...' },
  { id: 'secure',   icon: '🔒', title: 'Secure',   description: '...' },
  { id: 'flexible', icon: '🔧', title: 'Flexible', description: '...' },
];
```

**Concrete pattern — `app.js` as orchestrator:**

```js
// app.js
import { h, render } from '/dist/fluxaway.js';
import { NAV_LINKS, FEATURES } from './data.js';
import { Header }   from './components/Header.js';
import { Features } from './components/Features.js';
import { Footer }   from './components/Footer.js';

function App() {
  return h('div', { className: 'l-page' },
    h(Header,   { navLinks: NAV_LINKS }),
    h('main', null,
      h(Features, { features: FEATURES }),
    ),
    h(Footer, null),
  );
}

render(App, document.getElementById('app'));
```

**Concrete pattern — component + paired CSS:**

```js
// components/Features.js
import { h } from '/dist/fluxaway.js';

export function Features({ features }) {
  return h('section', { className: 'l-features' },
    h('h2', { className: 'l-section-title' }, 'Features'),
    h('div', { className: 'l-feature-grid' },
      features.map((f) =>
        h('article', { key: f.id, className: 'l-feature-card' },
          h('span', { className: 'l-feature-icon' }, f.icon),
          h('h3', null, f.title),
          h('p', null, f.description),
        )
      ),
    ),
  );
}
```

```css
/* components/Features.css — imported by styles.css, not by Features.js */
.l-features { padding: 4rem 1.5rem; }

.l-feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.l-feature-card { background: var(--l-surface); border-radius: 12px; padding: 1.5rem; }
.l-feature-icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }
```

```css
/* styles.css — central CSS entry point */
@import './components/Header.css';
@import './components/Features.css';
@import './components/Footer.css';

:root {
  --l-bg:      #f8fafc;
  --l-surface: #ffffff;
  --l-accent:  #4f46e5;
}

* { box-sizing: border-box; }

.l-page { min-height: 100vh; background: var(--l-bg); }
```

**Concrete pattern — custom hook:**

```js
// components/useProducts.js
import { useCallback, useEffect, useState } from '/dist/fluxaway.js';

export function useProducts() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      setItems(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  return { items, loading, error, refresh: load };
}
```

### Code splitting in large apps (lazy routes)

FluxaWay is no-build ESM: the browser fetches and executes **every module reachable
through static `import` chains from `app.js` before first paint**. In a small
app that's fine; in a large app (many pages/domains, or a migration from
Angular/React where every page ends up statically imported) it means the whole
app downloads on load. The fix is route-level code splitting — the FluxaWay analog
of Angular's `loadChildren` or React's `React.lazy` + router splitting.

**Default for large apps: every route-level page is a `lazy:` route.**

```js
// ❌ Loads every page at startup — static imports defeat code splitting
import { Dashboard } from './components/dashboard/Dashboard.js';
import { Reports }   from './components/reports/Reports.js';

const routes = [
  { path: '/dashboard', element: h(Dashboard, null) },
  { path: '/reports',   element: h(Reports, null) },
];

// ✅ Each page downloads on first navigation to it
const routes = [
  { path: '/dashboard', lazy: () => import('./components/dashboard/Dashboard.js'),
    fallback: h(Spinner, null) },
  { path: '/reports',   lazy: () => import('./components/reports/Reports.js'),
    fallback: h(Spinner, null) },
];
```

Rules that make the split actually work:

| Rule | Why |
|------|-----|
| **Delete the static imports of lazy pages** | Any remaining static `import` of the page (in `app.js` or elsewhere) makes the browser fetch it eagerly — the `lazy:` then saves nothing. The `lazy:` loader must be the *only* path to the module. |
| **Page module has a `default` export** | `lazy` resolves `mod.default ?? mod`. |
| **A lazy page pulls its domain with it** | Whatever the page imports statically (its components, its CSS-free siblings, its domain hook) downloads together on first navigation — that's the intended "chunk". |
| **Shared modules must not import pages back** | If `data.js` or a shared hook imports a page, that page rides along with the shared module and the split is lost. Imports flow pages → shared, never shared → pages. |
| **Load state is cached per route object** | Declare `routes` at module scope (not inside a component) so navigating away and back doesn't re-show the fallback. |

**`createLazy` for heavy non-route components** — charts, code editors, rarely
opened dialogs:

```js
import { createLazy, h } from '/dist/fluxaway.js';

// Module scope — createLazy holds load state internally, so never call it
// inside a component body (a new instance per render would never resolve).
const Chart = createLazy(() => import('./Chart.js'), h(Spinner, null));

function Metrics({ data }) {
  return h(Chart, { data });   // downloads Chart.js on first render only
}
```

On import failure both `lazy:` routes and `createLazy` throw — wrap a layout
level above in `useErrorBoundary` to show a friendly retry screen.

**CSS splits too.** Lazy JS alone is not enough: the default architecture
collects *all* component CSS into `styles.css` via `@import`, so every page's
stylesheet still downloads up front — and `@import` chains resolve serially,
which is even worse at scale. In a large app, keep only the critical CSS in
`styles.css` (tokens, app shell, first-paint layout) and declare each page's
CSS on its route with `css:`:

```js
const routes = [
  { path: '/reports',
    lazy: () => import('./components/reports/Reports.js'),
    css: '/components/reports/reports.css',      // or an array of hrefs
    fallback: h(Spinner, null) },
];
```

The route's `fallback` holds until the stylesheet *and* the module are ready,
so the page never flashes unstyled. `css:` also works on non-lazy routes.
`reports.css` is the domain's collector — it `@import`s the paired component
CSS of that domain, keeping the "components never import their own CSS" rule:
CSS is still declared by an orchestrator, just per-route instead of globally.

For a heavy non-route component, use the underlying primitive `loadCSS(href)`
(deduped by URL, resolves on load) — e.g. via top-level `await` in the module
that `createLazy` imports, which holds the lazy fallback until the CSS is in:

```js
// components/chart/Chart.js — loaded via createLazy(() => import('./Chart.js'))
import { h, loadCSS } from '/dist/fluxaway.js';
await loadCSS(new URL('./chart.css', import.meta.url)); // top-level await
export default function Chart({ data }) { /* ... */ }
```

**Optional — preload on intent.** Dynamic `import()` is cached by URL, so
warming it early makes the later navigation instant:

```js
h('a', { href: '#/reports',
         onMouseEnter: () => import('./components/reports/Reports.js') },
  'Reports')
```

### Docs-site reference authoring (repository contributors)

The published documentation lives in the separate `fluxaway-docs-site` project
(formerly `examples/docs-site`), which vendors this repository into its `site/`
web root. API content stays as descriptors under `site/content/`; do not create a custom page component to solve
the presentation of one entry. `components/reference/ReferencePage.js` renders
the common contract across all 107 entries:

1. **Setup** — required CSS first, then the browser-module import (and signature
   for hooks/add-ons).
2. **Live examples** — the rendered component and its copyable source are the
   same example.
3. **API tables** — props, parameters, returns and named reference tables.
4. **Resources** — related source and runnable examples.
5. **Implementation notes** — constraints that would otherwise be easy to miss.

Component reference Setup maps its category to
`fluxaway-ui-base.css + fluxaway-ui-<category>.css`; this keeps CSS beside the
component tutorial without pretending the CSS and JavaScript APIs are separate
products. Shared tables go through `PropsTable`: real `<th scope="col">`
headers, predictable desktop column widths, technical values that wrap without
clipping, and labelled row cards below 680px. At 1320px and below the desktop
TOC becomes the compact disclosure so it cannot squeeze a technical table.

When changing the shared reference layout, update that project's
`scripts/check_docs_site.py` and run it in Chromium, Firefox and WebKit. The
smoke test locks the setup recipe, accessible table associations, local design
scope, responsive cards, no page overflow and the complete catalog.

---

## 13. Complete minimal app (single-file demo only)

> **Single-file apps are for quick demos and prototypes.**
> For any real project — landing page, dashboard, form flow — use the
> domain-componentized structure from §12. Never generate a multi-section
> UI in a single `app.js`.

A working counter with a Navbar, Tabs, and form:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/dist/fluxaway-ui.css">
  <title>Demo</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

```js
// app.js
import { h, render, useState } from '/dist/fluxaway.js';
import { Card, Button, Alert } from '/dist/fluxaway-components-core.js';
import { TextField } from '/dist/fluxaway-components-forms.js';
import { Navbar, Tabs, TabPanel } from '/dist/fluxaway-components-nav.js';

function CounterTab() {
  const [count, setCount] = useState(0);
  return h(Card, { padded: true },
    h('p', { style: { fontSize: '2rem', textAlign: 'center' } }, count),
    h('div', { style: { display: 'flex', gap: '8px' } },
      h(Button, { variant: 'tonal',      onClick: () => setCount((n) => n - 1) }, '-'),
      h(Button, { variant: 'contained',  onClick: () => setCount((n) => n + 1) }, '+'),
      h(Button, { variant: 'text',       onClick: () => setCount(0) }, 'Reset'),
    ),
  );
}

function FormTab() {
  const [name, setName]   = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => { if (name.trim()) setSaved(true); };

  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
    saved && h(Alert, { variant: 'success' }, `Hello, ${name}!`),
    h(TextField, {
      label: 'Your name',
      value: name,
      onInput: (e) => { setName(e.target.value); setSaved(false); },
      error: saved || name.trim() ? '' : 'Name is required',
    }),
    h(Button, { variant: 'contained', onClick: save }, 'Save'),
  );
}

function App() {
  const [tab, setTab] = useState('counter');

  return h('div', null,
    h(Navbar, {
      brand: 'Demo App',
      items: [{ label: 'Home', href: '#', active: true }],
    }),
    h('div', { style: { padding: '24px', maxWidth: 480, margin: '0 auto' } },
      h(Tabs, {
        value: tab,
        onChange: (v) => setTab(v),
        items: [
          { value: 'counter', label: 'Counter' },
          { value: 'form',    label: 'Form' },
        ],
      }),
      h(TabPanel, { id: 'counter', activeId: tab }, h(CounterTab)),
      h(TabPanel, { id: 'form',    activeId: tab }, h(FormTab)),
    ),
  );
}

render(App, document.getElementById('app'));
```

---

## 14. Complete multi-file app (domain-componentized)

A landing page split across `data.js` + two components + paired CSS.
This is the structure to use for any real app. Note what it does **not** do:
it does not rebuild a navbar, a card or a button by hand, and it defines no
colors of its own — the design system's components and `--m-*` tokens (§11) give
it a dark theme and every palette for free.

**`index.html`** — `fluxaway-ui.css` first, then your `styles.css`
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/dist/fluxaway-ui.css">  <!-- the design system, FIRST -->
  <link rel="stylesheet" href="./styles.css">           <!-- then your app -->
  <title>My App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

**`data.js`** — all static data, UPPER_CASE exports
```js
export const PLANS = [
  { id: 'free',  name: 'Free', price: 0,  features: ['1 project', 'Basic support'] },
  { id: 'pro',   name: 'Pro',  price: 49, features: ['Unlimited', 'Priority support'] },
];

export const NAV_LINKS = [
  { href: '#pricing', label: 'Pricing' },
  { href: 'mailto:hello@example.com', label: 'Contact' },
];
```

**`components/format.js`** — a small pure helper: its own lower-case module, named after what it does, next to the one component that uses it (§12). It would sit at the root only if the whole app used it
```js
export function formatPrice(price) {
  return price === 0 ? 'Free' : `$${price}/mo`;
}
```

**`components/TopBar.js`** — wraps FluxaWay's `Navbar`; named `TopBar` so it does not shadow it
```js
import { h } from '/dist/fluxaway.js';
import { Navbar } from '/dist/fluxaway-components-nav.js';
import { ThemeToggle } from '/dist/fluxaway-components-theme.js';

export function TopBar({ links }) {
  return h('header', { className: 'a-topbar' },
    h(Navbar, { brand: 'My App', items: links, actions: h(ThemeToggle) }),
  );
}
```

Below 768px — and above it while the links do not fit on the bar — the
`ThemeToggle` collapses into the ☰ menu with the links (§9 Navbar). That is the intended default; it stays mounted there, so the saved
theme still applies.

**`components/TopBar.css`** — paired, imported by `styles.css`
```css
.a-topbar { position: sticky; top: 0; z-index: var(--m-z-appbar); }
```

**`components/Pricing.js`** — maps over props data; `Card` and a link-`Button`, prefix `a-` for its own classes
```js
import { h } from '/dist/fluxaway.js';
import { Button, Card } from '/dist/fluxaway-components-core.js';
import { formatPrice } from './format.js';

export function Pricing({ plans }) {
  return h('section', { className: 'a-pricing', id: 'pricing' },
    h('h2', { className: 'a-pricing-title' }, 'Plans'),
    h('div', { className: 'a-pricing-grid' },
      plans.map((plan) =>
        h(Card, { key: plan.id, className: 'a-plan' },
          h('h3', null, plan.name),
          h('p', { className: 'a-plan-price' }, formatPrice(plan.price)),
          h('ul', null,
            plan.features.map((f) => h('li', { key: f }, f))
          ),
          h(Button, { variant: 'contained', href: 'mailto:hello@example.com' }, 'Get started'),
        )
      ),
    ),
  );
}
```

**`components/Pricing.css`** — paired CSS: layout only, colors and spacing from `--m-*`
```css
.a-pricing       { padding: var(--m-space-12) var(--m-space-4); text-align: center; }
.a-pricing-title { font-size: var(--m-font-size-3xl); margin: 0 0 var(--m-space-8); }
.a-pricing-grid  { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--m-space-6); max-width: 800px; margin: 0 auto; }
.a-plan ul       { list-style: none; padding: 0; margin: 0 0 var(--m-space-6); color: var(--m-text-muted); }
.a-plan-price    { font-size: var(--m-font-size-2xl); font-weight: 700; color: var(--m-primary); margin: var(--m-space-2) 0 var(--m-space-5); }
```

**`styles.css`** — central entry point, collects all component CSS
```css
@import './components/TopBar.css';
@import './components/Pricing.css';

html { scroll-behavior: smooth; scroll-padding-top: 60px; } /* anchors clear the sticky header's closed height (§9) */

.a-page { min-height: 100vh; }
```

`@import` must come first, so every rule written below it is **later in the
cascade than all component CSS** and wins any tie in specificity. Keep this file
to element-level globals (`html`, `body`, the page shell). A class rule that also
lives in a paired file — `.a-plan { … }` here and in `Pricing.css` — silently
overrides the component; put it in the paired file instead.

**`app.js`** — orchestrator: imports data + components, calls render
```js
import { h, render } from '/dist/fluxaway.js';
import { NAV_LINKS, PLANS } from './data.js';
import { TopBar }  from './components/TopBar.js';
import { Pricing } from './components/Pricing.js';

function App() {
  return h('div', { className: 'a-page' },
    h(TopBar, { links: NAV_LINKS }),
    h('main', null,
      h(Pricing, { plans: PLANS }),
    ),
  );
}

render(App, document.getElementById('app'));
```

### The same app from the CDN (no local `/dist/`)

Replace **every** `/dist/…` specifier — in `index.html` and in each `.js` file —
with the full CDN URL (§2):

```js
import { h } from 'https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway.js';
import { Button, Card } from 'https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/fluxaway-components-core.js';
```

**The URL must be character-for-character identical in every file.** The
browser keys ES modules by URL, so two spellings of `fluxaway.js` load the
framework **twice**, and the two copies do not share render state. The symptom
is a blank page and, in the console, `FluxaWay: render failed … useState can
only be used during rendering`. All of these create a second copy:

- a different ref in one file (`@main` here, a release tag there);
- a query string on some imports (`fluxaway.js?v=2`) — the component modules
  import `./fluxaway.js` internally, without it;
- mixing builds: `fluxaway.js` with `fluxaway-components-core.min.js`. The
  `.min.js` files import their `.min.js` siblings — use **all** `.min.js` or none;
- a CDN import in one file and a `/dist/` import in another.

The barrel (`fluxaway-components.js`) and the category modules of the **same**
ref mix freely: the barrel only re-exports those same URLs.

To write the URL **once**, add an import map to `index.html`, before the module
script (supported by every evergreen browser):

```html
<script type="importmap">
{ "imports": { "/dist/": "https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/" } }
</script>
```

With it, every file keeps the `/dist/…` imports exactly as written in this
document. The stylesheet `<link>` is not a module: give it the full CDN URL.

---

## 15. Quick gotcha checklist

Before submitting any FluxaWay code, verify:

**Validation (§3)**
- [ ] Code was verified by serving over HTTP (`python server.py` / `python -m http.server`) and checking the browser console — **never** with `node`, `npm test` or `npx`
- [ ] In this repo: `python scripts/validate_fluxaway.py` and `python scripts/run_browser_tests.py` pass. In an app of your own those scripts do not exist and nothing replaces them: the line above — served over HTTP, console clean, every interaction tried — **is** the check

**Right module for the task (§1 table)**
- [ ] Presentation / slide deck / zoom tour → built on **ZoomStage** (`fluxaway-zoom.js`), not scroll-snap sections or an external slides library
- [ ] Animations with keyframes/sequencing → **fluxaway-motion** (`useTimeline`), not hand-rolled rAF loops or GSAP
- [ ] Node graphs / flowcharts → **PipelineCanvas**; embedded code editing → **FullCodeEditor**

**FluxaWay runtime rules**
- [ ] `render(App, container)` — function ref, not `h(App)`
- [ ] Context uses `ctx.provide(value, () => h(...))`, not a Provider component
- [ ] Every list has `key` props
- [ ] No hooks inside `if` / loops / nested functions
- [ ] Events are camelCase: `onClick`, `onChange`, `onInput`
- [ ] CSS classes use `className`, not `class`
- [ ] `for` attribute uses `htmlFor`
- [ ] aria-* attributes use camelCase: `ariaLabel`, `ariaHidden`, etc.
- [ ] aria-* boolean-ish values are the string `"true"`/`"false"`, not a JS boolean
- [ ] Style is a camelCase object: `{ fontSize: '1rem' }` not `{ 'font-size': '1rem' }`
- [ ] SVG presentation attributes are the opposite: real hyphenated names as quoted keys — `'stroke-width'`, not `strokeWidth` (§8)
- [ ] `useEffect` cleanup returns a function (not a Promise)
- [ ] Conditional rendering uses `&&` or ternary — no returning `undefined` without `null`
- [ ] Elements with `innerHTML` have **no children** and never receive unsanitized input
- [ ] SSR pages call `renderToString()` **before** `renderHeadToString()` (the first collects, the second consumes)
- [ ] Exit animations go through `usePresence` — a vnode that just disappears removes its DOM node instantly, skipping any CSS transition

**Project structure (multi-section apps)**
- [ ] Each visual section / feature is its own component file in `components/`
- [ ] Each component has a paired `.css` file with the same base name
- [ ] `styles.css` collects component CSS via `@import` — components don't import CSS
- [ ] Static/mock data lives in `data.js` as `UPPER_CASE` named exports
- [ ] `app.js` only imports, orchestrates top-level state, and calls `render()`
- [ ] No `src/` wrapper, no `pages/`, no `store/`, no `utils/` directories — a small pure helper is its own lower-case module named after what it does (`format.js`)
- [ ] Flat `components/` by default; a domain subfolder (`components/auth/`) only when 3+ `.js` files share that feature — never by type, never by component count
- [ ] Domain hooks live inside their domain folder (`components/auth/useAuth.js`), not a top-level `hooks/`
- [ ] A domain needing shared state owns its own `createContext` next to its hook (`cart/CartContext.js`) — providers are composed by nesting `.provide()` calls in `app.js`, never via a separate component that takes `children` as a prop
- [ ] CSS class names use a project-wide prefix (e.g. `l-`, `tm-`, `a-`) not `m-*`
- [ ] Large apps (many pages): route-level pages load via `lazy: () => import(...)` + `fallback`, and are **not** statically imported anywhere — a leftover static import silently defeats the split (§12)
- [ ] Large apps: page CSS is split too — `styles.css` keeps only the critical shell; each lazy route declares its domain CSS via `css:` (or `loadCSS`), not via a global `@import` that loads every page's styles up front (§12)
- [ ] `createLazy(...)` is called at module scope, never inside a component body
