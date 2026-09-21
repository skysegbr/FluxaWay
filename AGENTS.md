# AGENTS.md — FluxaWay project memory

Shared, durable context for any AI agent working in this repository
(Claude Code, Codex, Copilot, Cursor, …). `CLAUDE.md` imports this file, so
this is the single source of truth — edit here, not in a per-tool copy.

This file is **memory**, not a tutorial. It records what is non-obvious,
easy to get wrong, and expensive to rediscover. For how to *write* FluxaWay
code, follow the routing table in §2 instead of guessing from this file.

---

## 1. The one rule that overrides everything: no Node

FluxaWay uses **no Node.js anywhere** — not as a runtime, not as a bundler,
not in CI, not for tests. This is an architectural decision (supply-chain
surface + maintenance cost), not a gap to fill. All tooling is Python 3
standard library, plus `playwright` (installed via pip) for browser tests.

Consequences an agent must internalize:

- **Never** run `node file.js`, `node --check`, `npm test`, `npx <anything>`
  against this code. FluxaWay modules are *browser* ES modules: they touch
  `document`/`window` and import absolute `/dist/...` specifiers that only
  resolve when served over HTTP. A Node failure here proves nothing — it is
  noise, and acting on it produces wrong "fixes".
- `package.json` is **private editor/TypeScript metadata**, not an npm
  manifest (`"private": true`, never published). Do not evaluate it against
  npm packaging standards or propose npm scripts, subpath export polish, or
  a `repository` field. Their absence is deliberate.
- Distribution = vendored `dist/` files or the jsDelivr CDN
  (`https://cdn.jsdelivr.net/gh/skysegbr/FluxaWay@vX.Y.Z/dist/...`).
- Validation is always: **served over HTTP, judged in a browser.**
  `python server.py` → open the page → the console is the truth.

If you think a task needs Node, the task is wrong or there is a Python path
for it. Say so; do not install Node.

---

## 2. Read the right doc before acting

| If the task is… | Read | Do NOT rely on |
|---|---|---|
| Writing/editing FluxaWay **app or framework code** | `docs/AI_SPEC.md` (esp. §3 CRITICAL RULES, §12 structure) | React knowledge |
| Running **QA / a release pass** | `docs/AI_QA.md` (gates) + `docs/AI_QA_SCENARIOS.md` (case IDs) | ad-hoc spot checks |
| Quick orientation for an LLM | `llms.txt` | — |
| Human-facing overview, component tables, CDN/SRI | `README.md` | — |
| What changed and when | `CHANGELOG.md` | git log alone |
| Charts/dashboards, motion, ZoomStage, canvas, editor | `docs/AI_SPEC.md` §10 | inventing your own |
| Brand, logo, colors | `docs/BRAND.md` | — |

`AI_SPEC.md` is for *generating* code. `AI_QA.md` is for *verifying* it.
They are not interchangeable.

**FluxaWay is not React.** The API rhymes with it and behaves differently.
The four that bite hardest:

1. `h(Component, props)` executes the component **immediately** (eager, not
   deferred). `cond && h(Spinner)` occupies no slot.
2. `render(App, container)` takes a **function reference** — never
   `render(h(App), ...)`, which throws "App can only be used during rendering".
3. Context has **no Provider component**: `ctx.provide(value, () => h(Child))`.
4. `useState` setter identity changes every render — wrap callbacks passed
   to children in `useCallback` before using them as effect dependencies.

---

## 3. Repo layout: what is source and what is generated

There is **no `src/`**. `dist/` holds hand-written source *and* generated
output side by side. Editing a generated file is silently reverted the next
time its generator runs.

| Path | Nature |
|---|---|
| `dist/fluxaway*.js` (non-`.min`) | **SOURCE** — hand-edited, ships as-is |
| `dist/fluxaway-ui.css` | **SOURCE** of the whole stylesheet |
| `dist/*.min.js`, `dist/*.min.css` | GENERATED → `python scripts/minify.py` |
| `dist/fluxaway-ui-{base,core,forms,overlay,data,nav,theme}.css` | GENERATED → `python scripts/split_css.py` |
| `dist/*.d.ts` | hand-maintained; keep in sync when the API changes |
| `examples/<name>/` | apps, each self-contained; also the QA surface |
| `tests/` | browser test suite (plain ESM, no framework), entry `tests/index.html` |
| `scripts/*.py` | all maintenance tooling; stdlib + playwright only |
| `server.py` | dev server + SSE live reload (`dist/fluxaway-hmr.js` is the client) |
| `build/`, `tools/` | **gitignored** — bundler output and the locally built esbuild |

Order matters when both are stale: **split CSS first, then minify** (the
minifier reads the category files the splitter writes).

Example app conventions (enforced by review and partly by the validator):
one component per file under `components/`, its CSS as a **sibling file with
the same base name** in the same folder, static data in `data.js`, root
`styles.css` that only `@import`s the component CSS, `app.js` orchestrates
and nothing else. No `src/` wrapper, no parallel `styles/` tree. A single
monolithic `app.js` is acceptable only for throwaway demos; the validator
warns past a 250-line-per-component-file monolith guard.

The published documentation site is **not in this repository**. It lives in the
separate `fluxaway-docs-site` project (formerly `examples/docs-site`, split out
with its history), which vendors this repo's `dist/`, `assets/`, `docs/`,
`README.md`, `CHANGELOG.md` and the public examples through its
`scripts/sync_fluxaway.py`. Two consequences here: renaming or removing an
example, a `docs/*.md` file or a `dist/` module can break the docs site's next
sync, and its browser smoke no longer runs in this repo's CI — after such a
change, run that project's sync and smoke before releasing.

---

## 4. Commands (Python 3, from repo root)

```bash
# dev
python server.py                 # http://localhost:8000, live reload, localhost-only
python server.py --host 0.0.0.0  # exposes the WHOLE repo on the LAN — deliberate use only

# blocking gates, fast → slow (CI runs 1.1–1.5; see docs/AI_QA.md §1)
python3 scripts/validate_fluxaway.py            # imports, assets, brackets, version sync
python3 scripts/split_css.py --check            # category CSS up to date
python3 scripts/minify.py --check               # .min.* up to date
python3 scripts/check_tutorial_selectors.py     # tutorial recorders hit live selectors
python3 scripts/validate_chart_palette.py       # + --sequential, --diverging
python3 scripts/run_browser_tests.py --browser chromium   # then firefox, then webkit

# regenerate derived files after editing a source, then re-run the --check
python3 scripts/split_css.py && python3 scripts/minify.py

# optional
python3 scripts/bundle.py <app> --smoke   # production bundle + headless self-check
python3 scripts/benchmark_examples.py     # payload/timing vs docs/benchmarks
```

The browser suite **must pass on all three engines**. A chromium-green /
webkit-red result is a real bug, not flake — report the engine.

Local env note: playwright lives under `python3` (3.12) here. If a script
reports a missing playwright, you picked the wrong interpreter, not a
missing gate.

---

## 5. Release process

Releases are cut on a branch, never straight on `main`:

1. Branch off `main`.
2. `chore(release): prepare X.Y.Z` — one commit bumping **10 version
   occurrences** across 4 files plus the changelog entry:
   - `package.json` (1)
   - `README.md` (7 — CDN URLs, SRI example, the `@vX.Y.Z` prose mention,
     and the `?v=X.Y.Z` cache-busting note)
   - `docs/AI_SPEC.md` (1), `docs/TUTORIAL.md` (1)
   - `CHANGELOG.md` — a `## [X.Y.Z]` heading (the validator **fails** if
     `package.json`'s version has no matching heading)
3. Run the full gate set **at the merge commit**, not just on the branch.
4. `git merge --no-ff` into main with subject `merge: release FluxaWay vX.Y.Z`.
5. Annotated tag `vX.Y.Z`, message `FluxaWay vX.Y.Z`.
6. After the push, purge jsDelivr for **every file the release changed** —
   `git diff --name-only vPREV vX.Y.Z -- dist docs/AI_SPEC.md`, each one through
   `https://purge.jsdelivr.net/gh/skysegbr/FluxaWay@main/<path>` — then check with
   a real browser, not `curl`. After 0.25.2 `curl` got the new files while
   browsers kept the old ones: jsDelivr caches the **Brotli** variant separately.
   `curl --compressed -H "Accept-Encoding: br"` sees what a browser sees; the
   tutorial project's `conferir_achados.py` without `--dist` is the full check.
7. Then move the docs: in `fluxaway-docs-site`, sync `--ref vX.Y.Z` and bump its
   own CDN pin (`site/content/css/guides.js`) — that pin left this repo with the app.

`grep -rn "0\.22\.10" --include='*.md' --include='*.js' --include='*.json' . | grep -v build/`
is the reliable way to find every pin before bumping.

Commit subjects follow Conventional Commits with a scope, e.g.
`feat(charts):`, `fix(server):`, `refactor(docs):`, `docs(site):`,
`chore(release):`, `merge: release FluxaWay vX.Y.Z`.

---

## 6. Traps learned the hard way

- **The validator's JS lexer has no regex-literal state.** `balanced_brackets_error()`
  in `scripts/validate_fluxaway.py` walks the source tracking strings,
  template literals and comments — but not `/.../` regexes. A regex literal
  containing a quote, a backtick, or an unbalanced bracket flips the lexer
  into a phantom string state and fails the **blocking** gate 1.1 with a
  nonsense `unexpected ')' at L:C`. Workaround: build the pattern with
  `new RegExp("...")`, or escape the offending char. (Vendored CodeMirror is
  excluded from the scan for exactly this reason.)
- **`docs/AI_QA.md` §7 references `scripts/sync_legacy_aliases.py`, which does
  not exist.** Skip that line; it is a stale cheat-sheet entry, not a missing file.
- `build/` and `tools/` are gitignored — so are `docs/qa-evidence/`,
  `docs/QA_REPORT_*.md`, and the exploratory runners `run_example_qa.py`,
  `run_hmr_test.py`, `run_priority_flows.py`. Those runners exist locally and
  are useful, but do not expect them in a fresh clone or in CI.
- CI = `.github/workflows/ci.yml`: static validation + the two `--check`
  sync gates + tutorial selectors, then the browser suite across
  chromium/firefox/webkit. The docs-site smoke runs in the `fluxaway-docs-site`
  project's own CI.
- Optional designs are descendant-scoped. A wrapper with
  `data-design="metallic"`, `data-metal-theme="cobalt"` and the current
  `data-theme` can skin only its contained controls; it also skins *every*
  FluxaWay descendant in that wrapper. Keep a local design wrapper as narrow
  as the intended component group. `useDesign()` remains the global `<html>`
  switcher; do not call it when the requirement is “Cobalt buttons only.”
- Chart colors are validated, not decorative. `scripts/validate_chart_palette.py`
  recomputes lightness/chroma/contrast/colorblind guarantees from the tokens
  in `dist/fluxaway-charts.css`, and asserts every `:root` token exists in all
  three theme scopes. Never hand-pick a chart hex. The charts CSS is
  **required** — it carries the palette tokens.
- Prefer the first-party add-on over any third-party library: charts →
  `fluxaway-charts` (never Chart.js/D3/Recharts, never hand-rolled
  `stroke-dasharray` arcs); animation → `fluxaway-motion` (never GSAP, never a
  hand-rolled rAF loop); presentations/decks → `ZoomStage` (`fluxaway-zoom`),
  not scroll-snap sections; node graphs → `PipelineCanvas`; embedded code
  editor → `FullCodeEditor` (needs the local `assets/codemirror/`, no CDN).
- ZoomStage selection and camera settlement are different moments. Keep
  navigation UI on `onIndexChange`, but start destination content motion from
  `onSettledIndexChange` or `frame.render({ settled })`; resetting an incoming
  timeline at selection time blanks it while the camera is still travelling.
  Use the small Glide/Arc/Dolly/Orbit/Focus grammar, `duration: "auto"`, and
  `frame.camera`/non-card surfaces instead of reproducing one rotated rectangle
  layout. `examples/zoom-lab` is the canonical comparison surface.
- Button interaction studies are public component API, not example-local CSS.
  Use `Button.effect` with one of `BUTTON_EFFECTS` (`reflection`, `edge`,
  `split`, `aperture`, `charge`, `corners`, `pulse`, `phase`, `conductor`)
  instead of copying their selectors into an app. Metallic themes specialize
  the same effects through material tokens; `conductor` has an exact recipe
  for every finish.
- A repeating Motion timeline must return every animated property to its
  initial visual state before wrapping. With `stagger()`, explicit duration
  must include the last track's offset: `endMs + (count - 1) * eachMs`.
  Otherwise the loop or its final staggered items jump at the seam.
- Screen-by-screen landing navigation is a measured layout contract. Reuse a
  shared shell and proportional geometry; after a real Next/anchor navigation,
  verify the destination's primary content and following transition fit the
  intended desktop viewport. Keep natural vertical flow on mobile. See
  `docs/AI_SPEC.md` §3 and §10 and `examples/inox-landing`.
- **The public imports `@main`.** `docs/AI_SPEC.md` §2 and the tutorial prompts
  point at `cdn.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/…`, so every push to
  `main` that touches `dist/` is live for users (jsDelivr caches a branch for up
  to 12h; `https://purge.jsdelivr.net/gh/skysegbr/FluxaWay@main/dist/<file>`
  forces it). Behavior changes land on a branch and reach `main` together.
- **Text a component writes on its own is a prop with an English default**, in the
  existing convention: `closeLabel`, `ariaLabel`, `placeholder`, `emptyLabel`,
  `requiredLabel`, `openMenuLabel`… A new component that needs an `aria-label` or
  a placeholder takes it as a prop; it never hard-codes the string and never
  reads a global table. `tests/labels.test.js` holds the contract.
- **Whoever sets `--m-primary` sets `--m-on-primary` in the same rule** (same for
  `--m-danger` / `--m-on-danger`). The fill is dark in the light theme and light
  in the dark one, so a fixed `#fff` reads ~1.8:1 in dark. Never write
  `color: #fff` on a `var(--m-primary)` background — `tests/button.test.js` walks
  every palette × theme at 4.5:1 and asserts the pairing across the stylesheet.
  The metallic design deliberately inherits the theme token: its own
  `--mx-on-primary` is tuned for the dark-core button only.
- **One URL spelling per module, or the framework loads twice.** ES modules are
  keyed by URL and the component modules import `./fluxaway.js` internally, so an
  app importing `fluxaway.js?v=2`, or `fluxaway.js` next to
  `fluxaway-components-core.min.js` (the `.min.js` files import their `.min.js`
  siblings), gets two cores, a blank page and `useState can only be used during
  rendering`. Never suggest a query string on a module URL. AI_SPEC §14 has the
  import-map recipe.
- **A CSS rule ships in the category of the section banner it sits under**, not of
  the class it names. `split_css.py` is lossless by design and cannot tell that
  `.m-dialog-header-draggable` typed inside `/* ── CodeEditor ── */` belongs to
  overlay — it shipped in `fluxaway-ui-forms.css` for that reason. Add a rule
  next to its component's other rules; `tests/spec-parity.test.js` guards `.m-dialog`.
- **A click is a `mousedown` and a `mouseup` on the same element — and tests
  press for 0 ms.** Anything that moves the layout on blur (an error line, a
  collapsing panel) slides the pressed control out from under a real pointer and
  the browser fires no `click`. `el.click()`, a dispatched `MouseEvent` and
  Playwright's `page.click()` all pass regardless. Such a bug is only visible to
  `mouse.down()` → wait ~120 ms → `mouse.up()`: that is the trusted-input phase
  of `run_browser_tests.py` (`tests/trusted-input.html`). `useForm` defers blur
  work while the primary button is down for this reason (`trackPress` in
  `dist/fluxaway.js`); do not "simplify" it to `relatedTarget` — that is the
  Submit button for a click *and* for Tab, and `null` on macOS Safari.
- **`Navbar` collapses by measuring, not by breakpoint — and the CSS around it is
  load-bearing.** From 768px up it puts `.m-navbar-measuring` on for one
  synchronous reading and asks whether the links stayed on one line. Three things
  look like cleanup and are not: (1) the inline list keeps `flex-wrap: wrap` plus
  `max-height` — with `nowrap` the bar's min-content becomes the whole row, and a
  grid/flex-item parent (min-width: auto) is pushed out to it, so the bar measures
  itself in room it just made; (2) the measuring rules never touch the wrap's
  `display`, `grid-template-rows`, `visibility` or `transition`, or a reading
  taken on the render that opens the menu kills its animation and re-opens the
  220ms focusable-while-hidden window; (3) the bar must be the same box fitting
  or not. A `ResizeObserver` callback that resizes what it observes raises
  "ResizeObserver loop completed with undelivered notifications" — a window
  `error` event everywhere, a **page error in WebKit** — which is why the one flip
  that does change the height (menu open) waits for the next frame.
  `run_browser_tests.py` prints page errors but does not fail on them; the Navbar
  sweep scenario reads `window.__errors` for that reason. (4) the state selectors
  are wrapped in `:where()`, which adds **no** specificity, so every rule still
  weighs the one `.m-navbar-*` class it names. Written with `:is()` they weigh
  three, and app CSS overriding those classes with two silently loses from 768px
  up — that shipped in 0.25.3 and broke the docs site's own header at 768-900px.
  A rule whose weight changes is a breaking change even when its declarations do
  not; `tests/coverage.test.js` pins it, and a test for it must assert the bar
  is *not* collapsed, or the rules never apply and it proves nothing.
- **`h(Component)` runs the component on the spot** — outside a render pass it
  throws "can only be used during rendering". That includes test code:
  `renderToString(() => h(Button, …))`, never `renderToString(h(Button, …))`.

---

## 7. Working agreements with the maintainer

- The maintainer (skysegbr / Danilo) writes in Portuguese; the repository —
  code, comments, docs, commit messages — stays in **English**.
- **Do not run `git commit` or `git push` on his behalf.** Write the commit
  message, stage nothing surprising, and hand him the command.
- Reasoned pushback is welcome. If a request is a poor fit for the
  architecture, say so with the reasoning and propose the substitute; do not
  silently comply and do not silently swap.
- Finish the whole task. If part is blocked, complete the rest and say
  plainly what was left out and why.
