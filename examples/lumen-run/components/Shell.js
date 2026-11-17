import { h, useCallback, useEffect, useRef, useState } from "/dist/fluxaway.js";
import { GameDialogue, GamePrompt, GameStick, GameViewport, useGame } from "/dist/fluxaway-game.js";
import { ACTIONS } from "../data.js";
import { createWorld } from "../world.js";
import { Hud } from "./Hud.js";
import { Overlay } from "./Overlay.js";
import { TitleScreen } from "./TitleScreen.js";

export function Shell({ game: source }) {
  const game = useGame(source);
  const viewRef = useRef(null);
  const newMode = useRef(false);
  const [confirm, setConfirm] = useState(false);
  const confirmRef = useRef(false);
  confirmRef.current = confirm;
  const pause = useCallback(() => {
    if (game.started && !game.busy && game.state.status === "playing") game.set("paused", true);
  }, [game]);
  const resume = () => { game.set("paused", false); document.querySelector(".lr-game canvas")?.focus(); };
  useEffect(() => {
    const save = () => game.save();
    const timer = setInterval(save, 4000);
    const visibility = () => { if (document.hidden) pause(); };
    const key = (event) => {
      if (event.code !== "Escape" || confirmRef.current) return;
      if (game.state.paused) { game.set("paused", false); document.querySelector(".lr-game canvas")?.focus(); }
      else pause();
    };
    window.addEventListener("pagehide", save); window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility); window.addEventListener("keydown", key);
    return () => {
      clearInterval(timer); window.removeEventListener("pagehide", save); window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("keydown", key);
    };
  }, [pause]);
  useEffect(() => {
    viewRef.current?.input.enable(game.started && !game.busy && !game.dialogue && !game.state.paused && game.state.status === "playing");
  }, [game.started, game.busy, game.dialogue, game.state.paused, game.state.status]);
  const begin = (restore) => {
    if (restore) game.load();
    else { game.reset(); game.set("relaxed", newMode.current); }
    setConfirm(false); game.set("paused", false); game.start();
    document.querySelector(".lr-game canvas")?.focus();
  };
  const overlay = confirm ? "restart" : !game.started ? null : game.state.status !== "playing" ? game.state.status : game.state.paused ? "paused" : null;
  const controls = game.started && !overlay && !game.dialogue;
  return h("main", { className: "lr-shell" },
    h("header", { className: "lr-masthead" },
      h("a", { href: "./", className: "lr-brand", ariaLabel: "Lumen Run title screen" }, h("img", { src: "/examples/lumen-run/icon.svg", alt: "", width: 25, height: 25 }), "LUMEN RUN"),
      h("span", { className: "lr-masthead-note" }, "A LITTLE LIGHT. A GRAND ADVENTURE."),
      h("button", { className: "lr-sound", onClick: () => game.mute(), ariaLabel: game.muted ? "Turn sound on" : "Mute sound", ariaPressed: String(!game.muted), disabled: Boolean(overlay) }, game.muted ? "♪  Sound off" : "♪  Sound on")),
    h("div", { className: "m-game lr-game" },
      h(GameViewport, { game, world: createWorld, actions: ACTIONS, controllerRef: viewRef,
        ariaLabel: "Lumen Run garden. Move with WASD or arrows, dash with Space, kindle lanterns with E.",
        errorLabel: "This garden needs Canvas 2D. Please try a browser with canvas support." }),
      game.started ? h(Hud, { game, viewRef, onPause: pause }) : null,
      controls ? h(GamePrompt, { game, className: "lr-prompt" }) : null,
      controls ? h(GameStick, { className: "lr-stick", onMove: (x, y) => viewRef.current?.input.setStick(x, y) }) : null,
      controls ? h("button", { className: "lr-touch-dash", ariaLabel: "Dash", onClick: () => viewRef.current?.world.dash() }, "↗", h("small", null, "DASH")) : null,
      h(GameDialogue, { game, className: "lr-dialogue", continueLabel: "Got it →" }),
      !game.started && !confirm ? h(TitleScreen, { canContinue: game.hasSave,
        onNew: (relaxed) => { newMode.current = relaxed; if (game.hasSave) setConfirm(true); else begin(false); },
        onContinue: () => begin(true) }) : null,
      overlay ? h(Overlay, { key: overlay, kind: overlay, game, elapsed: viewRef.current?.world.read().elapsed || 0,
        onResume: resume, onCancel: () => setConfirm(false), onMute: () => game.mute(),
        onRestart: () => { if (confirm) begin(false); else { game.reset(); setConfirm(false); } },
      }) : null,
    ),
    h("footer", { className: "lr-footer" }, h("span", null, "MADE OF SMALL WONDERS"),
      h("span", { className: "lr-desktop-help" }, "WASD / Arrows to move", h("i", null, "·"), "Space to dash", h("i", null, "·"), "E to kindle", h("i", null, "·"), "Esc to pause"),
      h("span", { className: "lr-engine-credit" }, "Built with ", h("a", { href: "../../README.md" }, "FluxaWay"))),
  );
}
