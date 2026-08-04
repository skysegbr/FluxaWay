export const SECURITY_PILLARS = [
  {
    icon: "bi-shield-check",
    title: "Small supply-chain surface",
    body:
      "FluxaWay has zero runtime dependencies and no node_modules tree. Browser-native ES modules avoid the transitive package chain that normally needs continuous auditing and patching.",
  },
  {
    icon: "bi-link-45deg",
    title: "Safer untrusted URLs",
    body:
      "The safeUrl() utility rejects dangerous schemes such as javascript:, vbscript: and non-image data: URLs before they reach href or src attributes.",
  },
  {
    icon: "bi-eye",
    title: "Reviewable output",
    body:
      "Plain JavaScript, local assets and explicit imports keep generated code understandable. AI output can be inspected without unpacking a bundler or hidden dependency graph.",
  },
];

export const AI_WORKFLOW = [
  {
    title: "1. Put AI_SPEC in context",
    body:
      "Ask the assistant to read docs/AI_SPEC.md completely before it proposes an architecture or writes code. The spec describes FluxaWay's eager rendering model, modules, add-ons and critical constraints.",
  },
  {
    title: "2. Describe the outcome",
    body:
      "State the product goal, users, screens, data and required interactions. Mention an existing example when you want the assistant to reuse a proven pattern.",
  },
  {
    title: "3. Make constraints explicit",
    body:
      "Name the allowed modules, no-Node rule, file structure, accessibility needs, trust boundaries and any data that must be sanitized or validated.",
  },
  {
    title: "4. Define proof of completion",
    body:
      "Require browser checks at mobile and desktop widths, a clean console, keyboard navigation and the Python validation commands from AI_SPEC.",
  },
];

export const AI_PROMPT_TEMPLATE = `You are building an application with FluxaWay.

Before writing code:
1. Read docs/AI_SPEC.md completely and treat it as the source of truth.
2. Inspect the relevant existing examples and dist module declarations.
3. Summarize the FluxaWay constraints that affect this task.

Goal
- [Describe the user outcome and the screens or flow to build.]

Requirements
- [List the content, data, interactions and responsive behavior.]
- Reuse FluxaWay components and first-party add-ons before creating custom UI.
- Import only the component categories used by each page.

Architecture
- Follow the domain-componentized structure required by AI_SPEC.
- Keep each component beside its matching CSS file.
- Keep app.js focused on composition, routing and shared state.
- Do not add Node, npm packages, bundlers or remote runtime dependencies.

Security and accessibility
- Treat [name all external/user-controlled values] as untrusted.
- Use safeUrl() for user-controlled href and src values.
- Do not inject untrusted HTML or expose secrets in browser code.
- Preserve semantic HTML, keyboard access, focus management and ARIA names.

Validation
- Run the Python validation commands prescribed by AI_SPEC.
- Test in a real browser at mobile and desktop widths.
- Confirm there are no console errors, failed requests or horizontal overflow.

Deliverables
- Implement the requested files.
- Report the files changed, validation performed and remaining risks.`;

export const AI_PROMPT_EXAMPLE = `You are building a customer-support dashboard with FluxaWay.

Read docs/AI_SPEC.md completely before writing code. Follow it when this prompt
and familiar React patterns differ. Inspect examples/dashboard for the chart
composition and examples/mobile for the responsive Navbar pattern.

Goal
- Build a responsive dashboard where support leads can review queue health,
  filter tickets by status and open a ticket detail dialog.

Requirements
- Show four KPIs, a seven-day volume chart and a paginated ticket table.
- Use fluxaway-charts for metrics and charts, DataTable for tickets, Select for
  filters, Dialog for details and Navbar for mobile navigation.
- Load data from /api/support-summary with useFetch and show loading, empty and
  error states.

Architecture
- Split the app into dashboard, filters, tickets and shell components. Pair
  every component with its CSS file and keep static configuration in data.js.
- Import category modules instead of the full component barrel.
- Do not add Node, npm packages, a bundler or third-party chart code.

Security and accessibility
- Treat ticket subjects, customer names, API links and avatar URLs as untrusted.
- Render API text as text, never as innerHTML, and pass external links and image
  sources through safeUrl(). Do not place API credentials in browser code.
- The table, filters, dialog and mobile menu must work from the keyboard and
  expose accessible names.

Validation
- Run python scripts/validate_fluxaway.py and the relevant browser tests.
- Check 390px and 1440px viewports, keyboard navigation, a clean console, failed
  requests, focus restoration and horizontal overflow.

Implement the app, then report changed files, checks run and residual risks.`;

export const AI_CHECKLIST = [
  "AI_SPEC was read before architecture and code generation.",
  "Only documented FluxaWay APIs and first-party add-ons are used.",
  "No Node/npm toolchain or new remote runtime dependency was introduced.",
  "Untrusted text is rendered as text and untrusted URLs pass through safeUrl().",
  "No secret, private token or server credential is shipped to the browser.",
  "Keyboard, focus, responsive layout and browser-console checks are complete.",
];
