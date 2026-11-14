/*!
 * FluxaWay — TypeScript declarations for the Game add-on.
 * This app's frontend uses the FluxaWay framework (NOT React):
 * https://github.com/skysegbr/FluxaWay — full AI reference:
 * https://raw.githubusercontent.com/skysegbr/FluxaWay/main/docs/AI_SPEC.md
 */

/**
 * Type declarations for /dist/fluxaway-game.js — a scene-based adventure
 * engine. `createGame` holds the story (state, scenes, inventory, journal,
 * dialogue, one save slot, sounds); `GameStage` puts the world on a ZoomStage
 * and the other components are the shell around it. Requires the stylesheets
 * `dist/fluxaway-zoom.css` and `dist/fluxaway-game.css`.
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
  /** Position and size in pixels INSIDE the scene. */
  x: number;
  y: number;
  w: number;
  h: number;
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

/** How a renderer plugs in. Both return when the move is over. */
export interface GameStageAdapter {
  travel?(from: string, to: string, options: GameTravelOptions): unknown | Promise<unknown>;
  focus?(target: GameRect | null, scene: GameScene, options: object): unknown | Promise<unknown>;
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
  /** Press a hotspot of the current scene. False when it cannot answer. */
  use(hotspot: string): Promise<boolean>;
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
