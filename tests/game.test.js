// Tests for the fluxaway-game add-on: the story engine (createGame — scripts,
// dialogue, inventory, journal, save slot, sound) and the shell around it
// (GameStage on a ZoomStage, GameDialogue, GameInventory, GameJournal), plus
// the two primitives it leans on: timeline.finished() and ZoomStage's lookAt().

import { h, render } from "../dist/fluxaway.js";
import {
  GAME_ACTIONS,
  GAME_HOTSPOT_KINDS,
  GameDialogue,
  GameInventory,
  GameJournal,
  GamePrompt,
  GameStage,
  GameStick,
  GameViewport,
  createGame,
  createInput,
  createLoop,
  useGame,
} from "../dist/fluxaway-game.js";
import { createTimeline } from "../dist/fluxaway-motion.js";
import { ZoomStage } from "../dist/fluxaway-zoom.js";
import { test, assert, assertEqual, mountPoint, flush } from "./runner.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function throws(fn) {
  try {
    fn();
  } catch (error) {
    return String(error.message);
  }
  return null;
}

// A two-room story: a key in a crate, a locked door, a note on the far side.
function story(extra = {}) {
  const log = [];
  const spec = {
    state: { knocked: 0 },
    items: { key: { name: "Iron key", description: "Cold and heavy." }, coin: { name: "Coin" } },
    journal: { tide: { title: "The tide table", text: "High water at six." }, lamp: { title: "The lamp" } },
    scenes: [
      {
        id: "shore",
        label: "The shore",
        content: h("p", null, "shore art"),
        hotspots: [
          {
            id: "crate",
            label: "Crate",
            x: 100,
            y: 100,
            w: 200,
            h: 150,
            when: (game) => !game.has("key"),
            use: async (game) => {
              await game.say(["A crate.", { speaker: "Keeper", text: "Mine." }]);
              game.give("key");
            },
          },
          {
            id: "door",
            label: "Door",
            x: 900,
            y: 200,
            w: 200,
            h: 400,
            to: "room",
            use: async (game, { item }) => {
              log.push(`door:${item}`);
              if (game.has("key")) return true;
              game.set("knocked", game.get("knocked") + 1);
              await game.say("Locked.");
              return false;
            },
          },
        ],
      },
      {
        id: "room",
        label: "The lamp room",
        content: h("p", null, "room art"),
        enter: async (game, { first, from }) => {
          log.push(`enter:${first}:${from}`);
          if (first) game.note("lamp");
        },
        hotspots: [{ id: "back", label: "Back down", x: 0, y: 0, w: 100, h: 100, to: "shore" }],
      },
    ],
    ...extra,
  };
  return { game: createGame(spec), log };
}

// ── World ───────────────────────────────────────────────────

test("game: scenes without coordinates line up left to right; explicit ones stay put", () => {
  const game = createGame({
    size: { w: 1000, h: 500 },
    gap: 100,
    scenes: [{ id: "a" }, { id: "b" }, { id: "c", x: 50, y: 900, w: 300, h: 200 }, { id: "d" }],
  });
  const [a, b, c, d] = game.scenes;
  assertEqual(`${a.x},${a.y},${a.w},${a.h}`, "0,0,1000,500");
  assertEqual(b.x, 1100, "the second scene starts one gap after the first");
  assertEqual(`${c.x},${c.y},${c.w},${c.h}`, "50,900,300,200");
  assertEqual(d.x, 2200, "auto placement continues after the widest point, not after the hand-placed scene");
  assertEqual(a.label, "a", "a scene without a label is announced by its id");
});

test("game: a spec that cannot work fails at creation, with the name of what is wrong", () => {
  assert(throws(() => createGame({ scenes: [] })).includes("at least one scene"));
  assert(throws(() => createGame({ scenes: [{ id: "a" }, { id: "a" }] })).includes('"a"'));
  assert(throws(() => createGame({ start: "nowhere", scenes: [{ id: "a" }] })).includes('"nowhere"'));
  assert(
    throws(() => createGame({ scenes: [{ id: "a", hotspots: [{ id: "x", x: 0, y: 0, w: 1, h: 1, to: "b" }] }] }))
      .includes('unknown scene "b"'),
  );
  assert(
    throws(() => createGame({ scenes: [{ id: "a", hotspots: [{ id: "x", x: 0, y: 0, w: 1 }] }] }))
      .includes("numeric h"),
  );
});

test("game: hotspot kinds default from what the hotspot does", () => {
  const { game } = story();
  assertEqual(GAME_HOTSPOT_KINDS.join(","), "use,look,talk,take,exit");
  const byId = Object.fromEntries(game.scenes[0].hotspots.map((hotspot) => [hotspot.id, hotspot.kind]));
  assertEqual(byId.crate, "use");
  assertEqual(byId.door, "exit", "a hotspot with `to` is an exit");
});

// ── Story ───────────────────────────────────────────────────

test("game: say() shows lines in order and resolves only after the last one is dismissed", async () => {
  const { game } = story();
  let done = false;
  game.say(["One.", { speaker: "Ana", text: "Two." }, "", null]).then(() => { done = true; });
  await flush();

  assertEqual(game.dialogue.text, "One.");
  assertEqual(game.dialogue.total, 2, "empty lines are dropped");
  game.advance();
  await flush();
  assertEqual(game.dialogue.speaker, "Ana");
  assertEqual(done, false);

  game.advance();
  await flush();
  assertEqual(game.dialogue, null);
  assertEqual(done, true);
});

test("game: two say() calls queue instead of overwriting each other", async () => {
  const { game } = story();
  game.say("First.");
  game.say("Second.");
  await flush();
  assertEqual(game.dialogue.text, "First.");
  game.advance();
  await flush();
  assertEqual(game.dialogue.text, "Second.");
});

test("game: choose() offers only the options whose `when` passes and resolves with the pick", async () => {
  const { game } = story();
  let picked;
  game.choose("Which way?", [
    { id: "up", label: "Up the stairs" },
    { id: "boat", label: "Take the boat", when: (g) => g.has("coin") },
    { id: "stay", label: "Stay" },
  ]).then((id) => { picked = id; });
  await flush();

  assertEqual(game.dialogue.text, "Which way?");
  assertEqual(game.dialogue.choices.map((choice) => choice.id).join(","), "up,stay");
  game.advance();
  await flush();
  assert(game.dialogue, "advance() must not skip a choice");
  game.pick("boat");
  await flush();
  assert(game.dialogue, "an option that was not offered cannot be picked");
  game.pick("stay");
  await flush();
  assertEqual(picked, "stay");
  assertEqual(await game.choose("Nothing fits", [{ id: "x", when: () => false }]), null);
});

test("game: a hotspot's script holds the game busy, and `use` returning false cancels the travel", async () => {
  const { game, log } = story();
  await game.start();

  const pressed = game.use("door");
  await flush();
  assertEqual(game.busy, true);
  assertEqual(game.dialogue.text, "Locked.");
  assertEqual(await game.use("crate"), false, "a second hotspot must not answer while a script runs");

  game.advance();
  assertEqual(await pressed, true);
  assertEqual(game.busy, false);
  assertEqual(game.scene, "shore", "the locked door must not lead anywhere");
  assertEqual(game.get("knocked"), 1);
  assertEqual(log.join("|"), "door:null");
});

test("game: the selected item reaches the script, and is put away afterwards", async () => {
  const { game, log } = story();
  await game.start();
  game.give("coin");
  game.select("coin");
  assertEqual(game.selected, "coin");

  const pressed = game.use("door");
  await flush();
  game.advance();
  await pressed;
  assertEqual(log[0], "door:coin");
  assertEqual(game.selected, null);
  game.select("key");
  assertEqual(game.selected, null, "an item that is not held cannot be selected");
});

test("game: travel runs the destination's enter script, with `first` true only once", async () => {
  const { game, log } = story();
  const seen = [];
  game.on("scene", (detail) => seen.push(`${detail.from}>${detail.to}:${detail.first}`));
  await game.start();
  game.give("key");

  assertEqual(await game.use("door"), true);
  assertEqual(game.scene, "room");
  assertEqual(game.noted("lamp"), true);
  assertEqual(await game.goTo("room"), false, "already there");
  await game.use("back");
  await game.goTo("room");

  assertEqual(log.filter((entry) => entry.startsWith("enter")).join("|"), "enter:true:shore|enter:false:shore");
  assertEqual(seen.join("|"), "null>shore:true|shore>room:true|room>shore:false|shore>room:false");
  assertEqual(game.visited.join(","), "shore,room");
});

test("game: a hotspot whose `when` fails is not offered and does not answer", async () => {
  const { game } = story();
  await game.start();
  assertEqual(game.hotspots().map((hotspot) => hotspot.id).join(","), "crate,door");
  game.give("key");
  assertEqual(game.hotspots().map((hotspot) => hotspot.id).join(","), "door");
  assertEqual(await game.use("crate"), false);
});

test("game: unknown ids throw instead of failing silently", () => {
  const { game } = story();
  assert(throws(() => game.give("sword")).includes('unknown item "sword"'));
  assert(throws(() => game.note("map")).includes('unknown journal entry "map"'));
  assert(throws(() => game.goTo("moon")).includes('unknown scene "moon"'));
  assert(throws(() => game.sound("bell")).includes('unknown sound "bell"'));
});

test("game: a script that throws is logged and releases the busy lock", async () => {
  const { game } = story();
  const original = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    await game.run(() => { throw new Error("boom"); });
  } finally {
    console.error = original;
  }
  assertEqual(errors.length, 1);
  assertEqual(game.busy, false);
});

// ── Save slot ───────────────────────────────────────────────

test("game: the save is written only while the story is at rest", async () => {
  const storage = memoryStorage();
  const { game } = story({ id: "t-rest", storage });
  const saved = () => JSON.parse(storage.getItem("fluxaway-game:t-rest"));

  game.set("knocked", 5);
  assertEqual(storage.data.size, 0, "nothing is saved before the game starts");
  await game.start();
  assertEqual(saved().state.knocked, 5);

  const pressed = game.use("crate");
  await flush();
  game.advance();
  await flush();
  assertEqual(game.dialogue.speaker, "Keeper");
  assertEqual(saved().inventory.length, 0, "mid-script state must not reach the slot");
  game.advance();
  await pressed;
  assertEqual(saved().inventory.join(","), "key");
});

test("game: load() restores a slot, and a fresh game does not read it on its own", async () => {
  const storage = memoryStorage();
  const first = story({ id: "t-load", storage }).game;
  await first.start();
  first.give("key");
  first.note("tide");
  await first.use("door");
  first.mute(true);
  assertEqual(first.scene, "room");

  const { game, log } = story({ id: "t-load", storage });
  assertEqual(game.scene, "shore");
  assertEqual(game.hasSave, true);
  assertEqual(game.load(), true);
  assertEqual(game.scene, "room");
  assertEqual(game.inventory.join(","), "key");
  assertEqual(game.notes.join(","), "tide,lamp");
  assertEqual(game.muted, true);
  await game.start();
  assertEqual(log.join("|"), "enter:false:null", "a restored scene is not a first visit");
});

test("game: a save from another version is discarded unless migrate() adopts it", () => {
  const storage = memoryStorage();
  storage.setItem("fluxaway-game:t-ver", JSON.stringify({ v: 1, scene: "room", state: { knocked: 9 } }));

  const strict = story({ id: "t-ver", storage, version: 2 }).game;
  assertEqual(strict.hasSave, false);
  assertEqual(strict.load(), false);

  const lenient = story({
    id: "t-ver",
    storage,
    version: 2,
    migrate: (saved, from) => ({ ...saved, v: 2, state: { ...saved.state, from } }),
  }).game;
  assertEqual(lenient.load(), true);
  assertEqual(lenient.scene, "room");
  assertEqual(lenient.get("from"), 1);
  assertEqual(lenient.get("knocked"), 9);
});

test("game: reset() erases the slot and parks the script that was running", async () => {
  const storage = memoryStorage();
  const { game } = story({ id: "t-reset", storage });
  await game.start();
  game.give("coin");

  let resumed = false;
  game.run(async (g) => {
    await g.say("Never finished.");
    resumed = true;
    g.give("key");
  });
  await flush();
  assert(game.dialogue);

  game.reset();
  await flush();
  assertEqual(game.dialogue, null);
  assertEqual(game.busy, false);
  assertEqual(game.started, false);
  assertEqual(game.inventory.length, 0);
  assertEqual(storage.data.size, 0);

  game.advance();
  await flush();
  assertEqual(resumed, false, "a script from before the reset must not continue");
  assertEqual(game.has("key"), false);
});

test("game: without an id nothing is ever written", async () => {
  const before = localStorage.length;
  const { game } = story();
  await game.start();
  game.give("key");
  assertEqual(game.save(), false);
  assertEqual(localStorage.length, before);
});

// ── Sound ───────────────────────────────────────────────────

function fakeAudio(state = "running") {
  const gain = () => ({ gain: { value: 1 }, connect() {} });
  return { state, destination: {}, createGain: gain, resume: () => Promise.resolve() };
}

test("game: a synthesised sound plays through the game's output, and not while muted", () => {
  const played = [];
  const context = fakeAudio();
  const game = createGame({
    scenes: [{ id: "a" }],
    audioContext: context,
    sounds: { bell: (ctx, out, options) => played.push({ ctx, out, options }) },
  });

  assertEqual(game.sound("bell", { volume: 0.5 }), true);
  assertEqual(played.length, 1);
  assertEqual(played[0].ctx, context);
  assertEqual(played[0].out.gain.value, 0.5, "volume gets its own gain node");

  game.mute();
  assertEqual(game.muted, true);
  assertEqual(game.sound("bell"), false);
  game.mute(false);
  assertEqual(game.sound("bell"), true);
  assertEqual(played.length, 2);
});

test("game: a suspended audio context drops the sound instead of queueing it", () => {
  let played = 0;
  const game = createGame({
    scenes: [{ id: "a" }],
    audioContext: fakeAudio("suspended"),
    sounds: { bell: () => { played += 1; } },
  });
  assertEqual(game.sound("bell"), false);
  assertEqual(played, 0);
});

// ── Motion: finished() and game.play() ──────────────────────

test("motion: finished() resolves true on completion and false when the run is cut short", async () => {
  const tl = createTimeline({ duration: 40, tracks: { box: [{ at: 0, x: 0 }, { at: 40, x: 10 }] } });
  assertEqual(await tl.finished(), false, "a timeline that never played is not finished");

  tl.play();
  assertEqual(await tl.finished(), true);
  assertEqual(await tl.finished(), true, "at the end, and not playing");

  tl.gotoAndPlay(0);
  const cut = tl.finished();
  tl.stop();
  assertEqual(await cut, false);

  tl.gotoAndPlay(0);
  const destroyed = tl.finished();
  tl.destroy();
  assertEqual(await destroyed, false);
});

test("game: play() waits for a timeline inside a script", async () => {
  const { game } = story();
  const tl = createTimeline({ duration: 40, tracks: { box: [{ at: 0, x: 0 }, { at: 40, x: 10 }] } });
  const order = [];
  await game.run(async (g) => {
    order.push("before");
    order.push(await g.play(tl, 0));
    order.push("after");
  });
  assertEqual(order.join(","), "before,true,after");
  assertEqual(tl.time, 40);
  assert(throws(() => game.play({})).includes("timeline"));
  tl.destroy();
});

// ── ZoomStage: lookAt() ─────────────────────────────────────

test("ZoomStage: lookAt() flies to a close-up without changing the frame, and null returns", async () => {
  const container = mountPoint();
  const controllerRef = { current: null };
  render(() => h(ZoomStage, {
    frames: [
      { id: "a", x: 0, y: 0, w: 400, h: 300, content: "a" },
      { id: "b", x: 600, y: 0, w: 400, h: 300, content: "b" },
    ],
    padding: 0,
    duration: 30,
    controllerRef,
    style: "width:400px;height:300px",
  }), container);
  await flush();

  const world = container.querySelector(".m-zoom-world");
  const home = world.style.transform;
  assertEqual(await controllerRef.current.lookAt({ x: 100, y: 75, w: 200, h: 150 }), true);
  assert(world.style.transform.includes("scale(2)"), `a rect half the frame fits at 2×, got ${world.style.transform}`);
  assert(world.style.transform.includes("translate(-200px, -150px)"), "the camera centres on the rect");
  assertEqual(controllerRef.current.index, 0, "a close-up is not a navigation");

  assertEqual(await controllerRef.current.lookAt({ x: 1 }), false, "a target that is neither a rect nor a camera is refused");
  assertEqual(await controllerRef.current.lookAt(null, { animate: false }), true);
  assertEqual(world.style.transform, home);

  const replaced = controllerRef.current.lookAt({ cx: 200, cy: 150, scale: 3 }, { duration: 400 });
  controllerRef.current.goTo(1);
  assertEqual(await replaced, false, "a navigation replaces the close-up in flight");
});

// ── Shell ───────────────────────────────────────────────────

const STAGE_SIZE = "width:800px;height:450px";

function mountGame(game, props = {}) {
  const container = mountPoint();
  render(() => h(
    "div",
    null,
    h("div", { className: "m-game", style: STAGE_SIZE }, h(GameStage, { game, duration: 30, ...props }), h(GameDialogue, { game })),
    h(GameInventory, { game }),
    h(GameJournal, { game }),
  ), container);
  return container;
}

const hotspot = (container, id) => container.querySelector(`[data-game-hotspot="${id}"]`);

test("GameStage: one frame per scene; hotspots appear only once the game starts", async () => {
  const { game } = story();
  const container = mountGame(game);
  await flush();

  assertEqual(container.querySelectorAll(".m-zoom-frame.m-game-scene").length, 2);
  assert(container.querySelector('[data-zoom-frame-id="shore"]').textContent.includes("shore art"));
  assertEqual(container.querySelectorAll(".m-game-hotspot").length, 0);

  game.start();
  await flush();
  const crate = hotspot(container, "crate");
  assertEqual(crate.getAttribute("aria-label"), "Crate");
  assertEqual(crate.tagName, "BUTTON");
  assertEqual(`${crate.style.left},${crate.style.top},${crate.style.width},${crate.style.height}`, "100px,100px,200px,150px");
  assertEqual(crate.getAttribute("aria-disabled"), "false");
  assert(hotspot(container, "door").classList.contains("m-game-hotspot-exit"));
  assertEqual(hotspot(container, "back"), null, "another scene's hotspots are not in the DOM");
});

test("GameStage + GameDialogue: pressing a hotspot tells its story, line by line", async () => {
  const { game } = story();
  const container = mountGame(game);
  game.start();
  await flush();

  hotspot(container, "crate").click();
  await flush();
  const box = container.querySelector(".m-game-dialogue");
  assert(!box.classList.contains("m-game-dialogue-idle"));
  assertEqual(box.querySelector(".m-game-line").textContent, "A crate.");
  assertEqual(hotspot(container, "door").getAttribute("aria-disabled"), "true");
  assert(container.querySelector(".m-game-stage-busy"));
  const button = box.querySelector(".m-game-continue");
  assertEqual(document.activeElement, button, "the line takes the keyboard to its button");
  assertEqual(button.getAttribute("aria-describedby"), box.querySelector(".m-game-dialogue-text").id);

  hotspot(container, "door").click();
  await flush();
  assertEqual(box.querySelector(".m-game-line").textContent, "A crate.", "a busy hotspot must not answer");

  button.click();
  await flush();
  assertEqual(box.querySelector(".m-game-speaker").textContent, "Keeper");
  box.click();
  await flush();
  assert(box.classList.contains("m-game-dialogue-idle"));
  assertEqual(hotspot(container, "crate"), null, "the crate is gone once the key is taken");
  assertEqual(container.querySelector('[data-game-item="key"]').textContent, "Iron key");
  assert(!container.querySelector(".m-game-stage-busy"));
});

test("GameStage: travel flies the camera, and goTo() resolves once it has landed", async () => {
  const { game } = story();
  const container = mountGame(game);
  await game.start();
  game.give("key");
  await flush();

  const world = container.querySelector(".m-zoom-world");
  const before = world.style.transform;
  let landed = false;
  const journey = game.use("door").then(() => { landed = true; });
  await flush();
  assertEqual(game.scene, "room");
  assertEqual(game.moving, true);
  assertEqual(landed, false, "the script must wait for the camera");
  assertEqual(container.querySelectorAll(".m-game-hotspot[aria-disabled='false']").length, 0);

  await journey;
  await flush();
  assertEqual(game.moving, false);
  assert(world.style.transform !== before, "the camera moved to the other scene");
  assert(container.querySelector('[data-zoom-frame-id="room"]').classList.contains("m-zoom-frame-settled"));
  assertEqual(hotspot(container, "back").getAttribute("aria-disabled"), "false");
  assert(container.querySelector('[data-game-note="lamp"]'), "the enter script ran");
});

test("GameStage: load() and reset() move the camera without a journey", async () => {
  const storage = memoryStorage();
  const first = story({ id: "t-stage", storage }).game;
  await first.start();
  first.give("key");
  await first.use("door");

  const { game } = story({ id: "t-stage", storage });
  const container = mountGame(game);
  await flush();
  const world = container.querySelector(".m-zoom-world");
  const atShore = world.style.transform;

  game.load();
  await flush();
  await flush();
  assert(world.style.transform !== atShore, "the camera follows the restored scene");
  assert(container.querySelector('[data-zoom-frame-id="room"]').classList.contains("m-zoom-frame-active"));

  game.reset();
  await flush();
  await flush();
  assertEqual(world.style.transform, atShore);
});

test("GameStage: focus() closes in on a hotspot and null gives the scene back", async () => {
  const { game } = story();
  const container = mountGame(game);
  await game.start();
  await flush();

  const world = container.querySelector(".m-zoom-world");
  const whole = world.style.transform;
  assertEqual(await game.focus("crate"), true);
  assert(world.style.transform !== whole);
  assertEqual(game.scene, "shore");
  assertEqual(await game.focus(null), true);
  assertEqual(world.style.transform, whole);
  assert(throws(() => game.focus("moon")).includes('unknown hotspot "moon"'));
});

test("GameStage: the caption names the hotspot under the pointer; hints mark them all", async () => {
  const { game } = story();
  const container = mountGame(game, { hints: true });
  game.start();
  await flush();

  const caption = container.querySelector(".m-game-caption");
  assertEqual(caption.textContent, "");
  hotspot(container, "door").dispatchEvent(new MouseEvent("mouseenter"));
  await flush();
  assertEqual(caption.textContent, "Door");
  assertEqual(caption.getAttribute("aria-hidden"), "true", "the button already carries the name");
  hotspot(container, "door").dispatchEvent(new MouseEvent("mouseleave"));
  await flush();
  assertEqual(caption.textContent, "");

  assert(container.querySelector(".m-game-stage-hints"));
  const mark = hotspot(container, "door").querySelector(".m-game-hotspot-mark");
  assertEqual(getComputedStyle(mark).opacity, "1");
  assertEqual(
    container.querySelector(".m-game-stage").style.getPropertyValue("--m-game-zoom"),
    "0.5",
    "an 800px stage shows a 1600px scene at half size",
  );
  assertEqual(Math.round(mark.getBoundingClientRect().width), 28, "the marker keeps its size on screen");
});

test("GameDialogue: choices are buttons; the first one takes the focus", async () => {
  const { game } = story();
  const container = mountGame(game);
  await game.start();
  let picked;
  game.choose({ speaker: "Keeper", text: "Up or down?" }, [{ id: "up", label: "Up" }, { id: "down", label: "Down" }])
    .then((id) => { picked = id; });
  await flush();

  const choices = [...container.querySelectorAll(".m-game-choice")];
  assertEqual(choices.map((choice) => choice.textContent).join(","), "Up,Down");
  assertEqual(container.querySelector(".m-game-continue"), null);
  assertEqual(document.activeElement, choices[0]);

  container.querySelector(".m-game-dialogue").click();
  await flush();
  assert(game.dialogue, "pressing the box must not skip a choice");
  choices[1].click();
  await flush();
  assertEqual(picked, "down");
});

test("GameInventory: pressing an item selects it, pressing again puts it away", async () => {
  const { game } = story();
  const container = mountGame(game);
  await game.start();
  await flush();
  assertEqual(container.querySelector(".m-game-inventory .m-game-empty").textContent, "Nothing yet");

  game.give("key");
  await flush();
  const item = container.querySelector('[data-game-item="key"]');
  assertEqual(item.getAttribute("aria-pressed"), "false");
  assertEqual(item.getAttribute("title"), "Cold and heavy.");
  item.click();
  await flush();
  assertEqual(game.selected, "key");
  assertEqual(container.querySelector('[data-game-item="key"]').getAttribute("aria-pressed"), "true");
  container.querySelector('[data-game-item="key"]').click();
  await flush();
  assertEqual(game.selected, null);
});

test("GameJournal: lists what was found, in the order found, with the count", async () => {
  const { game } = story();
  const container = mountGame(game);
  await game.start();
  await flush();
  assertEqual(container.querySelector(".m-game-journal-count").textContent, "0 of 2");
  assertEqual(container.querySelector(".m-game-journal .m-game-empty").textContent, "No notes yet");

  game.note("lamp");
  game.note("tide");
  await flush();
  assertEqual(container.querySelector(".m-game-journal-count").textContent, "2 of 2");
  const titles = [...container.querySelectorAll(".m-game-note-title")].map((node) => node.textContent);
  assertEqual(titles.join("|"), "The lamp|The tide table");
  assertEqual(container.querySelector('[data-game-note="tide"] .m-game-note-text').textContent, "High water at six.");
});

test("game: every word the shell writes on its own is a prop", async () => {
  const { game } = story();
  const container = mountPoint();
  render(() => h(
    "div",
    { style: STAGE_SIZE },
    h(GameStage, { game, ariaLabel: "Jogo" }),
    h(GameDialogue, { game, ariaLabel: "Diálogo", continueLabel: "Continuar" }),
    h(GameInventory, { game, ariaLabel: "Inventário", emptyLabel: "Nada ainda" }),
    h(GameJournal, { game, ariaLabel: "Caderno", emptyLabel: "Sem anotações", countLabel: (found, total) => `${found} de ${total}` }),
  ), container);
  await game.start();
  game.say("Olá.");
  await flush();

  const text = [...container.querySelectorAll("[aria-label]")].map((node) => node.getAttribute("aria-label")).join("|")
    + container.textContent;
  for (const english of ["Game", "Dialogue", "Continue", "Inventory", "Nothing yet", "Journal", "No notes yet", " of "]) {
    assert(!text.includes(english), `"${english}" is still on the page`);
  }
  for (const translated of ["Jogo", "Diálogo", "Continuar", "Inventário", "Nada ainda", "Caderno", "Sem anotações", "0 de 2"]) {
    assert(text.includes(translated), `"${translated}" did not reach the page`);
  }
});

test("useGame: a change made before the component subscribes is not lost", async () => {
  const { game } = story();
  const container = mountPoint();
  render(() => h("div", { className: "m-game", style: STAGE_SIZE }, h(GameStage, { game }), h(GameDialogue, { game })), container);
  // No flush: the effects that subscribe have not run when the line arrives.
  game.say("Already speaking.");
  await flush();
  await flush();
  assertEqual(container.querySelector(".m-game-line").textContent, "Already speaking.");
});

test("useGame(spec): owns the game — created once, destroyed with the component", async () => {
  const container = mountPoint();
  let captured;
  let renders = 0;
  function App() {
    const game = useGame({ state: { n: 0 }, scenes: [{ id: "a" }] });
    captured = game;
    renders += 1;
    return h("p", null, String(game.get("n")));
  }
  render(App, container);
  await flush();
  const first = captured;

  first.set("n", 7);
  await flush();
  assertEqual(captured, first, "the game survives re-renders");
  assertEqual(container.textContent, "7");
  assert(renders >= 2);

  let notified = 0;
  first.subscribe(() => { notified += 1; });
  render(() => h("p", null, "gone"), container);
  await flush();
  first.set("n", 8);
  assertEqual(notified, 0, "a destroyed game notifies nobody");
});

// ── Free-roaming worlds: loop ───────────────────────────────

test("loop: updates run at the fixed rate whatever the frame time, and render gets the remainder", () => {
  const updates = [];
  const renders = [];
  const loop = createLoop({ rate: 50, update: (dt) => updates.push(dt), render: (alpha) => renders.push(alpha) });
  assertEqual(loop.step, 0.02);

  assertEqual(loop.advance(0.05), 2, "50 ms hold two 20 ms steps");
  assert(Math.abs(renders[0] - 0.5) < 1e-6, `the 10 ms left over are half a step, got ${renders[0]}`);
  assertEqual(loop.advance(0.01), 1, "the remainder carries into the next frame");
  assert(Math.abs(renders[1]) < 1e-6);
  assertEqual(loop.advance(0.004), 0, "a frame shorter than a step still renders");
  assertEqual(renders.length, 3);
  assert(updates.every((dt) => dt === 0.02), "every update gets the same dt");
  assert(Math.abs(loop.time - 0.06) < 1e-9);
});

test("loop: a long gap is capped instead of fast-forwarding the world", () => {
  let updates = 0;
  const loop = createLoop({ rate: 60, update: () => { updates += 1; } });
  loop.advance(30);
  assertEqual(updates, 15, "0.25 s at 60 updates per second");
});

test("loop: start() ticks on animation frames and stop() ends it", async () => {
  let updates = 0;
  let renders = 0;
  const loop = createLoop({ rate: 120, update: () => { updates += 1; }, render: () => { renders += 1; } });
  loop.start();
  assertEqual(loop.running, true);
  await sleep(120);
  loop.stop();
  assertEqual(loop.running, false);
  assert(renders >= 2 && updates >= 2, `expected the loop to run, got ${updates} updates / ${renders} renders`);
  const frozen = updates;
  await sleep(60);
  assertEqual(updates, frozen, "a stopped loop must not update");
});

// ── Free-roaming worlds: input ──────────────────────────────

function keyEvent(type, code, init = {}) {
  return new KeyboardEvent(type, { code, bubbles: true, cancelable: true, ...init });
}

function pointerEvent(type, target, init = {}) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, button: 0, ...init }));
}

function inputOn(options) {
  const target = document.createElement("canvas");
  mountPoint().appendChild(target);
  return { target, input: createInput(target, options) };
}

test("input: actions are held while a key is down, and pressed exactly once per press", () => {
  const { input } = inputOn({ actions: { forward: ["KeyW", "ArrowUp"], use: ["KeyE"] } });
  try {
    assertEqual(input.held("forward"), false);
    const down = keyEvent("keydown", "KeyW");
    window.dispatchEvent(down);
    assertEqual(down.defaultPrevented, true, "a mapped key must not also scroll the page");
    assertEqual(input.held("forward"), true);

    window.dispatchEvent(keyEvent("keydown", "KeyE"));
    window.dispatchEvent(keyEvent("keydown", "KeyE", { repeat: true }));
    assertEqual(input.pressed("use"), true);
    assertEqual(input.pressed("use"), false, "one press is one answer");
    window.dispatchEvent(keyEvent("keydown", "KeyE", { repeat: true }));
    assertEqual(input.pressed("use"), false, "auto-repeat is not a new press");

    window.dispatchEvent(keyEvent("keyup", "KeyW"));
    assertEqual(input.held("forward"), false);
    const unmapped = keyEvent("keydown", "KeyZ");
    window.dispatchEvent(unmapped);
    assertEqual(unmapped.defaultPrevented, false);
  } finally {
    input.destroy();
  }
});

test("input: a key typed into a field, or Enter on a button, is not an action", () => {
  const { input } = inputOn({ actions: { use: ["KeyE", "Enter"] } });
  const field = document.createElement("input");
  const button = document.createElement("button");
  mountPoint().append(field, button);
  try {
    field.dispatchEvent(keyEvent("keydown", "KeyE"));
    assertEqual(input.pressed("use"), false, "typing an E is typing");
    const enter = keyEvent("keydown", "Enter");
    button.dispatchEvent(enter);
    assertEqual(input.pressed("use"), false, "Enter belongs to the focused button");
    assertEqual(enter.defaultPrevented, false, "and must still activate it");
    button.dispatchEvent(keyEvent("keydown", "KeyE"));
    assertEqual(input.pressed("use"), true, "any other key is still the game's");
  } finally {
    input.destroy();
  }
});

test("input: vector() joins keys and stick and never exceeds 1; losing the window drops held keys", () => {
  const { input } = inputOn({ actions: GAME_ACTIONS });
  try {
    window.dispatchEvent(keyEvent("keydown", "KeyW"));
    window.dispatchEvent(keyEvent("keydown", "KeyD"));
    const diagonal = input.vector("left", "right", "back", "forward");
    assert(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-9, "a diagonal is not faster than a straight line");
    assert(diagonal.x > 0 && diagonal.y > 0);
    assertEqual(input.axis("back", "forward"), 1);

    window.dispatchEvent(new Event("blur"));
    assertEqual(input.held("forward"), false, "a key released in another window would stay stuck");

    input.setStick(0.3, -0.4);
    const pushed = input.vector("left", "right", "back", "forward");
    assertEqual(`${pushed.x},${pushed.y}`, "0.3,-0.4", "a gentle push is a slow walk");
    input.setStick(0.3, -4);
    assertEqual(input.stick.y, -1, "the stick is clamped to its rim");
    const hard = input.vector("left", "right", "back", "forward");
    assert(Math.abs(Math.hypot(hard.x, hard.y) - 1) < 1e-9, "and the result never exceeds 1");
  } finally {
    input.destroy();
  }
});

test("input: dragging on the target turns the view; look() hands the delta over once", () => {
  const { target, input } = inputOn({});
  try {
    pointerEvent("pointermove", target, { clientX: 500, clientY: 500 });
    assertEqual(input.look().x, 0, "a pointer that is not held does not turn the view");

    pointerEvent("pointerdown", target, { clientX: 100, clientY: 100 });
    pointerEvent("pointermove", target, { clientX: 130, clientY: 90 });
    pointerEvent("pointermove", target, { clientX: 150, clientY: 95 });
    const delta = input.look();
    assertEqual(`${delta.x},${delta.y}`, "50,-5");
    assertEqual(input.look().x, 0);

    pointerEvent("pointerup", target, { clientX: 150, clientY: 95 });
    pointerEvent("pointermove", target, { clientX: 400, clientY: 400 });
    assertEqual(input.look().x, 0);
  } finally {
    input.destroy();
  }
});

test("input: a locked pointer turns the view by its movement; disable reads as idle", () => {
  const { target, input } = inputOn({ actions: { use: ["KeyE"] }, pointerLock: true });
  Object.defineProperty(document, "pointerLockElement", { configurable: true, get: () => target });
  try {
    assertEqual(input.locked, true);
    pointerEvent("pointermove", target, { movementX: 12, movementY: -3 });
    const delta = input.look();
    assertEqual(`${delta.x},${delta.y}`, "12,-3");

    input.enable(false);
    pointerEvent("pointermove", target, { movementX: 40, movementY: 40 });
    window.dispatchEvent(keyEvent("keydown", "KeyE"));
    assertEqual(input.look().x, 0);
    assertEqual(input.pressed("use"), false);
    assertEqual(input.held("use"), false);
    input.enable(true);
    assertEqual(input.pressed("use"), false, "a press made while disabled is not replayed");
  } finally {
    delete document.pointerLockElement;
    input.destroy();
  }
});

test("input: destroy() stops listening", () => {
  const { input } = inputOn({ actions: { use: ["KeyE"] } });
  input.destroy();
  window.dispatchEvent(keyEvent("keydown", "KeyE"));
  assertEqual(input.pressed("use"), false);
});

// ── Free-roaming worlds: places, reach and the renderer's save ──

function island(extra = {}) {
  const log = [];
  const game = createGame({
    reach: 4,
    items: { fuse: { name: "Fuse" } },
    journal: { cairn: { title: "The cairn" } },
    scenes: [{
      id: "island",
      hotspots: [
        { id: "cairn", label: "Cairn", at: [10, 0], use: (g) => { log.push("cairn"); g.note("cairn"); } },
        { id: "shed", label: "Shed", at: [13, 0], radius: 6, use: (g, { item }) => { log.push(`shed:${item}`); } },
        { id: "buoy", label: "Buoy", at: [0, 50, 0], when: (g) => g.has("fuse") },
      ],
    }],
    ...extra,
  });
  return { game, log };
}

test("game: a hotspot is a rectangle or a place — and says so when it is neither", () => {
  const { game } = island();
  const [cairn, shed] = game.scenes[0].hotspots;
  assertEqual(cairn.radius, 4, "the default radius is the spec's reach");
  assertEqual(shed.radius, 6);
  assert(throws(() => createGame({ scenes: [{ id: "a", hotspots: [{ id: "x", at: [1] }] }] })).includes("two or three numbers"));
  assert(throws(() => createGame({ scenes: [{ id: "a", hotspots: [{ id: "x", at: [1, "2"] }] }] })).includes("two or three numbers"));
});

test("game: near() finds the closest place within its own radius, and skips hidden ones", () => {
  const { game } = island();
  assertEqual(game.near([0, 0]), null);
  assertEqual(game.near([8, 0]).id, "cairn", "2 from the cairn, 5 from the shed: both in reach, the cairn is nearer");
  assertEqual(game.near([5, 0]), null, "5 from the cairn (radius 4) and 8 from the shed (radius 6)");
  assertEqual(game.near([12, 0]).id, "shed");
  assertEqual(game.near([18, 0]).id, "shed", "only the shed reaches that far");
  assertEqual(game.near([0, 50, 0]), null, "the buoy's `when` fails");
  game.give("fuse");
  assertEqual(game.near([0, 52, 0]).id, "buoy");
  assertEqual(game.near([0, 52, 30]), null, "a three-number place measures height too");
});

test("game: aim() records the hotspot within reach, and use() without an id presses it", async () => {
  const { game, log } = island();
  let changes = 0;
  game.subscribe(() => { changes += 1; });
  await game.start();
  changes = 0;

  game.aim("cairn");
  game.aim("cairn");
  assertEqual(game.target, "cairn");
  assertEqual(changes, 1, "aiming at the same thing every frame must not notify every frame");
  game.give("fuse");
  game.select("fuse");
  assertEqual(await game.use(), true);
  assertEqual(log.join(), "cairn");

  game.aim("nowhere");
  assertEqual(game.target, null);
  assertEqual(await game.use(), false, "nothing within reach, nothing to press");
});

test("game: the renderer's state rides in the save, and reset() hands it a fresh start", async () => {
  const storage = memoryStorage();
  const first = island({ id: "t-world", storage }).game;
  let position = [1, 2];
  first.attachStage({ save: () => ({ position }), load: () => {} });
  await first.start();
  position = [40, -8];
  assertEqual(first.save(), true);
  assertEqual(JSON.parse(storage.getItem("fluxaway-game:t-world")).stage.position.join(), "40,-8");

  const talking = first.say("…");
  await flush();
  position = [99, 99];
  assertEqual(first.save(), false, "no save while a line is on screen");
  first.advance();
  await talking;

  const { game } = island({ id: "t-world", storage });
  const received = [];
  assertEqual(game.load(), true);
  // The world mounts after the load: it must still get its data.
  game.attachStage({ load: (data) => received.push(data), save: () => received[received.length - 1] });
  assertEqual(received.length, 1);
  assertEqual(received[0].position.join(), "99,99", "the save written when the line closed");

  game.reset();
  assertEqual(received[1], null, "null means: start over");
});

// ── Free-roaming worlds: shell ──────────────────────────────

function fakeWorld(record) {
  return ({ canvas, game, input }) => {
    record.created = (record.created || 0) + 1;
    record.canvas = canvas;
    record.input = input;
    record.game = game;
    record.position = [0, 0];
    return {
      update: (dt) => { record.updates = (record.updates || 0) + 1; record.dt = dt; },
      render: () => { record.renders = (record.renders || 0) + 1; },
      resize: (width, height, ratio) => { record.size = [width, height, ratio]; },
      position: () => record.position,
      focus: (target) => { record.focused = target; return Promise.resolve(true); },
      save: () => ({ position: record.position }),
      load: (data) => { record.loaded = data; },
      destroy: () => { record.destroyed = true; },
    };
  };
}

function mountWorld(game, record, props = {}) {
  const container = mountPoint();
  const controllerRef = { current: null };
  render(() => h(
    "div",
    { className: "m-game", style: STAGE_SIZE },
    h(GameViewport, { game, world: fakeWorld(record), controllerRef, ...props }),
    h(GamePrompt, { game }),
    h(GameDialogue, { game }),
  ), container);
  return { container, controllerRef };
}

test("GameViewport: builds the world once, sizes it, and runs it on the loop", async () => {
  const { game } = island();
  const record = {};
  const { container, controllerRef } = mountWorld(game, record);
  await flush();

  const canvas = container.querySelector("canvas.m-game-canvas");
  assertEqual(record.canvas, canvas);
  assertEqual(canvas.getAttribute("aria-label"), "Game world");
  assertEqual(canvas.getAttribute("role"), "application");
  assertEqual(`${record.size[0]}x${record.size[1]}`, "800x450");
  assertEqual(record.size[2], window.devicePixelRatio || 1);
  assertEqual(controllerRef.current.world.position().join(), "0,0");
  assertEqual(controllerRef.current.loop.running, true);

  controllerRef.current.loop.stop();
  record.updates = 0;
  assertEqual(controllerRef.current.loop.advance(0.05), 3);
  assertEqual(record.updates, 3);
  assert(Math.abs(record.dt - 1 / 60) < 1e-9);

  game.set("anything", 1);
  await flush();
  assertEqual(record.created, 1, "a re-render must not rebuild the world");
});

test("GameViewport + GamePrompt: walking into reach offers the hotspot; the use action presses it", async () => {
  const { game, log } = island();
  const record = {};
  const { container, controllerRef } = mountWorld(game, record);
  await game.start();
  await flush();
  const { loop } = controllerRef.current;
  loop.stop();

  loop.advance(0.02);
  await flush();
  assertEqual(game.target, null);
  assertEqual(container.querySelector(".m-game-prompt-button"), null);

  record.position = [9, 0];
  loop.advance(0.02);
  await flush();
  assertEqual(game.target, "cairn");
  const prompt = container.querySelector(".m-game-prompt-button");
  assertEqual(prompt.querySelector(".m-game-prompt-label").textContent, "Cairn");
  assertEqual(prompt.querySelector(".m-game-prompt-key").textContent, "E");
  assertEqual(prompt.querySelector(".m-game-prompt-key").getAttribute("aria-hidden"), "true");

  window.dispatchEvent(keyEvent("keydown", "KeyE"));
  window.dispatchEvent(keyEvent("keyup", "KeyE"));
  loop.advance(0.02);
  await flush();
  assertEqual(log.join(), "cairn", "E pressed the hotspot within reach");

  record.position = [16, 0];
  loop.advance(0.02);
  await flush();
  container.querySelector(".m-game-prompt-button").click();
  await flush();
  assertEqual(log.join(), "cairn,shed:null", "and so does the button, for a finger");
});

test("GameViewport: while the story talks the input is idle and the prompt steps aside", async () => {
  const { game } = island();
  const record = {};
  const { container, controllerRef } = mountWorld(game, record);
  await game.start();
  record.position = [9, 0];
  controllerRef.current.loop.stop();
  controllerRef.current.loop.advance(0.02);
  await flush();
  assert(container.querySelector(".m-game-prompt-button"));

  const talking = game.say("Wind, and nothing else.");
  await flush();
  await flush();
  assertEqual(record.input.enabled, false);
  assertEqual(container.querySelector(".m-game-prompt-button"), null);
  window.dispatchEvent(keyEvent("keydown", "KeyW"));
  assertEqual(record.input.held("forward"), false, "the player does not walk off mid-sentence");
  window.dispatchEvent(keyEvent("keyup", "KeyW"));

  container.querySelector(".m-game-continue").click();
  await talking;
  await flush();
  await flush();
  assertEqual(record.input.enabled, true);
  assertEqual(document.activeElement, record.canvas, "the keyboard goes back to the world");
});

test("GameViewport: focus(), the save and unmount all reach the world", async () => {
  const storage = memoryStorage();
  const { game } = island({ id: "t-view", storage });
  const record = {};
  const { container } = mountWorld(game, record);
  await game.start();
  await flush();

  assertEqual(await game.focus("shed"), true);
  assertEqual(record.focused.id, "shed");
  assertEqual(record.focused.at.join(), "13,0");
  assertEqual(record.focused.radius, 6);

  record.position = [5, 6];
  game.save();
  assertEqual(JSON.parse(storage.getItem("fluxaway-game:t-view")).stage.position.join(), "5,6");
  game.reset();
  assertEqual(record.loaded, null);

  render(() => h("p", null, "gone"), container);
  await flush();
  assertEqual(record.destroyed, true);
  window.dispatchEvent(keyEvent("keydown", "KeyW"));
  assertEqual(record.input.held("forward"), false, "its input stopped listening");
  window.dispatchEvent(keyEvent("keyup", "KeyW"));
});

test("GameViewport: a world that cannot start shows the message instead of a dead canvas", async () => {
  const { game } = island();
  const container = mountPoint();
  const original = console.error;
  console.error = () => {};
  try {
    render(() => h("div", { className: "m-game", style: STAGE_SIZE }, h(GameViewport, {
      game,
      world: () => { throw new Error("no WebGL"); },
      errorLabel: "Este mundo não pôde começar.",
    })), container);
    await flush();
    await flush();
  } finally {
    console.error = original;
  }
  const message = container.querySelector(".m-game-viewport-error");
  assertEqual(message.textContent, "Este mundo não pôde começar.");
  assertEqual(message.getAttribute("role"), "alert");
  assertEqual(getComputedStyle(container.querySelector("canvas")).visibility, "hidden");
});

test("GameStage: places are not drawn on a 2D stage", async () => {
  const { game } = island();
  const container = mountGame(game);
  await game.start();
  await flush();
  assertEqual(container.querySelectorAll(".m-game-hotspot").length, 0);
  assertEqual(await game.focus("cairn"), false, "and a 2D camera has nowhere to go for one");
});

test("GameStick: reports x right and y forward, clamped, and zero when let go", async () => {
  const container = mountPoint();
  const moves = [];
  render(() => h("div", { className: "m-game", style: STAGE_SIZE }, h(GameStick, { onMove: (x, y) => moves.push([x, y]) })), container);
  await flush();

  const stick = container.querySelector(".m-game-stick");
  assertEqual(stick.getAttribute("aria-hidden"), "true");
  const box = stick.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;

  pointerEvent("pointerdown", stick, { clientX: cx, clientY: cy - box.height / 4 });
  assertEqual(moves[0][0], 0);
  assert(Math.abs(moves[0][1] - 0.5) < 1e-6, `up on the screen is forward, got ${moves[0][1]}`);
  pointerEvent("pointermove", stick, { clientX: cx + box.width * 3, clientY: cy });
  assert(Math.abs(moves[1][0] - 1) < 1e-6, "past the rim is still 1");
  pointerEvent("pointerup", stick, { clientX: cx, clientY: cy });
  assertEqual(moves[2].join(), "0,0");
  pointerEvent("pointermove", stick, { clientX: cx + 20, clientY: cy });
  assertEqual(moves.length, 3, "a pointer that is not held moves nothing");
});

test("game: the free-roaming shell writes no word of its own that is not a prop", async () => {
  const { game } = island();
  const record = {};
  const container = mountPoint();
  render(() => h(
    "div",
    { className: "m-game", style: STAGE_SIZE },
    h(GameViewport, { game, world: fakeWorld(record), ariaLabel: "Ilha" }),
    h(GamePrompt, { game, keyLabel: "Espaço" }),
  ), container);
  await game.start();
  game.aim("cairn");
  await flush();
  assertEqual(container.querySelector("canvas").getAttribute("aria-label"), "Ilha");
  assertEqual(container.querySelector(".m-game-prompt-key").textContent, "Espaço");
  assert(!container.textContent.includes("could not start"));
});
