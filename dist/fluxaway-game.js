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
// made, the camera to arrive, a movie to finish. This module is that and
// nothing else — it draws no art and simulates no physics.
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
//                   render?, className? }
//   x/y/w/h are pixels INSIDE the scene. `label` is the accessible name.
//   kind (GAME_HOTSPOT_KINDS) only picks the cursor and marker.
//   when(game) → false hides it. use(game, { item, hotspot, scene }) is the
//   script; `item` is the inventory item selected when it was pressed. `to`
//   travels to another scene afterwards, unless use returned false.
//
// Saving: one slot in localStorage under `fluxaway-game:<id>`, written by the
// engine whenever the story is at rest (no script running, no line on screen),
// so a reload never lands in the middle of a script. Nothing is read back on
// its own: call game.load() before game.start() to continue.

export const GAME_HOTSPOT_KINDS = Object.freeze(["use", "look", "talk", "take", "exit"]);

const GAME = Symbol("fluxaway-game");
const DEFAULT_SIZE = { w: 1600, h: 900 };
const DEFAULT_GAP = 400;

const isGame = (value) => Boolean(value && value[GAME] === true);
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

function fail(message) {
  throw new Error(`fluxaway-game: ${message}`);
}

function normalizeHotspot(sceneId, hotspot) {
  if (!hotspot || typeof hotspot.id !== "string" || !hotspot.id) {
    fail(`a hotspot in scene "${sceneId}" has no id.`);
  }
  for (const key of ["x", "y", "w", "h"]) {
    if (!isNumber(hotspot[key])) {
      fail(`hotspot "${hotspot.id}" in scene "${sceneId}" needs a numeric ${key}.`);
    }
  }
  const kind = GAME_HOTSPOT_KINDS.includes(hotspot.kind) ? hotspot.kind : hotspot.to ? "exit" : "use";
  return Object.freeze({ ...hotspot, kind, label: hotspot.label ?? hotspot.id });
}

// Give every scene a place in the world. A scene with its own x keeps it; the
// others line up after the widest point reached so far.
function layoutScenes(input, size, gap) {
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
      const normalized = normalizeHotspot(scene.id, hotspot);
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
  const scenes = Object.freeze(layoutScenes(spec.scenes || [], size, isNumber(spec.gap) ? spec.gap : DEFAULT_GAP));
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
    const target = sceneById.get(id);
    if (!target) fail(`unknown scene "${id}".`);
    if (destroyed || id === sceneId) return Promise.resolve(false);
    return run(async () => {
      const from = sceneId;
      sceneId = id;
      selected = null;
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
      await run(target.enter, { first, from });
      return true;
    });
  }

  function use(id) {
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
      rect = { x: hotspot.x, y: hotspot.y, w: hotspot.w, h: hotspot.h, padding: 0.22 };
    }
    if (destroyed || !stage || typeof stage.focus !== "function") return Promise.resolve(false);
    return gate(new Promise((resolve) => resolve(stage.focus(rect, scene, options))));
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
    save() {
      return writeSave();
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
      commit();
    },

    // The world on screen plugs in here. GameStage does it for the 2D world;
    // another renderer hands over its own { travel, focus }, both returning a
    // promise that settles when the move is over.
    attachStage(adapter) {
      stage = adapter || null;
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
        if (!zoom) return Promise.resolve(false);
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

  const liveHotspots = game.started ? game.hotspots() : [];
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
