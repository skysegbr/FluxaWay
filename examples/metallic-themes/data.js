export const THEME_DIRECTIONS = [
  {
    id: "aurum",
    model: "aurum",
    shortName: "Aurum",
    label: "Aurum / steel blue",
    eyebrow: "PRECISION, WARMTH, AUTHORITY",
    title: "Command with quiet confidence.",
    description:
      "Brushed gold marks decisions and progress. Steel blue carries structure, depth, and calm without returning to the usual teal language.",
    action: "Authorize sequence",
    secondaryAction: "Inspect protocol",
    flowAction: "Flow",
    specimen: "AU—79",
    material: "GOLD / STEEL",
    principles: ["Warm focal points", "Cool structural surfaces", "Editorial geometry"],
    swatches: [
      { name: "Aurum", value: "#B88422" },
      { name: "Steel", value: "#426B91" },
      { name: "Midnight", value: "#111A29" },
      { name: "Platinum", value: "#D8DEE7" },
    ],
  },
  {
    id: "cobalt",
    model: "cobalt",
    shortName: "Cobalt",
    label: "Cobalt / signal red",
    eyebrow: "CLARITY, VELOCITY, CONTROL",
    title: "Make every signal unmistakable.",
    description:
      "Metallic blue owns navigation and primary action. Signal red appears selectively for urgency, energy, and memorable contrast.",
    action: "Engage network",
    secondaryAction: "Review signal",
    flowAction: "Flow",
    specimen: "CO—27",
    material: "COBALT / RED",
    principles: ["Blue operational core", "Red as deliberate signal", "Industrial geometry"],
    swatches: [
      { name: "Cobalt", value: "#3169B8" },
      { name: "Signal", value: "#B73542" },
      { name: "Gunmetal", value: "#151C27" },
      { name: "Titanium", value: "#CAD2DD" },
    ],
  },
  {
    id: "cobalt-aurum",
    model: "cobalt",
    shortName: "Cobalt Au",
    label: "Cobalt form / Aurum color",
    eyebrow: "SAME FORM, DIFFERENT TEMPERATURE",
    title: "One machine. A warmer signal.",
    description:
      "The industrial Cobalt construction stays untouched. Gold now drives interaction while steel blue holds the system together.",
    action: "Authorize network",
    secondaryAction: "Inspect protocol",
    flowAction: "Flow",
    specimen: "CA—79",
    material: "GOLD / STEEL",
    principles: ["Cobalt construction", "Aurum color system", "The same recognizable Flowframe"],
    swatches: [
      { name: "Aurum", value: "#B88422" },
      { name: "Steel", value: "#426B91" },
      { name: "Gunmetal", value: "#151C27" },
      { name: "Platinum", value: "#D8DEE7" },
    ],
  },
  {
    id: "inox",
    model: "cobalt",
    shortName: "Inox",
    label: "Brushed inox / graphite",
    eyebrow: "DISCIPLINE, CLARITY, ENDURANCE",
    title: "Precision without visual noise.",
    description:
      "Cold stainless reflections define controls and edges. Graphite gives the interface weight while a restrained blue-grey signal keeps it operational.",
    action: "Calibrate",
    secondaryAction: "Inspect finish",
    flowAction: "Flow",
    specimen: "SS—304",
    material: "INOX / GRAPHITE",
    principles: ["Brushed directional light", "Graphite structural depth", "Low-saturation precision"],
    swatches: [
      { name: "Inox", value: "#AEBCC7" },
      { name: "Graphite", value: "#35424D" },
      { name: "Blue steel", value: "#607E91" },
      { name: "Chrome", value: "#EEF3F6" },
    ],
  },
  {
    id: "bronze",
    model: "aurum",
    shortName: "Bronze",
    label: "Aged bronze / patina",
    eyebrow: "HERITAGE, CRAFT, PERMANENCE",
    title: "Built to age with character.",
    description:
      "Burnished bronze carries the primary actions. Dark umber anchors the system and a controlled mineral patina gives the material history without making it ornamental.",
    action: "Forge authority",
    secondaryAction: "Inspect patina",
    flowAction: "Flow",
    specimen: "BR—88",
    material: "BRONZE / PATINA",
    principles: ["Burnished copper highlights", "Patina as secondary signal", "Crafted editorial geometry"],
    swatches: [
      { name: "Bronze", value: "#A7622E" },
      { name: "Umber", value: "#4A2A1A" },
      { name: "Patina", value: "#63857B" },
      { name: "Polished", value: "#E0A56D" },
    ],
  },
  {
    id: "ferrum",
    model: "cobalt",
    shortName: "Ferrum",
    label: "Oxidized iron / ember",
    eyebrow: "RESILIENCE, FORCE, HONESTY",
    title: "Wear becomes part of the machine.",
    description:
      "Blackened iron forms the chassis. Oxide orange appears at stressed edges and active controls, turning weathering into a deliberate system signal.",
    action: "Activate foundry",
    secondaryAction: "Inspect oxide",
    flowAction: "Flow",
    specimen: "FE—26",
    material: "IRON / OXIDE",
    principles: ["Blackened iron surfaces", "Oxide at points of energy", "Rugged industrial geometry"],
    swatches: [
      { name: "Iron", value: "#3E4B52" },
      { name: "Oxide", value: "#A84C23" },
      { name: "Ember", value: "#D4773E" },
      { name: "Scale", value: "#171C20" },
    ],
  },
  {
    id: "black-inox",
    model: "cobalt",
    shortName: "Inox Black",
    label: "Black inox / chrome",
    eyebrow: "STEALTH, PRECISION, CONTROL",
    title: "Light reveals the machine.",
    description:
      "A near-black stainless chassis absorbs the interface. Chrome and cold-steel reflections appear only on active edges, keeping the material severe without becoming flat.",
    action: "Arm sequence",
    secondaryAction: "Inspect coating",
    flowAction: "Flow",
    specimen: "BX—316",
    material: "BLACK INOX / CHROME",
    principles: ["PVD-black structural surfaces", "Chrome at active edges", "Controlled low-light contrast"],
    swatches: [
      { name: "Black inox", value: "#242A2E" },
      { name: "Graphite", value: "#4B565D" },
      { name: "Chrome", value: "#DCE3E7" },
      { name: "Carbon", value: "#07090A" },
    ],
  },
];

export const METRICS = [
  { label: "Network integrity", value: "99.98%", delta: "+0.14", code: "NX" },
  { label: "Active relays", value: "284", delta: "+18", code: "RL" },
  { label: "Decision latency", value: "18 ms", delta: "-6 ms", code: "LT" },
];

export const SYSTEMS = [
  { name: "Core routing", detail: "12 nodes synchronized", value: 94 },
  { name: "Identity mesh", detail: "Policy set 7A verified", value: 82 },
  { name: "Edge reserve", detail: "Adaptive capacity online", value: 71 },
];

export const ACTIVITY = [
  { time: "09:42", title: "Sequence approved", detail: "Policy AU-204 propagated" },
  { time: "09:38", title: "Relay balanced", detail: "North corridor · 32 ms" },
  { time: "09:31", title: "Integrity verified", detail: "No drift detected" },
];

export const BUTTON_EFFECT_DETAILS = {
  reflection: {
    name: "Reflection",
    label: "Reflect",
    description: "A specular band crosses the surface and retraces its path on exit.",
  },
  edge: {
    name: "Edge runner",
    label: "Route",
    description: "A current travels through the frame without filling the control.",
  },
  split: {
    name: "Split current",
    label: "Merge",
    description: "Two material fields enter from opposite sides and lock together.",
  },
  aperture: {
    name: "Aperture",
    label: "Open",
    description: "The active material opens radially from the center of the button.",
  },
  charge: {
    name: "Surface charge",
    label: "Charge",
    description: "A resting energy rail rises to charge the entire surface.",
  },
  corners: {
    name: "Corner trace",
    label: "Lock",
    description: "Opposing corners extend into a precise acquisition frame.",
  },
  pulse: {
    name: "Signal echo",
    label: "Confirm",
    description: "A single confirmation echo expands beyond the control boundary.",
  },
  phase: {
    name: "Phase shift",
    label: "Shift",
    description: "The control transitions between both metals through a diagonal phase.",
  },
  conductor: {
    name: "Conductor",
    label: "Conduct",
    description: "A theme-derived metallic reflection travels through the contour while the core stays quiet.",
  },
};

export const SEMANTIC_BUTTONS = [
  { id: "text", label: "Text", variant: "text" }, { id: "contained", label: "Contained", variant: "contained" },
  { id: "tonal", label: "Tonal", variant: "tonal" }, { id: "outline", label: "Outline", variant: "outline" },
  { id: "danger", label: "Danger", variant: "danger" },
];

export const SEMANTIC_ALERTS = [
  { id: "info", variant: "info", title: "System information", message: "A new relay configuration is available for review." },
  { id: "success", variant: "success", title: "Sequence completed", message: "All network policies were applied successfully." },
  { id: "warning", variant: "warning", title: "Capacity warning", message: "Edge reserve is approaching the configured threshold." },
  { id: "danger", variant: "danger", title: "Deployment blocked", message: "The integrity signature does not match the approved build." },
];

export const SEMANTIC_STATUSES = [
  { id: "online", label: "Online", tone: "success" }, { id: "review", label: "Review", tone: "warning" },
  { id: "blocked", label: "Blocked", tone: "danger" }, { id: "synced", label: "Synced", tone: "info" },
];
