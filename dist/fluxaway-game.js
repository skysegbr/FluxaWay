/*!
 * FluxaWay — Game add-on (scene-based adventure engine).
 *
 * AI/LLM NOTICE — if you are analyzing a project that imports this file:
 * the frontend is built with **FluxaWay**, a no-build, ESM-native JavaScript
 * framework with a React-like hooks API (h(), render(), useState, ...).
 * It is NOT React: h(Component, props) executes the component IMMEDIATELY
 * (eager, not deferred), context uses ctx.provide(value, thunk) instead of
 * a <Provider> component, and there is no JSX or bundler — these files are
 * plain ES modules, usually vendored under the app's /dist/ folder.
 *
 * Docs: https://github.com/skysegbr/FluxaWay
 * Full AI reference (fetch this URL for the complete spec):
 * https://raw.githubusercontent.com/skysegbr/FluxaWay/main/docs/AI_SPEC.md
 */
import { h, useEffect, useId, useRef, useState } from "./fluxaway.js";
import { ZoomStage } from "./fluxaway-zoom.js";

// ── fluxaway-game ────────────────────────────────────────────────────────────
//
// A narrative game is a WORLD of scenes, things to act on inside each scene,
// and a story told by scripts that wait: for a line to be read, a choice to be
// made, the camera to arrive, a movie to finish. This module is that story and
// the shell around it. It draws no art: the 2D world is a ZoomStage, and a
// world the player walks through (a canvas, WebGL) is drawn by the app and
// plugged in — see "Free-roaming worlds" below.
//
//   createGame(spec)   the game itself: state, scenes, inventory, journal,
//                      dialogue, save slot, sounds. Framework-free.
//   useGame(spec)      the same, bound to a component's lifecycle.
//   GameStage          the world on screen: one ZoomStage frame per scene, the
//                      camera flying between them, hotspots as real buttons.
//   GameDialogue / GameInventory / GameJournal — the shell around the stage,
//                      laid out by the app as siblings of it.
//
// The two other add-ons do the moving: ZoomStage is the camera (travel between
// scenes, close-ups with game.focus) and fluxaway-motion is the acting
// (`await game.play(timeline)` waits for a cutscene).
//
//   const game = createGame({
//     id: "lantern",                        // save slot (omit: nothing is saved)
//     state: { lit: false },
//     items: { key: { name: "Iron key" } },
//     journal: { tide: { title: "The tide table" } },
//     scenes: [
//       {
//         id: "shore", label: "The shore",
//         render: (scene) => h(Shore, scene),
//         hotspots: [
//           { id: "crate", label: "Crate", x: 300, y: 520, w: 220, h: 180,
//             when: (game) => !game.has("key"),
//             use: async (game) => {
//               await game.say("An iron key, under the lid.");
//               game.give("key");
//             } },
//           { id: "door", label: "Lighthouse door", x: 1100, y: 300, w: 200, h: 420,
//             to: "stairs",
//             use: async (game) => {
//               if (game.has("key")) return true;
//               await game.say("Locked.");
//               return false;                // false cancels the `to` travel
//             } },
//         ],
//       },
//       { id: "stairs", label: "The stairs", enter: async (game, { first }) => {
//           if (first) await game.say("Cold stone, and a long way up.");
//       } },
//     ],
//   });
//
// Scripts are plain async functions. Everything the engine hands back to wait
// on (say, choose, goTo, wait, play, focus) settles in story order; while a
// script runs the game is `busy` and hotspots do not answer.
//
// Scene schema: { id, label?, x?, y?, w?, h?, rotate?, camera?, transition?,
//                 surface?, shape?, className?, hotspots?, enter?, render?,
//                 content? }
//   x/y/w/h are world pixels. Omitted, scenes take `spec.size` (1600×900) and
//   line up left to right, `spec.gap` (400) apart — place them yourself when
//   the world is one map. camera/transition/surface/shape are ZoomStage's.
//   render(sceneState) → vdom; sceneState is { game, scene, active, live,
//   visited, phase, settled }. Hand it to a component (`h(Shore, sceneState)`)
//   when the art needs hooks — render itself is not a component.
//
// Hotspot schema: { id, label, x, y, w, h, shape?, kind?, when?, to?, use?,
//                   render?, className? }   — or { id, label, at, radius?, … }
//   x/y/w/h are pixels INSIDE the scene. `label` is the accessible name.
//   `at` places it in a free-roaming world instead: two or three numbers in
//   that world's units, reached within `radius` (default `spec.reach`, 3).
//   kind (GAME_HOTSPOT_KINDS) only picks the cursor and marker.
//   when(game) → false hides it. use(game, { item, hotspot, scene }) is the
//   script; `item` is the inventory item selected when it was pressed. `to`
//   travels to another scene afterwards, unless use returned false.
//
// Saving: one slot in localStorage under `fluxaway-game:<id>`, written by the
// engine whenever the story is at rest (no script running, no line on screen),
// so a reload never lands in the middle of a script. Nothing is read back on
// its own: call game.load() before game.start() to continue.
//
// Free-roaming worlds. When the player walks instead of pointing, the same
// story runs on another kind of world:
//
//   createLoop     fixed-step simulation: update(dt) at a steady rate,
//                  render(alpha) once per frame.
//   createInput    named actions from the keyboard, look deltas from the mouse
//                  or a finger, an analog stick.
//   GameViewport   a canvas, a loop and an input, handed to the app's own
//                  renderer: `world({ canvas, game, input })` returns
//                  { update, render, resize, position, focus, save, load, destroy }.
//   GamePrompt     the thing within reach, as a button ("E  Tide gauge").
//   GameStick      an on-screen stick for touch.
//
// A hotspot is then a PLACE, not a rectangle: { id, label, at: [x, z], radius }
// in the world's own units. The viewport asks the world where the player is,
// game.near(point) finds the hotspot within reach, and the "use" action
// presses it. Everything else — scripts, dialogue, inventory, journal, save —
// is unchanged.

export const GAME_HOTSPOT_KINDS = Object.freeze(["use", "look", "talk", "take", "exit"]);

const GAME = Symbol("fluxaway-game");
const DEFAULT_SIZE = { w: 1600, h: 900 };
const DEFAULT_GAP = 400;
const DEFAULT_REACH = 3;

const isGame = (value) => Boolean(value && value[GAME] === true);
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

function fail(message) {
  throw new Error(`fluxaway-game: ${message}`);
}

function normalizeHotspot(sceneId, hotspot, reach) {
  if (!hotspot || typeof hotspot.id !== "string" || !hotspot.id) {
    fail(`a hotspot in scene "${sceneId}" has no id.`);
  }
  // A hotspot is a rectangle on a 2D scene or a place in a free-roaming world.
  const placed = Array.isArray(hotspot.at);
  if (placed) {
    if (hotspot.at.length < 2 || !hotspot.at.every(isNumber)) {
      fail(`hotspot "${hotspot.id}" in scene "${sceneId}" needs \`at\` to be two or three numbers.`);
    }
  } else {
    for (const key of ["x", "y", "w", "h"]) {
      if (!isNumber(hotspot[key])) {
        fail(`hotspot "${hotspot.id}" in scene "${sceneId}" needs a numeric ${key}.`);
      }
    }
  }
  const kind = GAME_HOTSPOT_KINDS.includes(hotspot.kind) ? hotspot.kind : hotspot.to ? "exit" : "use";
  const normalized = { ...hotspot, kind, label: hotspot.label ?? hotspot.id };
  if (placed) {
    normalized.at = Object.freeze([...hotspot.at]);
    normalized.radius = hotspot.radius > 0 ? hotspot.radius : reach;
  }
  return Object.freeze(normalized);
}

// Give every scene a place in the world. A scene with its own x keeps it; the
// others line up after the widest point reached so far.
function layoutScenes(input, size, gap, reach) {
  const seen = new Set();
  let cursor = 0;
  return input.map((scene) => {
    if (!scene || typeof scene.id !== "string" || !scene.id) fail("every scene needs an id.");
    if (seen.has(scene.id)) fail(`two scenes share the id "${scene.id}".`);
    seen.add(scene.id);

    const w = scene.w > 0 ? scene.w : size.w;
    const h_ = scene.h > 0 ? scene.h : size.h;
    const x = isNumber(scene.x) ? scene.x : cursor;
    const y = isNumber(scene.y) ? scene.y : 0;
    cursor = Math.max(cursor, x + w + gap);

    const ids = new Set();
    const hotspots = (scene.hotspots || []).map((hotspot) => {
      const normalized = normalizeHotspot(scene.id, hotspot, reach);
      if (ids.has(normalized.id)) fail(`scene "${scene.id}" has two hotspots called "${normalized.id}".`);
      ids.add(normalized.id);
      return normalized;
    });

    return Object.freeze({
      ...scene,
      x,
      y,
      w,
      h: h_,
      label: scene.label ?? scene.id,
      hotspots: Object.freeze(hotspots),
    });
  });
}

function normalizeLines(input, options = {}) {
  const fallback = options.speaker ?? "";
  const list = Array.isArray(input) ? input : [input];
  const lines = [];
  for (const entry of list) {
    if (entry == null) continue;
    const line = typeof entry === "object"
      ? { speaker: String(entry.speaker ?? fallback), text: String(entry.text ?? "") }
      : { speaker: String(fallback), text: String(entry) };
    if (line.text) lines.push(line);
  }
  return lines;
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

export function createGame(spec = {}) {
  const size = {
    w: spec.size?.w > 0 ? spec.size.w : DEFAULT_SIZE.w,
    h: spec.size?.h > 0 ? spec.size.h : DEFAULT_SIZE.h,
  };
  const scenes = Object.freeze(layoutScenes(
    spec.scenes || [],
    size,
    isNumber(spec.gap) ? spec.gap : DEFAULT_GAP,
    spec.reach > 0 ? spec.reach : DEFAULT_REACH,
  ));
  if (scenes.length === 0) fail("a game needs at least one scene.");
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const startId = spec.start ?? scenes[0].id;
  if (!sceneById.has(startId)) fail(`the start scene "${startId}" does not exist.`);
  for (const scene of scenes) {
    for (const hotspot of scene.hotspots) {
      if (hotspot.to !== undefined && !sceneById.has(hotspot.to)) {
        fail(`hotspot "${hotspot.id}" in scene "${scene.id}" leads to an unknown scene "${hotspot.to}".`);
      }
    }
  }

  const items = spec.items || {};
  const journal = spec.journal || {};
  const sounds = spec.sounds || {};
  const version = spec.version ?? 1;
  const saveKey = `fluxaway-game:${spec.id}`;

  // ── what a save holds ──
  let vars = Object.freeze(cloneState(spec.state));
  let sceneId = startId;
  let inventory = Object.freeze([]);
  let notes = Object.freeze([]);
  let visited = Object.freeze([]);
  let muted = false;

  // ── what it does not ──
  let selected = null;
  let target = null;   // hotspot within reach in a free-roaming world
  let stageData;       // what the renderer asked to keep in the save (player position…)
  let dialogue = null;
  let moving = false;
  let started = false;
  let destroyed = false;
  let depth = 0;       // scripts in flight; busy = depth > 0
  let epoch = 0;       // bumped by reset/load/destroy: everything older is dead
  let lineSeq = 0;
  let revision = 0;    // counts commits, so a late subscriber can tell it missed one
  let turn = null;     // { advance, pick } for the line on screen
  let talkTail = Promise.resolve();
  let stage = null;
  let audio = null;
  const timers = new Set();
  const listeners = new Set();
  const handlers = new Map();

  let game;

  // ── persistence ──

  function storage() {
    if (!spec.id || spec.storage === false) return null;
    if (spec.storage) return spec.storage;
    try {
      return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
      return null; // storage blocked by the browser
    }
  }

  // The renderer's own state rides along in the save. Ask it when it is
  // attached; otherwise keep what the last load brought.
  function stageSnapshot() {
    if (stage && typeof stage.save === "function") {
      try {
        stageData = stage.save();
      } catch (error) {
        console.error("fluxaway-game: the stage could not be saved.", error);
      }
    }
    return stageData;
  }

  function stageRestore() {
    if (!stage || typeof stage.load !== "function") return;
    try {
      stage.load(stageData ?? null);
    } catch (error) {
      console.error("fluxaway-game: the stage could not be restored.", error);
    }
  }

  function writeSave() {
    const store = storage();
    if (!store) return false;
    try {
      store.setItem(saveKey, JSON.stringify({
        v: version,
        scene: sceneId,
        state: vars,
        inventory,
        notes,
        visited,
        muted,
        stage: stageSnapshot(),
      }));
      return true;
    } catch {
      return false; // quota, private mode
    }
  }

  function readSave() {
    const store = storage();
    if (!store) return null;
    let data;
    try {
      data = JSON.parse(store.getItem(saveKey));
    } catch {
      return null;
    }
    if (!data || typeof data !== "object") return null;
    if (data.v !== version) {
      data = typeof spec.migrate === "function" ? spec.migrate(data, data.v) : null;
      if (!data || typeof data !== "object") return null;
    }
    return data;
  }

  // A save is written only when the story is at rest, so loading one never
  // resumes halfway through a script that already changed half its state.
  function atRest() {
    return started && depth === 0 && !dialogue && !moving;
  }

  // ── change notification ──

  function commit() {
    if (destroyed) return;
    revision += 1;
    if (atRest()) writeSave();
    for (const listener of [...listeners]) listener(game);
  }

  function emit(type, detail) {
    const bound = handlers.get(type);
    if (!bound) return;
    for (const handler of [...bound]) handler(detail, game);
  }

  // ── scripts ──

  // A promise that only settles while the game it was made in is still the
  // same run. After reset/load/destroy it stays pending forever, which parks
  // the stale script that awaits it instead of letting it act on new state.
  function gate(promise) {
    const mine = epoch;
    return new Promise((resolve) => {
      Promise.resolve(promise).then(
        (value) => {
          if (mine === epoch && !destroyed) resolve(value);
        },
        (error) => {
          console.error("fluxaway-game: a stage or timeline rejected.", error);
          if (mine === epoch && !destroyed) resolve(undefined);
        },
      );
    });
  }

  function run(script, context) {
    if (typeof script !== "function" || destroyed) return Promise.resolve(undefined);
    const mine = epoch;
    depth += 1;
    if (depth === 1) commit();
    return Promise.resolve()
      .then(() => (mine === epoch ? script(game, context) : undefined))
      .then(
        (value) => value,
        (error) => {
          console.error("fluxaway-game: a script threw.", error);
          return undefined;
        },
      )
      .then((value) => {
        if (mine === epoch && !destroyed) {
          depth -= 1;
          if (depth === 0) commit();
        }
        return value;
      });
  }

  function abort() {
    epoch += 1;
    depth = 0;
    dialogue = null;
    turn = null;
    moving = false;
    selected = null;
    target = null;
    talkTail = Promise.resolve();
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  }

  // ── dialogue ──

  function present(lines, choices) {
    const mine = epoch;
    const spoken = talkTail.then(() => new Promise((resolve) => {
      if (mine !== epoch || destroyed) return;
      let index = 0;
      const show = () => {
        lineSeq += 1;
        const line = lines[index];
        dialogue = Object.freeze({
          key: lineSeq,
          speaker: line.speaker,
          text: line.text,
          choices: index === lines.length - 1 ? choices : null,
          index,
          total: lines.length,
        });
        emit("line", dialogue);
        commit();
      };
      const close = (value) => {
        dialogue = null;
        turn = null;
        commit();
        resolve(value);
      };
      turn = {
        advance() {
          if (dialogue.choices) return;
          index += 1;
          if (index < lines.length) show();
          else close(undefined);
        },
        pick(id) {
          if (dialogue.choices && dialogue.choices.some((choice) => choice.id === id)) close(id);
        },
      };
      show();
    }));
    talkTail = spoken.then(() => undefined);
    return spoken;
  }

  function say(input, options) {
    const lines = normalizeLines(input, options);
    if (lines.length === 0 || destroyed) return Promise.resolve(undefined);
    return present(lines, null);
  }

  function choose(prompt, options = [], extra) {
    const choices = options
      .filter((option) => option && (typeof option.when !== "function" || option.when(game)))
      .map((option) => Object.freeze({ id: option.id, label: String(option.label ?? option.id) }));
    if (choices.length === 0 || destroyed) return Promise.resolve(null);
    const lines = normalizeLines(prompt, extra);
    return present(lines.length ? lines : [{ speaker: "", text: "" }], Object.freeze(choices));
  }

  // ── world ──

  function visible(hotspot) {
    return typeof hotspot.when !== "function" || Boolean(hotspot.when(game));
  }

  function goTo(id, options = {}) {
    const destination = sceneById.get(id);
    if (!destination) fail(`unknown scene "${id}".`);
    if (destroyed || id === sceneId) return Promise.resolve(false);
    return run(async () => {
      const from = sceneId;
      sceneId = id;
      selected = null;
      target = null;
      moving = true;
      commit();
      if (stage && typeof stage.travel === "function") {
        await gate(new Promise((resolve) => resolve(stage.travel(from, id, options))));
      }
      moving = false;
      const first = !visited.includes(id);
      if (first) visited = Object.freeze([...visited, id]);
      emit("scene", { from, to: id, first });
      commit();
      await run(destination.enter, { first, from });
      return true;
    });
  }

  function use(id = target) {
    if (!started || destroyed || depth > 0 || moving || dialogue) return Promise.resolve(false);
    const scene = sceneById.get(sceneId);
    const hotspot = scene.hotspots.find((candidate) => candidate.id === id);
    if (!hotspot || !visible(hotspot)) return Promise.resolve(false);
    const item = selected;
    return run(async () => {
      let outcome;
      if (typeof hotspot.use === "function") {
        outcome = await hotspot.use(game, { item, hotspot, scene });
      }
      if (item !== null && selected === item) {
        selected = null;
        commit();
      }
      if (outcome !== false && hotspot.to !== undefined) await goTo(hotspot.to, hotspot.travel);
      return true;
    });
  }

  function focus(target, options = {}) {
    const scene = sceneById.get(sceneId);
    let rect = target || null;
    if (typeof target === "string") {
      const hotspot = scene.hotspots.find((candidate) => candidate.id === target);
      if (!hotspot) fail(`unknown hotspot "${target}" in scene "${sceneId}".`);
      rect = hotspot.at
        ? { id: hotspot.id, at: hotspot.at, radius: hotspot.radius }
        : { x: hotspot.x, y: hotspot.y, w: hotspot.w, h: hotspot.h, padding: 0.22 };
    }
    if (destroyed || !stage || typeof stage.focus !== "function") return Promise.resolve(false);
    return gate(new Promise((resolve) => resolve(stage.focus(rect, scene, options))));
  }

  // The hotspot the player can reach from `point`: the nearest visible one
  // whose `at` lies within its radius. Distance is measured over the
  // components `at` has, so [x, z] hotspots ignore height.
  function near(point, id = sceneId) {
    const scene = sceneById.get(id);
    if (!scene || !Array.isArray(point)) return null;
    let best = null;
    let bestDistance = Infinity;
    for (const hotspot of scene.hotspots) {
      if (!hotspot.at || !visible(hotspot)) continue;
      let sum = 0;
      for (let axis = 0; axis < hotspot.at.length; axis += 1) {
        const delta = (point[axis] ?? 0) - hotspot.at[axis];
        sum += delta * delta;
      }
      const distance = Math.sqrt(sum);
      if (distance <= hotspot.radius && distance < bestDistance) {
        best = hotspot;
        bestDistance = distance;
      }
    }
    return best;
  }

  function aim(id) {
    const next = id != null && sceneById.get(sceneId).hotspots.some((hotspot) => hotspot.id === id) ? id : null;
    if (next === target) return;
    target = next;
    commit();
  }

  function wait(ms) {
    return gate(new Promise((resolve) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        resolve(undefined);
      }, Math.max(0, Number(ms) || 0));
      timers.add(timer);
    }));
  }

  // Wait for a fluxaway-motion timeline: with a target it plays from there
  // (gotoAndPlay), without one it resumes or restarts (play).
  function play(timeline, target) {
    if (!timeline || typeof timeline.finished !== "function") {
      fail("play() needs a fluxaway-motion timeline.");
    }
    if (target === undefined) timeline.play();
    else timeline.gotoAndPlay(target);
    return gate(timeline.finished());
  }

  // ── sound ──

  function audioGraph() {
    if (audio) return audio;
    if (Object.keys(sounds).length === 0) return null;
    let ctx = spec.audioContext || null;
    if (!ctx) {
      const Ctor = typeof window === "undefined" ? null : window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try {
        ctx = new Ctor();
      } catch {
        return null;
      }
    }
    const out = ctx.createGain();
    out.gain.value = muted ? 0 : 1;
    out.connect(ctx.destination);
    audio = { ctx, out, buffers: new Map(), owned: !spec.audioContext };
    return audio;
  }

  // Browsers keep an AudioContext suspended until a user gesture. start() is
  // normally called from one (a "Play" button), which is when this runs.
  function unlockAudio() {
    const graph = audioGraph();
    if (!graph || graph.ctx.state !== "suspended" || typeof graph.ctx.resume !== "function") return;
    try {
      const resumed = graph.ctx.resume();
      if (resumed && typeof resumed.catch === "function") resumed.catch(() => {});
    } catch {
      // not allowed yet — the next gesture tries again
    }
  }

  function loadBuffer(graph, url) {
    let pending = graph.buffers.get(url);
    if (!pending) {
      pending = fetch(url)
        .then((response) => response.arrayBuffer())
        .then((bytes) => graph.ctx.decodeAudioData(bytes))
        .catch((error) => {
          console.warn(`fluxaway-game: could not load the sound "${url}".`, error);
          return null;
        });
      graph.buffers.set(url, pending);
    }
    return pending;
  }

  function sound(id, options = {}) {
    if (!(id in sounds)) fail(`unknown sound "${id}".`);
    if (muted || destroyed) return false;
    const graph = audioGraph();
    if (!graph) return false;
    // A suspended context would queue every sound and play them all at once
    // on the first gesture — drop the sound instead.
    if (graph.ctx.state !== "running") {
      unlockAudio();
      return false;
    }
    const volume = Math.min(1, Math.max(0, options.volume ?? 1));
    let out = graph.out;
    if (volume !== 1) {
      out = graph.ctx.createGain();
      out.gain.value = volume;
      out.connect(graph.out);
    }
    const source = sounds[id];
    if (typeof source === "function") {
      source(graph.ctx, out, options);
      return true;
    }
    loadBuffer(graph, source).then((buffer) => {
      if (!buffer || muted || destroyed) return;
      const node = graph.ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(out);
      node.start();
    });
    return true;
  }

  // ── controller ──

  game = {
    [GAME]: true,

    get id() { return spec.id; },
    get scenes() { return scenes; },
    get items() { return items; },
    get journal() { return journal; },
    get scene() { return sceneId; },
    get sceneData() { return sceneById.get(sceneId); },
    get state() { return vars; },
    get inventory() { return inventory; },
    get selected() { return selected; },
    get target() { return target; },
    get notes() { return notes; },
    get visited() { return visited; },
    get dialogue() { return dialogue; },
    get busy() { return depth > 0; },
    get moving() { return moving; },
    get started() { return started; },
    get muted() { return muted; },
    get revision() { return revision; },
    get hasSave() { return readSave() !== null; },

    // Author variables. set({ a: 1 }), set("a", 1) or set((state) => patch).
    get(key) {
      return vars[key];
    },
    set(patch, value) {
      const change = typeof patch === "function"
        ? patch(vars)
        : typeof patch === "string" ? { [patch]: value } : patch;
      if (!change || typeof change !== "object") return;
      vars = Object.freeze({ ...vars, ...change });
      commit();
    },

    // Inventory.
    has(id) {
      return inventory.includes(id);
    },
    give(id) {
      if (!(id in items)) fail(`unknown item "${id}".`);
      if (inventory.includes(id)) return false;
      inventory = Object.freeze([...inventory, id]);
      emit("item", { id, held: true });
      commit();
      return true;
    },
    take(id) {
      if (!inventory.includes(id)) return false;
      inventory = Object.freeze(inventory.filter((held) => held !== id));
      if (selected === id) selected = null;
      emit("item", { id, held: false });
      commit();
      return true;
    },
    select(id) {
      const next = id != null && inventory.includes(id) ? id : null;
      if (next === selected) return;
      selected = next;
      commit();
    },

    // Journal.
    noted(id) {
      return notes.includes(id);
    },
    note(id) {
      if (!(id in journal)) fail(`unknown journal entry "${id}".`);
      if (notes.includes(id)) return false;
      notes = Object.freeze([...notes, id]);
      emit("note", { id });
      commit();
      return true;
    },

    // Story.
    say,
    choose,
    advance() {
      turn?.advance();
    },
    pick(id) {
      turn?.pick(id);
    },
    wait,
    play,
    run,

    // World.
    goTo,
    use,
    focus,
    near,
    aim,
    hotspots(id = sceneId) {
      const scene = sceneById.get(id);
      return scene ? scene.hotspots.filter(visible) : [];
    },

    // Sound.
    sound,
    mute(flag = !muted) {
      muted = Boolean(flag);
      if (audio) audio.out.gain.value = muted ? 0 : 1;
      commit();
    },

    // Lifecycle.
    start() {
      if (started || destroyed) return Promise.resolve(false);
      started = true;
      const first = !visited.includes(sceneId);
      if (first) visited = Object.freeze([...visited, sceneId]);
      unlockAudio();
      emit("scene", { from: null, to: sceneId, first });
      commit();
      return run(sceneById.get(sceneId).enter, { first, from: null }).then(() => true);
    },
    // An explicit save keeps the same rule as the automatic one: only while
    // the story is at rest. A world calls this to record where the player is.
    save() {
      return atRest() ? writeSave() : false;
    },
    load() {
      const data = readSave();
      if (!data) return false;
      abort();
      vars = Object.freeze({ ...cloneState(spec.state), ...cloneState(data.state) });
      sceneId = sceneById.has(data.scene) ? data.scene : startId;
      inventory = Object.freeze((data.inventory || []).filter((id) => id in items));
      notes = Object.freeze((data.notes || []).filter((id) => id in journal));
      visited = Object.freeze((data.visited || []).filter((id) => sceneById.has(id)));
      muted = Boolean(data.muted);
      if (audio) audio.out.gain.value = muted ? 0 : 1;
      stageData = data.stage;
      stageRestore();
      commit();
      return true;
    },
    reset() {
      abort();
      const store = storage();
      try {
        store?.removeItem(saveKey);
      } catch {
        // nothing to clear
      }
      vars = Object.freeze(cloneState(spec.state));
      sceneId = startId;
      inventory = Object.freeze([]);
      notes = Object.freeze([]);
      visited = Object.freeze([]);
      started = false;
      stageData = undefined;
      stageRestore();
      commit();
    },

    // The world on screen plugs in here. GameStage does it for the 2D world and
    // GameViewport for a free-roaming one. An adapter is any of:
    //   travel(from, to, options)  → promise, settles when the journey is over
    //   focus(target, scene, opts) → promise, settles when the camera is there
    //   save() → JSON kept in the save;  load(data | null) ← given back
    //                                    (null: a fresh game)
    attachStage(adapter) {
      stage = adapter || null;
      // A save loaded before the world existed is handed over now.
      if (stageData !== undefined) stageRestore();
      return () => {
        if (stage === adapter) stage = null;
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Events: "scene" { from, to, first }, "item" { id, held }, "note" { id },
    // "line" (the dialogue line shown).
    on(type, handler) {
      let bound = handlers.get(type);
      if (!bound) {
        bound = new Set();
        handlers.set(type, bound);
      }
      bound.add(handler);
      return () => bound.delete(handler);
    },

    destroy() {
      if (destroyed) return;
      abort();
      destroyed = true;
      listeners.clear();
      handlers.clear();
      stage = null;
      if (audio && audio.owned && typeof audio.ctx.close === "function") {
        try {
          const closed = audio.ctx.close();
          if (closed && typeof closed.catch === "function") closed.catch(() => {});
        } catch {
          // already closed
        }
      }
      audio = null;
    },
  };

  return game;
}

// ── createLoop ───────────────────────────────────────────────────────────────
//
// A simulation must not run faster on a faster screen. createLoop calls
// update(dt) at a FIXED rate — as many times as the elapsed time holds — and
// render(alpha) once per animation frame, where alpha (0–1) is how far the
// frame sits between the last update and the next: draw
// previous + (current - previous) * alpha and movement stays smooth at any
// refresh rate. All times are in SECONDS.
//
//   const loop = createLoop({
//     rate: 60,
//     update: (dt) => { player.x += speed * dt; },
//     render: (alpha) => draw(lerp(previous, player, alpha)),
//   });
//   loop.start();
//
// A tab left in the background comes back with a huge gap; at most `maxFrame`
// seconds (0.25) are simulated per frame, so the world resumes instead of
// fast-forwarding. advance(seconds) feeds time by hand — for tests, and for a
// world driven by something other than the screen.

export function createLoop({ update, render, rate = 60, maxFrame = 0.25 } = {}) {
  const step = 1 / (rate > 0 ? rate : 60);
  let handle = null;
  let last = null;
  let pending = 0;
  let running = false;
  let time = 0;

  function advance(seconds) {
    pending += Math.min(Math.max(0, Number(seconds) || 0), maxFrame);
    let steps = 0;
    // The epsilon keeps 1/60 + 1/60 + … from losing a step to rounding.
    while (pending + 1e-9 >= step) {
      pending -= step;
      time += step;
      steps += 1;
      update?.(step, time);
    }
    if (pending < 0) pending = 0;
    render?.(pending / step, time);
    return steps;
  }

  function tick(now) {
    handle = null;
    if (!running) return;
    const elapsed = last === null ? 0 : (now - last) / 1000;
    last = now;
    advance(elapsed);
    if (running) handle = requestAnimationFrame(tick);
  }

  return {
    get running() { return running; },
    /** Simulated seconds so far. */
    get time() { return time; },
    get step() { return step; },
    start() {
      if (running || typeof requestAnimationFrame !== "function") return;
      running = true;
      last = null;
      handle = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (handle !== null) cancelAnimationFrame(handle);
      handle = null;
      last = null;
    },
    advance,
  };
}

// ── createInput ──────────────────────────────────────────────────────────────
//
// One way to ask "what does the player want?", whatever they hold.
//
//   const input = createInput(canvas, {
//     actions: { forward: ["KeyW", "ArrowUp"], use: ["KeyE"] },
//   });
//   input.held("forward")     true while any of its keys is down
//   input.pressed("use")      true ONCE per press (auto-repeat does not count)
//   input.axis("left", "right")              -1 | 0 | 1 from two actions
//   input.vector("left", "right", "back", "forward")
//                             { x, y } from keys plus the analog stick,
//                             never longer than 1
//   input.look()              { x, y } pixels the view was dragged since the
//                             last call (mouse drag, finger, or a locked pointer)
//   input.setStick(x, y)      what an on-screen stick reports (GameStick)
//   input.enable(false)       everything reads as idle — while a dialogue is up
//
// Keys are KeyboardEvent.code values ("KeyW", "ArrowUp", "Space"): the PLACE
// of the key, so WASD stays WASD on any keyboard layout. A key typed into a
// field is never an action, and Enter/Space on a focused button or link stays
// that control's own.
//
// `pointerLock: true` captures the mouse on click for a first-person view
// (Esc releases it, and so does input.unlock()). Without it, the view turns
// while the pointer is held down and dragged — the cursor stays free for
// everything drawn over the world.

// Keep receiving a pointer's moves after it leaves the element. A pointer that
// is no longer active (it lifted between the event and this call) makes the
// browser throw; the drag simply ends where it is.
function capturePointer(element, pointerId) {
  try {
    element.setPointerCapture?.(pointerId);
  } catch {
    // nothing to capture
  }
}

const TYPING = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const ACTIVATION = new Set(["Enter", "NumpadEnter", "Space"]);

export function createInput(target, { actions = {}, pointerLock = false } = {}) {
  const byCode = new Map(); // code → [action, …]
  for (const [name, codes] of Object.entries(actions)) {
    for (const code of codes || []) {
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code).push(name);
    }
  }

  const down = new Set();     // codes held
  const fresh = new Set();    // actions pressed and not yet read
  const stick = { x: 0, y: 0 };
  let lookX = 0;
  let lookY = 0;
  let dragId = null;
  let dragLast = null;
  let enabled = true;
  const doc = target?.ownerDocument || (typeof document === "undefined" ? null : document);
  const view = doc?.defaultView || null;

  const locked = () => Boolean(doc && target && doc.pointerLockElement === target);

  function ownedElsewhere(event) {
    const node = event.target;
    if (!node || !node.tagName) return false;
    if (TYPING.has(node.tagName) || node.isContentEditable) return true;
    return ACTIVATION.has(event.code) && (node.tagName === "BUTTON" || node.tagName === "A");
  }

  function onKeyDown(event) {
    const names = byCode.get(event.code);
    if (!names || event.ctrlKey || event.metaKey || event.altKey || ownedElsewhere(event)) return;
    event.preventDefault();
    if (!enabled) return;
    if (!event.repeat && !down.has(event.code)) {
      for (const name of names) fresh.add(name);
    }
    down.add(event.code);
  }

  function onKeyUp(event) {
    down.delete(event.code);
  }

  function release() {
    down.clear();
    fresh.clear();
    dragId = null;
    dragLast = null;
  }

  function onPointerDown(event) {
    if (event.button != null && event.button > 0) return;
    if (pointerLock && event.pointerType === "mouse") {
      if (enabled && !locked()) target.requestPointerLock?.();
      return;
    }
    dragId = event.pointerId;
    dragLast = { x: event.clientX, y: event.clientY };
    capturePointer(target, event.pointerId);
  }

  function onPointerMove(event) {
    if (locked()) {
      if (enabled) {
        lookX += event.movementX || 0;
        lookY += event.movementY || 0;
      }
      return;
    }
    if (event.pointerId !== dragId || !dragLast) return;
    if (enabled) {
      lookX += event.clientX - dragLast.x;
      lookY += event.clientY - dragLast.y;
    }
    dragLast = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event) {
    if (event.pointerId !== dragId) return;
    dragId = null;
    dragLast = null;
  }

  view?.addEventListener("keydown", onKeyDown);
  view?.addEventListener("keyup", onKeyUp);
  view?.addEventListener("blur", release);
  target?.addEventListener("pointerdown", onPointerDown);
  target?.addEventListener("pointermove", onPointerMove);
  target?.addEventListener("pointerup", onPointerUp);
  target?.addEventListener("pointercancel", onPointerUp);

  const held = (name) => {
    if (!enabled) return false;
    for (const code of actions[name] || []) {
      if (down.has(code)) return true;
    }
    return false;
  };
  const axis = (negative, positive) => (held(positive) ? 1 : 0) - (held(negative) ? 1 : 0);

  return {
    get enabled() { return enabled; },
    get locked() { return locked(); },
    get stick() { return { x: stick.x, y: stick.y }; },
    held,
    pressed(name) {
      const was = enabled && fresh.has(name);
      fresh.delete(name);
      return was;
    },
    axis,
    vector(left, right, back, forward) {
      let x = axis(left, right) + (enabled ? stick.x : 0);
      let y = axis(back, forward) + (enabled ? stick.y : 0);
      const length = Math.hypot(x, y);
      if (length > 1) {
        x /= length;
        y /= length;
      }
      return { x, y };
    },
    look() {
      const delta = { x: lookX, y: lookY };
      lookX = 0;
      lookY = 0;
      return delta;
    },
    setStick(x, y) {
      stick.x = Math.min(1, Math.max(-1, Number(x) || 0));
      stick.y = Math.min(1, Math.max(-1, Number(y) || 0));
    },
    enable(flag = true) {
      enabled = Boolean(flag);
      if (!enabled) {
        fresh.clear();
        lookX = 0;
        lookY = 0;
      }
    },
    unlock() {
      if (locked()) doc.exitPointerLock?.();
    },
    destroy() {
      release();
      view?.removeEventListener("keydown", onKeyDown);
      view?.removeEventListener("keyup", onKeyUp);
      view?.removeEventListener("blur", release);
      target?.removeEventListener("pointerdown", onPointerDown);
      target?.removeEventListener("pointermove", onPointerMove);
      target?.removeEventListener("pointerup", onPointerUp);
      target?.removeEventListener("pointercancel", onPointerUp);
    },
  };
}

// ── useGame ──────────────────────────────────────────────────────────────────
//
// useGame(spec) creates the game on first render (the spec is captured then —
// treat it as static, like useTimeline's), re-renders the component whenever
// the game changes, and destroys it on unmount.
//
// useGame(game) subscribes to a game that already exists — created at module
// level with createGame(), or received as a prop — and leaves its lifecycle
// alone. The built-in components use this form.
//
// The game does not start by itself: call game.start() from the control that
// begins it (that gesture also unlocks sound), after game.load() to continue.

export function useGame(source) {
  const ref = useRef(null);
  const [, setTick] = useState(0);

  if (!ref.current) {
    const owned = !isGame(source);
    ref.current = { game: owned ? createGame(source) : source, owned };
  }

  // Effects run after the render that scheduled them, and the game does not
  // wait: a change made in between has no listener yet. Compare revisions on
  // subscribing and catch up, or the component shows a state that is gone.
  const rendered = ref.current.game.revision;
  useEffect(() => {
    const { game, owned } = ref.current;
    const unsubscribe = game.subscribe(() => setTick((tick) => tick + 1));
    if (game.revision !== rendered) setTick((tick) => tick + 1);
    return () => {
      unsubscribe();
      if (owned) game.destroy();
    };
  }, []);

  return ref.current.game;
}

// ── Components ───────────────────────────────────────────────────────────────

function jc(...classes) {
  return classes.filter(Boolean).join(" ");
}

// A scene-local rect, placed in the world. Scenes can be tilted; the rect
// turns about the scene's centre with it, and the camera takes the same roll.
function sceneRectToWorld(scene, rect) {
  const angle = ((scene.rotate || 0) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = rect.x + rect.w / 2 - scene.w / 2;
  const dy = rect.y + rect.h / 2 - scene.h / 2;
  const cx = scene.x + scene.w / 2 + dx * cos - dy * sin;
  const cy = scene.y + scene.h / 2 + dx * sin + dy * cos;
  return {
    x: cx - rect.w / 2,
    y: cy - rect.h / 2,
    w: rect.w,
    h: rect.h,
    rotate: scene.rotate || 0,
    padding: rect.padding,
    zoom: rect.zoom,
  };
}

// GameStage — the world. One ZoomStage frame per scene; the game's goTo()
// becomes a camera flight and resolves when it lands, game.focus() a close-up.
//
// Props:
//   game        the game (createGame / useGame)
//   hints       bool — mark every hotspot (touch has no hover to find them)
//   transition  ZoomStage transition between scenes (default "glide"); a
//               scene's own `transition` wins
//   duration    ms or "auto" (default "auto")
//   padding     viewport margin fraction around a scene (default 0)
//   ariaLabel   accessible name of the stage (default "Game")
//
// The stage takes no children. Whatever sits over the world — GameDialogue, a
// HUD, a title screen — is a SIBLING inside one `.m-game` wrapper:
//
//   h("div", { className: "m-game" },
//     h(GameStage, { game }),
//     h(GameDialogue, { game }),
//   )
//
// (Each of them re-renders on its own when the game changes. A stage that
// received the dialogue as a child would redraw it from the copy it was handed,
// one render late.)

export function GameStage({
  game: source,
  hints = false,
  transition = "glide",
  duration = "auto",
  easing,
  padding = 0,
  ariaLabel = "Game",
  className = "",
  style,
} = {}) {
  const game = useGame(source);
  const rootRef = useRef(null);
  const zoomRef = useRef(null);
  const pendingRef = useRef(null);
  const lastUsedRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  const scenes = game.scenes;
  const idle = game.started && !game.busy && !game.moving && !game.dialogue;

  useEffect(() => {
    const settle = () => {
      const pending = pendingRef.current;
      pendingRef.current = null;
      pending?.resolve();
    };
    const detach = game.attachStage({
      travel(from, to, options = {}) {
        return new Promise((resolve) => {
          settle();
          const zoom = zoomRef.current;
          if (!zoom || !zoom.frames.some((frame) => frame.id === to)) {
            resolve();
            return;
          }
          const pending = { id: to, resolve, flying: false };
          pendingRef.current = pending;
          zoom.goTo(to, { animate: options.animate !== false, transition: options.transition });
          // No flight began (the camera is not built yet): nothing will land.
          if (pendingRef.current === pending && !pending.flying) settle();
        });
      },
      focus(target, scene, options = {}) {
        const zoom = zoomRef.current;
        if (!zoom || (target && !isNumber(target.w))) return Promise.resolve(false);
        return zoom.lookAt(target ? sceneRectToWorld(scene, target) : null, options);
      },
    });
    return () => {
      detach();
      settle();
    };
  }, []);

  // The scene changed without a journey (load, reset): put the camera there.
  useEffect(() => {
    const zoom = zoomRef.current;
    if (!zoom || pendingRef.current) return;
    if (zoom.frames[zoom.index]?.id !== game.scene) zoom.goTo(game.scene, { animate: false });
  }, [game.scene]);

  // Hotspot markers live in the world, so the camera shrinks them with it. The
  // stage publishes how much the current scene is scaled to fit, and the
  // stylesheet divides by it: a marker stays finger-sized on a phone.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver !== "function") return undefined;
    const scene = game.sceneData;
    const measure = () => {
      const fit = Math.min(root.clientWidth / scene.w, root.clientHeight / scene.h);
      if (fit > 0) root.style.setProperty("--m-game-zoom", String(Math.round(fit * 1000) / 1000));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, [game.scene]);

  // A line of dialogue takes the focus to its own button. When the story goes
  // quiet again, hand it back to the hotspot that started it.
  useEffect(() => {
    if (!idle || !lastUsedRef.current) return;
    const id = lastUsedRef.current;
    lastUsedRef.current = null;
    const root = rootRef.current;
    const focused = document.activeElement;
    if (!root || (focused && focused !== document.body)) return;
    // The hotspot may be gone (taken, or left behind in another scene): the
    // stage itself is the next best place, so Tab continues from the world.
    let target = root.querySelector(".m-zoom-stage");
    for (const node of root.querySelectorAll("[data-game-hotspot]")) {
      if (node.dataset.gameHotspot === id) target = node;
    }
    target?.focus({ preventScroll: true });
  }, [idle]);

  // Hotspots placed with `at` belong to a free-roaming world, not to this one.
  const liveHotspots = game.started ? game.hotspots().filter((hotspot) => !hotspot.at) : [];
  const caption = liveHotspots.find((hotspot) => hotspot.id === hovered)?.label || "";

  const frames = scenes.map((scene) => ({
    id: scene.id,
    x: scene.x,
    y: scene.y,
    w: scene.w,
    h: scene.h,
    rotate: scene.rotate,
    camera: scene.camera,
    transition: scene.transition,
    surface: scene.surface || "none",
    shape: scene.shape,
    label: scene.label,
    frameClassName: jc("m-game-scene", scene.className),
    render: (zoom) => {
      const active = scene.id === game.scene;
      const live = active && idle;
      const state = {
        game,
        scene,
        active,
        live,
        visited: game.visited.includes(scene.id),
        phase: zoom.phase,
        settled: zoom.settled,
      };
      return h(
        "div",
        { className: "m-game-scene-body" },
        h(
          "div",
          { className: "m-game-scene-art" },
          typeof scene.render === "function" ? scene.render(state) : scene.content,
        ),
        h(
          "div",
          { className: "m-game-hotspots" },
          active
            ? liveHotspots.map((hotspot) => h(
              "button",
              {
                key: hotspot.id,
                type: "button",
                className: jc(
                  "m-game-hotspot",
                  `m-game-hotspot-${hotspot.kind}`,
                  hotspot.shape === "circle" && "m-game-hotspot-circle",
                  hotspot.className,
                ),
                style: {
                  left: `${hotspot.x}px`,
                  top: `${hotspot.y}px`,
                  width: `${hotspot.w}px`,
                  height: `${hotspot.h}px`,
                },
                dataset: { gameHotspot: hotspot.id },
                ariaLabel: hotspot.label,
                ariaDisabled: live ? "false" : "true",
                onClick: (event) => {
                  event.stopPropagation();
                  if (!live) return;
                  lastUsedRef.current = hotspot.id;
                  game.use(hotspot.id);
                },
                onMouseEnter: () => setHovered(hotspot.id),
                onMouseLeave: () => setHovered((current) => (current === hotspot.id ? null : current)),
                onFocus: () => setHovered(hotspot.id),
                onBlur: () => setHovered((current) => (current === hotspot.id ? null : current)),
              },
              typeof hotspot.render === "function" ? hotspot.render(state) : null,
              h("span", { className: "m-game-hotspot-mark", ariaHidden: "true" }),
            ))
            : null,
        ),
      );
    },
  }));

  return h(
    "div",
    {
      ref: rootRef,
      className: jc(
        "m-game-stage",
        hints && "m-game-stage-hints",
        game.started && !idle && "m-game-stage-busy",
        className,
      ),
      style,
    },
    h(ZoomStage, {
      frames,
      defaultIndex: Math.max(0, scenes.findIndex((scene) => scene.id === game.scene)),
      controllerRef: zoomRef,
      transition,
      duration,
      easing,
      padding,
      keyboardNav: false,
      advanceOnClick: false,
      swipeNav: false,
      ariaLabel,
      onTransitionStart: () => {
        if (pendingRef.current) pendingRef.current.flying = true;
      },
      onSettledIndexChange: (index) => {
        const pending = pendingRef.current;
        if (pending && scenes[index]?.id === pending.id) {
          pendingRef.current = null;
          pending.resolve();
        }
      },
    }),
    h("div", { className: "m-game-caption", ariaHidden: "true" }, caption),
  );
}

// GameDialogue — the line being spoken, and the choices when there are any.
// Pressing the box (or Enter/Space on its button) moves to the next line.
//
// Props: game, continueLabel ("Continue"), ariaLabel ("Dialogue"), className

export function GameDialogue({
  game: source,
  continueLabel = "Continue",
  ariaLabel = "Dialogue",
  className = "",
} = {}) {
  const game = useGame(source);
  const textId = useId();
  const firstRef = useRef(null);
  // A callback ref that only ever records a node: when the Continue button
  // gives way to choices, the outgoing button's `null` must not erase the
  // incoming one.
  const keepFirst = useRef((node) => {
    if (node) firstRef.current = node;
  }).current;
  const line = game.dialogue;

  // Each new line takes the keyboard to the control that answers it.
  useEffect(() => {
    if (line && firstRef.current?.isConnected) firstRef.current.focus({ preventScroll: true });
  }, [line?.key]);

  return h(
    "div",
    {
      className: jc("m-game-dialogue", !line && "m-game-dialogue-idle", className),
      role: "group",
      ariaLabel,
      onClick: () => {
        if (line && !line.choices) game.advance();
      },
    },
    h(
      "div",
      { id: textId, className: "m-game-dialogue-text", ariaLive: "polite" },
      h("p", { className: "m-game-speaker" }, line?.speaker || ""),
      h("p", { className: "m-game-line" }, line?.text || ""),
    ),
    h(
      "div",
      { className: "m-game-dialogue-actions" },
      !line
        ? null
        : line.choices
          ? line.choices.map((choice, index) => h(
            "button",
            {
              key: choice.id,
              type: "button",
              ref: index === 0 ? keepFirst : undefined,
              className: "m-game-choice",
              ariaDescribedby: index === 0 ? textId : undefined,
              onClick: (event) => {
                event.stopPropagation();
                game.pick(choice.id);
              },
            },
            choice.label,
          ))
          : h(
            "button",
            {
              key: "continue",
              type: "button",
              ref: keepFirst,
              className: "m-game-continue",
              ariaDescribedby: textId,
            },
            continueLabel,
          ),
    ),
  );
}

function itemIcon(item) {
  if (typeof item.icon === "function") return item.icon();
  return item.icon || null;
}

// GameInventory — what the player carries. Pressing an item selects it; the
// next hotspot used receives it as `item`. Pressing it again puts it away.
//
// Props: game, ariaLabel ("Inventory"), emptyLabel ("Nothing yet"), className

export function GameInventory({
  game: source,
  ariaLabel = "Inventory",
  emptyLabel = "Nothing yet",
  className = "",
} = {}) {
  const game = useGame(source);
  const held = game.inventory.filter((id) => id in game.items);

  return h(
    "div",
    { className: jc("m-game-inventory", className), role: "group", ariaLabel },
    held.length === 0
      ? h("p", { className: "m-game-empty" }, emptyLabel)
      : h(
        "ul",
        { className: "m-game-items" },
        held.map((id) => {
          const item = game.items[id];
          const pressed = game.selected === id;
          return h(
            "li",
            { key: id },
            h(
              "button",
              {
                type: "button",
                className: jc("m-game-item", pressed && "m-game-item-selected"),
                ariaPressed: pressed ? "true" : "false",
                title: item.description,
                dataset: { gameItem: id },
                onClick: () => game.select(pressed ? null : id),
              },
              h("span", { className: "m-game-item-icon", ariaHidden: "true" }, itemIcon(item)),
              h("span", { className: "m-game-item-name" }, item.name ?? id),
            ),
          );
        }),
      ),
  );
}

// GameJournal — every entry found so far, in the order it was found, and how
// many are left.
//
// Props: game, ariaLabel ("Journal"), emptyLabel ("No notes yet"),
//        countLabel ((found, total) => "2 of 7"), className

export function GameJournal({
  game: source,
  ariaLabel = "Journal",
  emptyLabel = "No notes yet",
  countLabel = (found, total) => `${found} of ${total}`,
  className = "",
} = {}) {
  const game = useGame(source);
  const found = game.notes.filter((id) => id in game.journal);
  const total = Object.keys(game.journal).length;

  return h(
    "div",
    { className: jc("m-game-journal", className), role: "group", ariaLabel },
    h("p", { className: "m-game-journal-count" }, countLabel(found.length, total)),
    found.length === 0
      ? h("p", { className: "m-game-empty" }, emptyLabel)
      : h(
        "ol",
        { className: "m-game-notes" },
        found.map((id) => {
          const entry = game.journal[id];
          return h(
            "li",
            { key: id, className: "m-game-note", dataset: { gameNote: id } },
            h("p", { className: "m-game-note-title" }, entry.title ?? id),
            entry.text ? h("p", { className: "m-game-note-text" }, entry.text) : null,
          );
        }),
      ),
  );
}

// ── Free-roaming worlds ──────────────────────────────────────────────────────

// The actions GameViewport listens for unless told otherwise. "use" presses
// the hotspot within reach; the rest are for the world to read.
export const GAME_ACTIONS = Object.freeze({
  forward: Object.freeze(["KeyW", "ArrowUp"]),
  back: Object.freeze(["KeyS", "ArrowDown"]),
  left: Object.freeze(["KeyA"]),
  right: Object.freeze(["KeyD"]),
  turnLeft: Object.freeze(["ArrowLeft", "KeyQ"]),
  turnRight: Object.freeze(["ArrowRight"]),
  run: Object.freeze(["ShiftLeft", "ShiftRight"]),
  use: Object.freeze(["KeyE", "Enter", "Space"]),
});

// GameViewport — a canvas for a world the app draws itself (Canvas 2D, WebGL,
// a 3D library), with the loop, the input and the story already wired.
//
//   h(GameViewport, { game, world: createWorld })
//
//   function createWorld({ canvas, game, input }) {
//     …build the renderer…
//     return {
//       update(dt) {},                 // fixed step, seconds
//       render(alpha) {},              // once per frame
//       resize(width, height, dpr) {}, // CSS pixels + device pixel ratio
//       position() { return [x, z]; }, // where the player is → reach + "use"
//       focus(target, scene) {},       // game.focus(): turn to a hotspot
//       travel(from, to, options) {},  // game.goTo(): change scene
//       save() {}, load(data) {},      // what the save keeps (position…)
//       destroy() {},
//     };
//   }
//
// Every member is optional. The factory runs once, on mount; if it throws
// (no WebGL, for instance) the viewport shows `errorLabel` instead of a dead
// canvas. While the story is talking the input reads as idle, so the player
// stands still; the loop keeps running, so the world stays alive.
//
// Props:
//   game, world   the game and the factory above
//   actions       action → key codes (default GAME_ACTIONS)
//   pointerLock   capture the mouse on click (default false: drag to look)
//   rate          updates per second (default 60)
//   controllerRef ref — { input, loop, world } once mounted
//   ariaLabel     accessible name of the canvas (default "Game world")
//   errorLabel    shown when the world cannot start

export function GameViewport({
  game: source,
  world,
  actions = GAME_ACTIONS,
  pointerLock = false,
  rate = 60,
  controllerRef,
  ariaLabel = "Game world",
  errorLabel = "This world could not start in your browser.",
  className = "",
  style,
} = {}) {
  const game = useGame(source);
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const liveRef = useRef(null);
  const [failed, setFailed] = useState(false);

  const idle = game.started && !game.busy && !game.moving && !game.dialogue;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || typeof world !== "function") return undefined;

    const input = createInput(canvas, { actions, pointerLock });
    let instance;
    try {
      instance = world({ canvas, game, input }) || {};
    } catch (error) {
      console.error("fluxaway-game: the world could not start.", error);
      input.destroy();
      setFailed(true);
      return undefined;
    }

    const loop = createLoop({
      rate,
      update: (dt, time) => {
        instance.update?.(dt, time);
        if (typeof instance.position !== "function") return;
        game.aim(game.near(instance.position())?.id ?? null);
        if (input.pressed("use")) game.use();
      },
      render: (alpha, time) => instance.render?.(alpha, time),
    });

    const fit = () => {
      const width = root.clientWidth;
      const height = root.clientHeight;
      if (width > 0 && height > 0) instance.resize?.(width, height, window.devicePixelRatio || 1);
    };
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(fit) : null;
    observer?.observe(root);
    fit();

    const call = (name) => (typeof instance[name] === "function"
      ? (...args) => instance[name](...args)
      : undefined);
    const detach = game.attachStage({
      travel: call("travel"),
      focus: call("focus"),
      save: call("save"),
      load: call("load"),
    });

    liveRef.current = { input, loop, world: instance };
    if (controllerRef) controllerRef.current = liveRef.current;
    loop.start();

    return () => {
      loop.stop();
      detach();
      observer?.disconnect();
      input.destroy();
      liveRef.current = null;
      if (controllerRef) controllerRef.current = null;
      try {
        instance.destroy?.();
      } catch (error) {
        console.error("fluxaway-game: the world could not be destroyed cleanly.", error);
      }
    };
  }, []);

  // A line on screen needs the pointer back, and the player should not walk
  // off while reading it.
  useEffect(() => {
    const live = liveRef.current;
    if (!live) return;
    live.input.enable(idle);
    if (!idle) {
      live.input.unlock();
      return;
    }
    // The control that held the focus (a Continue button, the title screen)
    // is gone: put the keyboard back on the world.
    const focused = document.activeElement;
    if (!focused || focused === document.body) canvasRef.current?.focus({ preventScroll: true });
  }, [idle]);

  return h(
    "div",
    {
      ref: rootRef,
      className: jc(
        "m-game-viewport",
        failed && "m-game-viewport-failed",
        game.started && !idle && "m-game-viewport-busy",
        className,
      ),
      style,
    },
    h("canvas", {
      ref: canvasRef,
      className: "m-game-canvas",
      tabIndex: 0,
      role: "application",
      ariaLabel,
    }),
    h("p", { className: "m-game-viewport-error", role: failed ? "alert" : undefined }, failed ? errorLabel : ""),
  );
}

// GamePrompt — the hotspot within reach, as a button. Pressing it (or the
// "use" action) runs its script.
//
// Props: game, keyLabel ("E" — the key shown next to the name; "" hides it),
//        className

export function GamePrompt({ game: source, keyLabel = "E", className = "" } = {}) {
  const game = useGame(source);
  const idle = game.started && !game.busy && !game.moving && !game.dialogue;
  const hotspot = idle && game.target
    ? game.hotspots().find((candidate) => candidate.id === game.target) || null
    : null;

  return h(
    "div",
    { className: jc("m-game-prompt", !hotspot && "m-game-prompt-idle", className), ariaLive: "polite" },
    hotspot
      ? h(
        "button",
        {
          type: "button",
          className: jc("m-game-prompt-button", `m-game-prompt-${hotspot.kind}`),
          dataset: { gameHotspot: hotspot.id },
          onClick: () => game.use(hotspot.id),
        },
        keyLabel ? h("kbd", { className: "m-game-prompt-key", ariaHidden: "true" }, keyLabel) : null,
        h("span", { className: "m-game-prompt-label" }, hotspot.label),
      )
      : null,
  );
}

// GameStick — an on-screen stick for touch. It reports where the thumb is,
// x right and y FORWARD, each from -1 to 1, and (0, 0) when let go:
//
//   h(GameStick, { onMove: (x, y) => viewRef.current?.input.setStick(x, y) })
//
// It is a pointer-only control with a keyboard equivalent (the movement
// actions), so it is hidden from assistive technology and takes no focus.

export function GameStick({ onMove, className = "" } = {}) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const heldRef = useRef(null);
  const moveRef = useRef(onMove);
  moveRef.current = onMove;

  const place = (x, y) => {
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!base || !knob) return;
    const reach = base.clientWidth / 2;
    knob.style.transform = `translate(${x * reach * 0.6}px, ${-y * reach * 0.6}px)`;
  };

  const report = (event) => {
    const base = baseRef.current;
    if (!base) return;
    const box = base.getBoundingClientRect();
    const reach = box.width / 2 || 1;
    let x = (event.clientX - (box.left + reach)) / reach;
    let y = -(event.clientY - (box.top + box.height / 2)) / reach;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    place(x, y);
    moveRef.current?.(x, y);
  };

  const letGo = (event) => {
    if (heldRef.current !== event.pointerId) return;
    heldRef.current = null;
    place(0, 0);
    moveRef.current?.(0, 0);
  };

  // A stick removed mid-press must not leave the player walking.
  useEffect(() => () => {
    if (heldRef.current !== null) moveRef.current?.(0, 0);
  }, []);

  return h(
    "div",
    {
      ref: baseRef,
      className: jc("m-game-stick", className),
      ariaHidden: "true",
      onPointerDown: (event) => {
        heldRef.current = event.pointerId;
        capturePointer(event.currentTarget, event.pointerId);
        report(event);
      },
      onPointerMove: (event) => {
        if (heldRef.current === event.pointerId) report(event);
      },
      onPointerUp: letGo,
      onPointerCancel: letGo,
    },
    h("span", { ref: knobRef, className: "m-game-stick-knob" }),
  );
}
