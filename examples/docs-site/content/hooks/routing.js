import { h, useRouter, matchPath } from "/dist/nexa.js";
import { Badge, Button } from "/dist/nexa-components-core.js";

export const ROUTING_HOOK_ENTRIES = [
  {
    slug: "use-router",
    name: "useRouter",
    category: "hooks-routing",
    module: "nexa.js",
    signature: 'const { path, navigate, params } = useRouter({ mode: "hash" })',
    summary:
      "The router primitive. Hash mode by default, which works on any static host with no server " +
      "configuration — this documentation site runs on it.",
    demos: [
      {
        id: "use-router-basic",
        title: "Reading and changing the route",
        stack: true,
        note: "These buttons drive the real site router — the sidebar selection follows.",
        render: () => {
          const { path, navigate } = useRouter();

          return h(
            "div",
            { className: "nd-stack" },
            h(Badge, null, `path = ${path}`),
            h(
              "div",
              { className: "nd-inline" },
              h(Button, { variant: "tonal", onClick: () => navigate("/components/button") }, "Go to Button"),
              h(Button, { variant: "tonal", onClick: () => navigate("/getting-started") }, "Go to the guide"),
            ),
          );
        },
      },
      {
        id: "use-router-modes",
        title: "Hash versus history",
        note: "History mode needs the server to serve index.html for every app route — a plain static file server will 404 on a refresh.",
        code: `// Hash — "#/dashboard". Works anywhere; a plain <a href="#/dashboard">
// navigates for free, because a hash-only href never reloads the page.
const { path, navigate } = useRouter();

// History — clean "/dashboard" URLs via pushState/popstate. Same-origin
// <a href="/dashboard"> clicks are intercepted automatically, except
// modified clicks (ctrl/cmd/shift/alt, target, download) and same-page
// "#section" fragments, which keep native behavior.
const { path, navigate } = useRouter({ mode: "history" });`,
      },
    ],
    params: [
      {
        name: "mode",
        type: '"hash" | "history"',
        default: '"hash"',
        description: "URL strategy. History mode requires an SPA fallback on the server.",
      },
    ],
    returns: [
      { name: "path", type: "string", description: 'Current path, e.g. "/components/button".' },
      { name: "navigate", type: "(to: string) => void", description: "Goes to a path, pushing history." },
      { name: "params", type: "object", description: "Parsed query parameters." },
    ],
  },

  {
    slug: "use-routes",
    name: "useRoutes",
    category: "hooks-routing",
    module: "nexa.js",
    signature: "const element = useRoutes(routes, { mode, notFound })",
    summary:
      "Nested routing from a config array: path patterns, index routes, an outlet for children, " +
      "and lazy page modules with a fallback. Returns the element to render.",
    imports: "useRoutes, matchPath",
    demos: [
      {
        id: "use-routes-config",
        title: "A nested route config",
        note: "First matching sibling wins, so list specific routes before catch-alls.",
        code: `const routes = [
  { path: "/", element: h(Home, null) },
  {
    path: "/users/:id",
    component: UserLayout,              // gets { params, outlet }
    children: [
      { index: true, component: Profile },          // /users/:id exactly
      { path: "/posts/:postId", component: Post },  // /users/:id/posts/7
      {
        path: "/settings",
        lazy: () => import("./Settings.js"),        // default export
        css: "/components/settings/settings.css",   // loaded with the module
        fallback: h(Spinner, null),
      },
    ],
  },
  { path: "*", component: NotFound },
];

function App() {
  return useRoutes(routes, { notFound: h(NotFound, null) });
}

// A parent renders its matched child through the outlet prop:
function UserLayout({ params, outlet }) {
  return h("div", null, h("h1", null, \`User \${params.id}\`), outlet);
}`,
      },
      {
        id: "use-routes-match",
        title: "matchPath",
        stack: true,
        note: "The segment matcher useRoutes is built on — useful on its own.",
        render: () => {
          const cases = [
            ["/users/:id", "/users/42"],
            ["/users/:id", "/users/42/edit"],
            ["/files/*", "/files/a/b.png"],
          ];

          return h(
            "div",
            { className: "nd-stack" },
            cases.map(([pattern, path]) =>
              h(
                Badge,
                { key: pattern + path },
                `matchPath("${pattern}", "${path}") → ${JSON.stringify(matchPath(pattern, path))}`,
              ),
            ),
          );
        },
      },
    ],
    params: [
      {
        name: "routes",
        type: "Array<Route>",
        description:
          "Route fields: path, index, component, element, lazy, css, fallback, children. Patterns are relative to the parent.",
      },
      { name: "mode", type: '"hash" | "history"', default: '"hash"', description: "Passed through to useRouter." },
      { name: "notFound", type: "VNode", description: "Rendered when nothing matches." },
    ],
    returns: [{ name: "element", type: "VNode | null", description: "The resolved route element." }],
    notes: [
      "A lazy route only helps if the page module is not ALSO statically imported somewhere — FluxaWay is no-build ESM, so any static import chain reachable from app.js is fetched at startup regardless.",
      "useRoutes calls useRouter internally. For navigate in the same component, call useRouter() alongside it — both stay in sync.",
      "matchPath(pattern, path, { end: false }) prefix-matches and returns the remainder in rest; a trailing '*' captures the rest into params['*'].",
    ],
  },
];
