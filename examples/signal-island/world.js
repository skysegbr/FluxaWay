// The island, drawn with Three.js and walked in first person. This is the
// `world` factory GameViewport calls: it owns the renderer and the player, and
// the story (data.js) never sees either.
import * as THREE from "/assets/three/three.module.min.js";
import { EYE, START, height, walkable } from "./terrain.js";
import {
  buildCabin, buildCairn, buildCrate, buildJetty, buildMarker, buildMast,
  buildSea, buildShed, buildSign, buildTerrain, buildTrees, buildTurbine,
} from "./props.js";

const SKY = "#51648f";
const WALK = 5.4; // metres per second
const RUN = 9.5;
const TURN = 1.9; // radians per second, on the keys
const LOOK = 0.0034; // radians per dragged pixel
const TALL = { mast: 24, turbine: 15, cabin: 4 }; // how high to look at a place, in metres

const lerp = (from, to, t) => from + (to - from) * t;

// The shortest way round from one bearing to another.
function turnTowards(from, to) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta;
}

export function createWorld({ canvas, game, input }) {
  // Throws when the browser has no WebGL; GameViewport then shows its message.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 60, 330);

  const camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.1, 900);
  camera.rotation.order = "YXZ";

  scene.add(new THREE.HemisphereLight("#cfdcff", "#3b3524", 1.5));
  const sun = new THREE.DirectionalLight("#ffc48a", 2.4);
  sun.position.set(-120, 60, 160);
  scene.add(sun);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(26, 40),
    new THREE.MeshBasicMaterial({ color: "#ffd9a0", fog: false }),
  );
  disc.position.set(-420, 70, 560);
  disc.lookAt(0, 20, 0);
  scene.add(disc);

  const sea = buildSea();
  const crate = buildCrate();
  const cabin = buildCabin();
  const shed = buildShed();
  const mast = buildMast();
  const turbine = buildTurbine();
  scene.add(buildTerrain(), sea, buildTrees(), buildJetty(), buildSign(), buildCairn());
  scene.add(crate, cabin, shed, mast, turbine);

  // One marker per hotspot, shown while the hotspot is on offer.
  const markers = new Map();
  for (const hotspot of game.sceneData.hotspots) {
    const marker = buildMarker();
    const [x, z] = hotspot.at;
    // The mast's marker hangs over its console, not inside the pole.
    const aside = hotspot.id === "mast" ? 1.4 : 0;
    marker.userData.base = height(x, z) + (hotspot.id === "mast" ? 2.6 : 4.4);
    marker.position.set(x + aside, marker.userData.base, z);
    markers.set(hotspot.id, marker);
    scene.add(marker);
  }

  const player = { ...START };
  const previous = { ...START };
  let turning = null; // { from, to, pitch, elapsed, resolve } while game.focus() runs
  let stride = 0;
  let clock = 0;

  function update(dt) {
    clock += dt;
    Object.assign(previous, player);

    if (turning) {
      turning.elapsed += dt;
      const t = Math.min(1, turning.elapsed / 0.9);
      const eased = t * t * (3 - 2 * t);
      player.yaw = lerp(turning.from, turning.to, eased);
      player.pitch = lerp(turning.pitch, turning.up, eased);
      if (t >= 1) {
        turning.resolve(true);
        turning = null;
      }
      return;
    }

    const look = input.look();
    player.yaw -= look.x * LOOK;
    player.pitch = Math.min(1.2, Math.max(-1.2, player.pitch - look.y * LOOK));
    player.yaw += input.axis("turnRight", "turnLeft") * TURN * dt;

    const move = input.vector("left", "right", "back", "forward");
    if (move.x === 0 && move.y === 0) return;
    const speed = (input.held("run") ? RUN : WALK) * dt;
    const sin = Math.sin(player.yaw);
    const cos = Math.cos(player.yaw);
    // yaw 0 looks north (-z); +x is the player's right.
    const dx = (-sin * move.y + cos * move.x) * speed;
    const dz = (-cos * move.y - sin * move.x) * speed;
    // One axis at a time, so a wall or the shoreline is slid along, not stuck to.
    if (walkable(player.x + dx, player.z)) player.x += dx;
    if (walkable(player.x, player.z + dz)) player.z += dz;

    stride += Math.hypot(player.x - previous.x, player.z - previous.z);
    if (stride > 2.6) {
      stride = 0;
      game.sound("step", { volume: 0.5 });
    }
  }

  function render(alpha) {
    const x = lerp(previous.x, player.x, alpha);
    const z = lerp(previous.z, player.z, alpha);
    camera.position.set(x, height(x, z) + EYE + Math.sin(stride * 2.4) * 0.05, z);
    camera.rotation.y = lerp(previous.yaw, player.yaw, alpha);
    camera.rotation.x = lerp(previous.pitch, player.pitch, alpha);

    // The story decides what the island shows; the island only reads it.
    const power = Boolean(game.get("power"));
    const offered = new Set(game.hotspots().map((hotspot) => hotspot.id));
    crate.visible = offered.has("crate");
    cabin.userData.pane.emissiveIntensity = power ? 0.9 : 0;
    shed.userData.lamp.emissive.set(power ? "#3dff7a" : "#ff3b2f");
    mast.userData.beacon.emissiveIntensity = power ? (game.get("sent") ? 0.4 + 0.9 * Math.abs(Math.sin(clock * 3)) : 0.5) : 0;
    turbine.userData.rotor.rotation.z = clock * 1.4;
    sea.position.y = Math.sin(clock * 0.6) * 0.07;
    for (const [id, marker] of markers) {
      marker.visible = game.started && offered.has(id);
      marker.rotation.y = clock * 1.2;
      marker.position.y = marker.userData.base + Math.sin(clock * 2 + marker.position.x) * 0.25;
    }

    renderer.render(scene, camera);
  }

  return {
    update,
    render,
    resize(width, height_, pixelRatio) {
      renderer.setPixelRatio(Math.min(pixelRatio, 2));
      renderer.setSize(width, height_, false);
      camera.aspect = width / height_;
      camera.updateProjectionMatrix();
    },
    position: () => [player.x, player.z],
    pose: () => ({ x: player.x, z: player.z, yaw: player.yaw }),
    // game.focus("mast"): turn to face a place, and resolve once facing it.
    focus(target) {
      if (!target || !target.at) return Promise.resolve(false);
      const [tx, tz] = target.at;
      const bearing = Math.atan2(-(tx - player.x), -(tz - player.z));
      // Look at the top of the thing, so a wall in the way does not hide it.
      const rise = height(tx, tz) + (TALL[target.id] ?? 2) - (height(player.x, player.z) + EYE);
      const up = Math.min(1.1, Math.max(-0.4, Math.atan2(rise, Math.hypot(tx - player.x, tz - player.z))));
      return new Promise((resolve) => {
        turning?.resolve(false);
        turning = { from: player.yaw, to: turnTowards(player.yaw, bearing), pitch: player.pitch, up, elapsed: 0, resolve };
      });
    },
    save: () => ({
      x: Math.round(player.x * 100) / 100,
      z: Math.round(player.z * 100) / 100,
      yaw: Math.round(player.yaw * 1000) / 1000,
    }),
    load(data) {
      const pose = data && walkable(data.x, data.z) ? { ...START, ...data } : START;
      Object.assign(player, pose, { pitch: 0 });
      Object.assign(previous, player);
      turning?.resolve(false);
      turning = null;
    },
    destroy() {
      turning?.resolve(false);
      scene.traverse((node) => {
        node.geometry?.dispose();
        const material = node.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material?.dispose();
      });
      renderer.dispose();
    },
  };
}
