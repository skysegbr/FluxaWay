/*!
 * FluxaWay — TypeScript declarations for the Game add-on.
 * This app's frontend uses the FluxaWay framework (NOT React):
 * https://github.com/skysegbr/FluxaWay — full AI reference:
 * https://raw.githubusercontent.com/skysegbr/FluxaWay/main/docs/AI_SPEC.md
 */

/**
 * Type declarations for /dist/fluxaway-game.js — a narrative game engine.
 * `createGame` holds the story (state, scenes, inventory, journal, dialogue,
 * one save slot, sounds). `GameStage` puts a 2D world on a ZoomStage;
 * `GameViewport` hosts a world the app draws itself, with `createLoop` and
 * `createInput` wired. The other components are the shell around either.
 * Requires `dist/fluxaway-game.css`, plus `dist/fluxaway-zoom.css` for
 * `GameStage`.
 */
import type { VNode } from "./fluxaway.js";
import type { TimelineController } from "./fluxaway-motion.js";
import type {
  ZoomCameraTarget,
  ZoomFrame,
  ZoomFrameState,
  ZoomShape,
  ZoomSurface,
  ZoomTransitionInput,
} from "./fluxaway-zoom.js";

export declare const GAME_HOTSPOT_KINDS: readonly ["use", "look", "talk", "take", "exit"];
export type GameHotspotKind = (typeof GAME_HOTSPOT_KINDS)[number];

/** Author variables. Must survive `JSON.stringify` — they are what a save holds. */
export type GameState = Record<string, unknown>;

/** A script: a plain (usually async) function the engine runs and waits for. */
export type GameScript<TContext = unknown, TResult = unknown> = (
  game: Game,
  context: TContext,
) => TResult | Promise<TResult>;

export interface GameTravelOptions {
  /** `false` cuts to the scene instead of flying. */
  animate?: boolean;
  /** Overrides the destination scene's and the stage's transition. */
  transition?: ZoomTransitionInput;
}

/** A rectangle in scene pixels, for `game.focus()`. */
export interface GameRect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Viewport margin fraction around the rect (0–0.45). */
  padding?: number;
  /** Extra zoom on top of the fit (default 1). */
  zoom?: number;
}

export interface GameHotspot {
  id: string;
  /** Accessible name, and the caption shown when pointed at. Defaults to `id`. */
  label?: string;
  /** Position and size in pixels INSIDE the scene — for `GameStage`. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /**
   * A place in a free-roaming world instead of a rectangle: two or three
   * numbers in that world's units. One of `at` or `x/y/w/h` is required.
   */
  at?: readonly number[];
  /** How close the player must be to an `at` hotspot (default `spec.reach`). */
  radius?: number;
  shape?: "rect" | "circle";
  /** Cursor and marker only. Defaults to `exit` with `to`, otherwise `use`. */
  kind?: GameHotspotKind;
  /** Return false to hide the hotspot. */
  when?: (game: Game) => boolean;
  /** Scene to travel to after `use` — unless `use` returned `false`. */
  to?: string;
  travel?: GameTravelOptions;
  use?: GameScript<{ item: string | null; hotspot: GameHotspot; scene: GameScene }, unknown>;
  /** Extra vdom inside the button (a sprite, a glow). */
  render?: (state: GameSceneState) => VNode;
  className?: string;
}

/** What a scene's `render` receives. */
export interface GameSceneState {
  game: Game;
  scene: GameScene;
  /** This is the game's current scene. */
  active: boolean;
  /** Active, started, and nothing in the way: hotspots answer. */
  live: boolean;
  visited: boolean;
  phase: ZoomFrameState["phase"];
  settled: boolean;
}

export interface GameScene {
  id: string;
  /** Announced to screen readers on arrival. Defaults to `id`. */
  label?: string;
  /** World pixels. Omitted: `spec.size`, lined up left to right `spec.gap` apart. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rotate?: number;
  camera?: ZoomCameraTarget;
  transition?: ZoomFrame["transition"];
  /** ZoomStage surface (default `none`: the art is the scene). */
  surface?: ZoomSurface;
  shape?: ZoomShape;
  className?: string;
  hotspots?: GameHotspot[];
  /** Runs on arrival, after the camera lands. `first` is true once per save. */
  enter?: GameScript<{ first: boolean; from: string | null }>;
  /** The art. Hand the state to a component when it needs hooks. */
  render?: (state: GameSceneState) => VNode;
  content?: VNode;
}

export interface GameItem {
  name?: string;
  description?: string;
  /** Text (an emoji, a glyph) or a function returning vdom. */
  icon?: string | (() => VNode);
}

export interface GameJournalEntry {
  title?: string;
  text?: string;
}

/** A sound is a URL, or a function that plays through the given output node. */
export type GameSound =
  | string
  | ((context: AudioContext, output: AudioNode, options: { volume?: number }) => void);

export interface GameSpec {
  /** Save slot name (`fluxaway-game:<id>` in localStorage). Omit: nothing is saved. */
  id?: string;
  /** Saves written by another version are discarded, or handed to `migrate`. */
  version?: number;
  migrate?: (saved: GameSave, fromVersion: number) => GameSave | null;
  /** A Storage-like object, or `false` to never save. Default: localStorage. */
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | false;
  /** Scene the game opens on (default: the first). */
  start?: string;
  /** Default scene size in world pixels (default 1600×900). */
  size?: { w?: number; h?: number };
  /** Space between auto-placed scenes (default 400). */
  gap?: number;
  /** Default `radius` of hotspots placed with `at` (default 3). */
  reach?: number;
  state?: GameState;
  scenes: GameScene[];
  items?: Record<string, GameItem>;
  journal?: Record<string, GameJournalEntry>;
  sounds?: Record<string, GameSound>;
  /** An AudioContext you already own; the game then never closes it. */
  audioContext?: AudioContext;
}

export interface GameSave {
  v: number;
  scene: string;
  state: GameState;
  inventory: string[];
  notes: string[];
  visited: string[];
  muted: boolean;
  /** Whatever the attached renderer's `save()` returned (player position…). */
  stage?: unknown;
}

export interface GameLineInput {
  speaker?: string;
  text: string;
}

export interface GameChoice {
  id: string;
  label?: string;
  when?: (game: Game) => boolean;
}

/** The line on screen. */
export interface GameDialogueLine {
  /** Changes with every line shown. */
  readonly key: number;
  readonly speaker: string;
  readonly text: string;
  readonly choices: readonly { readonly id: string; readonly label: string }[] | null;
  readonly index: number;
  readonly total: number;
}

/** A hotspot placed with `at`, as `focus()` hands it to a renderer. */
export interface GamePlace {
  id: string;
  at: readonly number[];
  radius: number;
}

/** How a renderer plugs in. `travel` and `focus` return when the move is over. */
export interface GameStageAdapter {
  travel?(from: string, to: string, options: GameTravelOptions): unknown | Promise<unknown>;
  focus?(target: GameRect | GamePlace | null, scene: GameScene, options: object): unknown | Promise<unknown>;
  /** JSON to keep in the save slot — where the player stands, for instance. */
  save?(): unknown;
  /** Given back on `load()`; `null` means a fresh game (`reset()`). */
  load?(data: unknown): void;
}

export interface GameEvents {
  scene: { from: string | null; to: string; first: boolean };
  item: { id: string; held: boolean };
  note: { id: string };
  line: GameDialogueLine;
}

export interface Game {
  readonly id: string | undefined;
  /** Scenes with their world position resolved. */
  readonly scenes: readonly Required<Pick<GameScene, "id" | "label" | "x" | "y" | "w" | "h">>[] & readonly GameScene[];
  readonly items: Record<string, GameItem>;
  readonly journal: Record<string, GameJournalEntry>;
  /** Current scene id. Changes at departure; `moving` is true until arrival. */
  readonly scene: string;
  readonly sceneData: GameScene;
  /** Author variables — read here, change with `set`. */
  readonly state: Readonly<GameState>;
  readonly inventory: readonly string[];
  /** Inventory item the next hotspot will receive, or null. */
  readonly selected: string | null;
  /** Hotspot within reach in a free-roaming world (set with `aim`), or null. */
  readonly target: string | null;
  /** Journal entries found, in the order they were found. */
  readonly notes: readonly string[];
  readonly visited: readonly string[];
  readonly dialogue: GameDialogueLine | null;
  /** A script is running: hotspots do not answer. */
  readonly busy: boolean;
  readonly moving: boolean;
  readonly started: boolean;
  readonly muted: boolean;
  /** Counts every change; two equal readings mean nothing changed in between. */
  readonly revision: number;
  readonly hasSave: boolean;

  get(key: string): unknown;
  set(patch: GameState | ((state: Readonly<GameState>) => GameState)): void;
  set(key: string, value: unknown): void;

  has(item: string): boolean;
  /** Add an item; false if already held. Throws on an unknown id. */
  give(item: string): boolean;
  take(item: string): boolean;
  select(item: string | null): void;

  noted(entry: string): boolean;
  /** Record a journal entry; false if already found. Throws on an unknown id. */
  note(entry: string): boolean;

  /** Show one or more lines; resolves when the last one is dismissed. */
  say(
    lines: string | GameLineInput | (string | GameLineInput | null | undefined)[],
    options?: { speaker?: string },
  ): Promise<void>;
  /** Show choices (after an optional prompt); resolves with the picked id, or null when none apply. */
  choose(
    prompt: string | GameLineInput | null,
    options: GameChoice[],
    extra?: { speaker?: string },
  ): Promise<string | null>;
  /** Next line (what the Continue button does). */
  advance(): void;
  /** Answer the choice on screen. */
  pick(id: string): void;
  wait(ms: number): Promise<void>;
  /** Play a fluxaway-motion timeline and wait for it. With `target`: gotoAndPlay. */
  play(timeline: TimelineController, target?: number | string): Promise<boolean>;
  /** Run a script under the busy lock; a throw is logged, not propagated. */
  run<T>(script: GameScript<unknown, T>, context?: unknown): Promise<T | undefined>;

  /** Travel to a scene; resolves after its `enter` script. False if already there. */
  goTo(scene: string, options?: GameTravelOptions): Promise<boolean>;
  /** Press a hotspot of the current scene (default: the one within reach). False when it cannot answer. */
  use(hotspot?: string | null): Promise<boolean>;
  /** The nearest visible `at` hotspot within its radius of `point`, or null. */
  near(point: readonly number[], scene?: string): GameHotspot | null;
  /** Record which hotspot is within reach; `GamePrompt` shows it. */
  aim(hotspot: string | null): void;
  /** Close-up on a hotspot id or a scene rect; null returns to the whole scene. */
  focus(target: string | GameRect | null, options?: GameTravelOptions & { duration?: number | "auto" }): Promise<boolean>;
  /** Hotspots of a scene (default: the current one) whose `when` passes. */
  hotspots(scene?: string): GameHotspot[];

  /** Play a sound. False when muted, unknown to the browser, or not unlocked yet. */
  sound(id: string, options?: { volume?: number }): boolean;
  /** Mute or unmute; no argument toggles. */
  mute(flag?: boolean): void;

  /** Begin: runs the current scene's `enter`. Call from a user gesture. */
  start(): Promise<boolean>;
  /** Write the slot now. False without an `id`, or while the story is not at rest. */
  save(): boolean;
  /** Restore the save slot. Call before `start()` to continue a game. */
  load(): boolean;
  /** Erase the save slot and go back to a fresh, not-started game. */
  reset(): void;

  attachStage(adapter: GameStageAdapter | null): () => void;
  subscribe(listener: (game: Game) => void): () => void;
  on<K extends keyof GameEvents>(type: K, handler: (detail: GameEvents[K], game: Game) => void): () => void;
  destroy(): void;
}

/** Imperative, framework-free constructor. You own the lifecycle. */
export declare function createGame(spec: GameSpec): Game;

/**
 * `useGame(spec)` creates the game on first render (the spec is captured
 * then), re-renders on every change and destroys it on unmount.
 * `useGame(game)` subscribes to an existing game and leaves its lifecycle alone.
 * Neither starts the game: call `game.start()`.
 */
export declare function useGame(source: GameSpec | Game): Game;

export interface GameStageProps {
  game: Game;
  /** Mark every hotspot — touch has no hover to find them (default false). */
  hints?: boolean;
  /** Camera move between scenes (default `glide`); a scene's own wins. */
  transition?: ZoomFrame["transition"];
  duration?: number | "auto";
  easing?: (t: number) => number;
  /** Viewport margin fraction around a scene (default 0). */
  padding?: number;
  /** Accessible name of the stage (default "Game"). */
  ariaLabel?: string;
  className?: string;
  style?: string | Record<string, string | number>;
}

/**
 * The world on screen. Takes no children: GameDialogue and any HUD are its
 * siblings inside one `.m-game` wrapper.
 */
export declare function GameStage(props: GameStageProps): VNode;

export interface GameDialogueProps {
  game: Game;
  /** Text of the button that moves to the next line (default "Continue"). */
  continueLabel?: string;
  ariaLabel?: string;
  className?: string;
}

export declare function GameDialogue(props: GameDialogueProps): VNode;

export interface GameInventoryProps {
  game: Game;
  ariaLabel?: string;
  /** Shown while nothing is held (default "Nothing yet"). */
  emptyLabel?: string;
  className?: string;
}

export declare function GameInventory(props: GameInventoryProps): VNode;

export interface GameJournalProps {
  game: Game;
  ariaLabel?: string;
  /** Shown while nothing was found (default "No notes yet"). */
  emptyLabel?: string;
  /** Progress line (default `"2 of 7"`). */
  countLabel?: (found: number, total: number) => string;
  className?: string;
}

export declare function GameJournal(props: GameJournalProps): VNode;

/** A fixed-step simulation loop. All times are in seconds. */
export interface GameLoop {
  readonly running: boolean;
  /** Simulated seconds so far. */
  readonly time: number;
  /** Length of one update: `1 / rate`. */
  readonly step: number;
  start(): void;
  stop(): void;
  /** Feed elapsed time by hand; returns how many updates ran. */
  advance(seconds: number): number;
}

export interface GameLoopOptions {
  /** Called at a fixed rate with `dt = 1 / rate`. */
  update?: (dt: number, time: number) => void;
  /** Called once per frame; `alpha` (0–1) is the position between two updates. */
  render?: (alpha: number, time: number) => void;
  /** Updates per second (default 60). */
  rate?: number;
  /** Most seconds simulated per frame (default 0.25). */
  maxFrame?: number;
}

export declare function createLoop(options?: GameLoopOptions): GameLoop;

/** Action name → `KeyboardEvent.code` values. */
export type GameActions = Record<string, readonly string[]>;

export interface GameInput {
  readonly enabled: boolean;
  /** The pointer is captured by the target (`pointerLock`). */
  readonly locked: boolean;
  readonly stick: { x: number; y: number };
  held(action: string): boolean;
  /** True once per press; auto-repeat does not count. */
  pressed(action: string): boolean;
  axis(negative: string, positive: string): -1 | 0 | 1;
  /** Keys plus the analog stick, never longer than 1. `y` is forward. */
  vector(left: string, right: string, back: string, forward: string): { x: number; y: number };
  /** Pixels the view was dragged since the last call. */
  look(): { x: number; y: number };
  setStick(x: number, y: number): void;
  /** `false`: everything reads as idle. */
  enable(flag?: boolean): void;
  unlock(): void;
  destroy(): void;
}

export declare function createInput(
  target: Element | null,
  options?: { actions?: GameActions; pointerLock?: boolean },
): GameInput;

export declare const GAME_ACTIONS: Readonly<{
  forward: readonly string[];
  back: readonly string[];
  left: readonly string[];
  right: readonly string[];
  turnLeft: readonly string[];
  turnRight: readonly string[];
  run: readonly string[];
  use: readonly string[];
}>;

/** What a world factory returns. Every member is optional. */
export interface GameWorld {
  update?(dt: number, time: number): void;
  render?(alpha: number, time: number): void;
  /** CSS pixels and the device pixel ratio. */
  resize?(width: number, height: number, pixelRatio: number): void;
  /** Where the player is, in the components `at` hotspots use. Enables reach and "use". */
  position?(): readonly number[];
  travel?: GameStageAdapter["travel"];
  focus?: GameStageAdapter["focus"];
  save?(): unknown;
  load?(data: unknown): void;
  destroy?(): void;
}

export type GameWorldFactory = (context: {
  canvas: HTMLCanvasElement;
  game: Game;
  input: GameInput;
}) => GameWorld | void;

export interface GameViewportProps {
  game: Game;
  /** Builds the renderer. Runs once, on mount; a throw shows `errorLabel`. */
  world: GameWorldFactory;
  actions?: GameActions;
  /** Capture the mouse on click (default false: drag to look). */
  pointerLock?: boolean;
  /** Updates per second (default 60). */
  rate?: number;
  /** Set to `{ input, loop, world }` once mounted. */
  controllerRef?: { current: { input: GameInput; loop: GameLoop; world: GameWorld } | null };
  /** Accessible name of the canvas (default "Game world"). */
  ariaLabel?: string;
  /** Shown when the world cannot start (default "This world could not start in your browser."). */
  errorLabel?: string;
  className?: string;
  style?: string | Record<string, string | number>;
}

/** A canvas for a world the app draws itself, with loop, input and story wired. */
export declare function GameViewport(props: GameViewportProps): VNode;

export interface GamePromptProps {
  game: Game;
  /** Key shown next to the hotspot's name (default "E"; "" hides it). */
  keyLabel?: string;
  className?: string;
}

/** The hotspot within reach, as a button. */
export declare function GamePrompt(props: GamePromptProps): VNode;

export interface GameStickProps {
  /** `x` right, `y` forward, each -1 to 1; (0, 0) when released. */
  onMove?: (x: number, y: number) => void;
  className?: string;
}

/** An on-screen stick for touch. Hidden from assistive technology. */
export declare function GameStick(props: GameStickProps): VNode;
