export const MATERIAL_METRICS = [
  { value: "0.02 mm", label: "alignment tolerance" },
  { value: "60 FPS", label: "motion target" },
  { value: "0 build", label: "delivery pipeline" },
];

export const SYSTEMS = [
  {
    number: "01",
    title: "Directional grain",
    text: "Light moves across the interface like it moves across brushed steel: controlled, narrow and intentional.",
    meta: "surface / reflection",
  },
  {
    number: "02",
    title: "Mechanical timing",
    text: "Entrances lock into place instead of floating. Every easing communicates weight, fit and final position.",
    meta: "timeline / outCubic",
  },
  {
    number: "03",
    title: "Pressure states",
    text: "Hover, focus and active states keep the same alloy language while preserving semantic meaning.",
    meta: "interaction / feedback",
  },
  {
    number: "04",
    title: "Native assembly",
    text: "Components, imagery and motion arrive as browser modules. No bundler is required to put the system together.",
    meta: "ESM / no build",
  },
];

export const ASSEMBLY_STEPS = [
  { id: "raw", label: "Separate", time: 0 },
  { id: "inspect", label: "Inspect", time: 1450 },
  { id: "locked", label: "Lock", time: 3000 },
];
