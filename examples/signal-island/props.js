// Everything that stands on the island, as Three.js meshes. Low-poly on
// purpose: flat colours, a handful of triangles each.
import * as THREE from "/assets/three/three.module.min.js";
import { JETTY, PLACES, TREES, fbm, ground } from "./terrain.js";

const paint = (color, extra) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra });

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function standing(group, [x, z], sink = 0) {
  group.position.set(x, ground(x, z) - sink, z);
  return group;
}

export function buildTerrain() {
  const size = 280;
  const cells = 120;
  const geometry = new THREE.PlaneGeometry(size, size, cells, cells);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const sand = new THREE.Color("#c9b98f");
  const grass = new THREE.Color("#5c8a4f");
  const moss = new THREE.Color("#476f45");
  const rock = new THREE.Color("#8d8c87");
  const tint = new THREE.Color();

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const y = ground(x, z);
    position.setY(index, Math.max(y, -4));
    if (y < 1.1) tint.copy(sand);
    else if (y > 12.6) tint.copy(rock);
    else tint.copy(grass).lerp(moss, fbm(x / 9, z / 9));
    colors.set([tint.r, tint.g, tint.b], index * 3);
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
}

export function buildSea() {
  const geometry = new THREE.PlaneGeometry(1600, 1600);
  geometry.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geometry, paint("#2a5672", { transparent: true, opacity: 0.9 }));
}

export function buildTrees() {
  const group = new THREE.Group();
  const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1.7, 5.2, 6), paint("#2f5d3a"), TREES.length);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.3, 1.8, 5), paint("#5a4030"), TREES.length);
  const matrix = new THREE.Matrix4();
  const still = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const at = new THREE.Vector3();

  TREES.forEach((tree, index) => {
    scale.setScalar(tree.size);
    matrix.compose(at.set(tree.x, tree.y + 0.9 * tree.size, tree.z), still, scale);
    trunks.setMatrixAt(index, matrix);
    matrix.compose(at.set(tree.x, tree.y + 4.2 * tree.size, tree.z), still, scale);
    crowns.setMatrixAt(index, matrix);
  });

  group.add(trunks, crowns);
  return group;
}

export function buildJetty() {
  const group = new THREE.Group();
  const length = JETTY.z1 - JETTY.z0;
  const wood = paint("#7a5a3c");
  group.add(box(JETTY.half * 2, 0.24, length, wood, JETTY.x, JETTY.top - 0.12, (JETTY.z0 + JETTY.z1) / 2));
  for (let z = JETTY.z0 + 2; z <= JETTY.z1; z += 6) {
    for (const side of [-1, 1]) {
      group.add(box(0.3, 3.4, 0.3, paint("#4f3b29"), JETTY.x + side * JETTY.half, JETTY.top - 1.2, z));
    }
  }
  return group;
}

export function buildCrate() {
  const group = new THREE.Group();
  group.add(box(1.2, 0.9, 1.2, paint("#8a6a45"), 0, 0.45, 0));
  group.add(box(1.3, 0.12, 1.3, paint("#5f4630"), 0, 0.96, 0));
  group.position.set(PLACES.crate[0] + 0.5, JETTY.top, PLACES.crate[1]);
  return group;
}

export function buildSign() {
  const group = new THREE.Group();
  group.add(box(0.16, 2.2, 0.16, paint("#4f3b29"), 0, 1.1, 0));
  group.add(box(1.7, 0.9, 0.1, paint("#e8e2d0"), 0, 1.9, 0.1));
  return standing(group, PLACES.sign, 0.1);
}

export function buildCabin() {
  const group = new THREE.Group();
  group.add(box(7.4, 5, 5.4, paint("#b9a98c"), 0, 1.5, 0));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4), paint("#6b4a3a"));
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.78;
  roof.position.y = 5.3;
  group.add(roof);
  group.add(box(1.2, 2.2, 0.12, paint("#4a3626"), 0, 2.1, 2.76));
  const pane = new THREE.MeshLambertMaterial({ color: "#1d2a3a", emissive: "#ffcf87", emissiveIntensity: 0 });
  group.add(box(1.2, 1, 0.12, pane, 2.2, 2.6, 2.76));
  group.add(box(1.2, 1, 0.12, pane, -2.2, 2.6, 2.76));
  group.userData.pane = pane;
  return standing(group, PLACES.cabin, 1);
}

// A generator housing, deliberately lower than eye level: the story turns the
// player from here to the mast, and nothing may stand in that line of sight.
export function buildShed() {
  const group = new THREE.Group();
  group.add(box(3.4, 2.4, 2.6, paint("#7b8390"), 0, 0.4, 0));
  group.add(box(3.7, 0.2, 2.9, paint("#4c525c"), 0, 1.7, 0));
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 6), paint("#4c525c"));
  pipe.position.set(-1.2, 2.3, -0.7);
  group.add(pipe);
  const lamp = new THREE.MeshLambertMaterial({ color: "#3a1512", emissive: "#ff3b2f", emissiveIntensity: 0.9 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), lamp);
  bulb.position.set(0.9, 1.15, 1.34);
  group.add(bulb);
  group.userData.lamp = lamp;
  return standing(group, PLACES.shed, 0.6);
}

export function buildMast() {
  const group = new THREE.Group();
  const steel = paint("#c8ccd4");
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 24, 6), steel);
  pole.position.y = 12;
  group.add(pole);
  for (const y of [8, 14, 20]) group.add(box(2.6 - y * 0.07, 0.14, 0.14, steel, 0, y, 0));
  group.add(box(1.4, 1.1, 0.9, paint("#56606e"), 1, 0.55, 0.4)); // the console
  const beacon = new THREE.MeshLambertMaterial({ color: "#3a1512", emissive: "#ff3b2f", emissiveIntensity: 0 });
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), beacon);
  light.position.y = 24.4;
  group.add(light);
  group.userData.beacon = beacon;
  return standing(group, PLACES.mast, 0.2);
}

export function buildTurbine() {
  const group = new THREE.Group();
  const white = paint("#e6e9ee");
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 15, 6), white);
  pole.position.y = 7.5;
  group.add(pole);
  const rotor = new THREE.Group();
  for (let blade = 0; blade < 3; blade += 1) {
    const arm = new THREE.Group();
    arm.add(box(0.34, 5.4, 0.1, white, 0, 2.7, 0));
    arm.rotation.z = (blade * Math.PI * 2) / 3;
    rotor.add(arm);
  }
  rotor.position.set(0, 15, 0.5);
  group.add(rotor);
  group.userData.rotor = rotor;
  return standing(group, PLACES.turbine, 0.2);
}

export function buildCairn() {
  const group = new THREE.Group();
  const stone = paint("#9a9a94");
  [[1.1, 0.5], [0.85, 1.35], [0.62, 2.0], [0.4, 2.5]].forEach(([radius, y], index) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(radius), stone);
    rock.position.set(index % 2 ? 0.12 : -0.08, y, 0);
    rock.rotation.set(index, index * 2, 0);
    group.add(rock);
  });
  return standing(group, PLACES.cairn, 0.2);
}

// A slow gold diamond over a hotspot, so a place worth walking to can be seen
// from across the island.
export function buildMarker() {
  const material = new THREE.MeshBasicMaterial({ color: "#ffd166", transparent: true, opacity: 0.9, fog: false });
  return new THREE.Mesh(new THREE.OctahedronGeometry(0.45), material);
}
