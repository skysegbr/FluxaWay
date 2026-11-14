// The island as numbers: how high the ground is, where the player may stand,
// and where things are. Pure math — the 3D world and the 2D map both read it.
// Units are metres; north is -z.

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Seeded, so the island is the same island on every visit.
function hash(ix, iz) {
  let n = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function noise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const top = hash(ix, iz) + (hash(ix + 1, iz) - hash(ix, iz)) * ux;
  const bottom = hash(ix, iz + 1) + (hash(ix + 1, iz + 1) - hash(ix, iz + 1)) * ux;
  return top + (bottom - top) * uz;
}

export function fbm(x, z) {
  return noise(x, z) * 0.57 + noise(x * 2.1, z * 2.1) * 0.29 + noise(x * 4.3, z * 4.3) * 0.14;
}

export function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export const EYE = 1.7;
export const JETTY = { x: 0, z0: 72, z1: 104, half: 1.7, top: 0.9 };
export const START = { x: 0, z: 100, yaw: 0, pitch: 0 };

// Where everything stands: [x, z]. data.js places the hotspots on these.
export const PLACES = {
  crate: [1, 88],
  sign: [3.2, 74],
  cabin: [-26, 30],
  shed: [24, 38],
  mast: [0, -6],
  cairn: [52, -34],
  turbine: [-44, -24],
};

// Things the player cannot walk through: [x, z, radius].
export const SOLIDS = [
  [PLACES.cabin[0], PLACES.cabin[1], 4.6],
  [PLACES.shed[0], PLACES.shed[1], 2.7],
  [PLACES.mast[0], PLACES.mast[1], 1.1],
  [PLACES.cairn[0], PLACES.cairn[1], 1.5],
  [PLACES.turbine[0], PLACES.turbine[1], 1.2],
  [PLACES.sign[0], PLACES.sign[1], 0.5],
  [PLACES.crate[0] + 0.5, PLACES.crate[1], 0.8],
];

export function ground(x, z) {
  const r = Math.hypot(x, z * 1.15); // a little wider than it is deep
  const dome = 16 * smooth(118, 10, r);
  const rough = (fbm(x / 34, z / 34) - 0.5) * 7 * smooth(124, 60, r);
  return dome + rough - 1.6;
}

const onJetty = (x, z) => Math.abs(x - JETTY.x) <= JETTY.half && z >= JETTY.z0 && z <= JETTY.z1;

// The height the player stands at: the ground, or the jetty over the water.
export function height(x, z) {
  const land = ground(x, z);
  return onJetty(x, z) ? Math.max(land, JETTY.top) : land;
}

export function walkable(x, z, solids = SOLIDS) {
  if (!onJetty(x, z) && ground(x, z) < 0.3) return false;
  for (const [sx, sz, radius] of solids) {
    if (Math.hypot(x - sx, z - sz) < radius) return false;
  }
  return true;
}

// The shoreline, for the map: where the ground meets the sea along 96 bearings.
export const COAST = Array.from({ length: 96 }, (_, index) => {
  const angle = (index / 96) * Math.PI * 2;
  let low = 40;
  let high = 140;
  for (let step = 0; step < 18; step += 1) {
    const mid = (low + high) / 2;
    if (ground(Math.cos(angle) * mid, Math.sin(angle) * mid) > 0) low = mid;
    else high = mid;
  }
  return [Math.cos(angle) * low, Math.sin(angle) * low];
});

// Pines: seeded spots on the slopes, clear of the buildings and the way up.
export const TREES = (() => {
  const next = random(9);
  const trees = [];
  for (let attempt = 0; attempt < 900 && trees.length < 80; attempt += 1) {
    const x = (next() - 0.5) * 200;
    const z = (next() - 0.5) * 180;
    const y = ground(x, z);
    const size = 0.8 + next() * 0.7;
    if (y < 1.6 || y > 12.5) continue;
    if (Math.abs(x) < 7 && z > 0) continue; // the path from the jetty
    if (Object.values(PLACES).some(([px, pz]) => Math.hypot(x - px, z - pz) < 10)) continue;
    if (trees.some((tree) => Math.hypot(x - tree.x, z - tree.z) < 4.5)) continue;
    trees.push({ x, z, y, size });
  }
  return trees;
})();
