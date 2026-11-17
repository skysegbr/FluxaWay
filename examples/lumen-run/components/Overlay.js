import { h, useEffect, useRef } from "/dist/fluxaway.js";
import { useTimeline } from "/dist/fluxaway-motion.js";
import { clockLabel } from "../data.js";

export function Overlay({ kind, game, elapsed, onResume, onRestart, onCancel, onMute }) {
  const root = useRef(null);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = useTimeline({ duration: reduced ? 0 : 350, tracks: {
    card: [{ at: 0, opacity: 0, y: 14 }, { at: reduced ? 0 : 350, opacity: 1, y: 0, ease: "outCubic" }],
  } });
  useEffect(() => {
    const previous = document.activeElement;
    root.current?.querySelector("button")?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  const won = kind === "won", lost = kind === "lost", restart = kind === "restart";
  const heading = restart ? "A fresh beginning?" : won ? "You brought back the light." : lost ? "Even little lights need a rest." : "Take a little breather.";
  const description = restart ? "Your saved journey will be replaced. The gardens will be waiting for a new courier." :
    won ? "Nine lanterns are glowing. Three gardens are dreaming again. All because you carried a little light." :
    lost ? "The shadows caught up this time. Try dashing through them, or choose a gentle journey on the title screen." :
    "Your journey is saved on this device when storage is available. Stay here a while; the night can wait.";
  return h("section", { className: "lr-overlay", role: "dialog", ariaModal: "true", ariaLabelledby: "lr-overlay-title", ref: root,
    onKeyDown: (event) => {
      if (event.key !== "Tab") return;
      const buttons = [...root.current.querySelectorAll("button")];
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    },
  }, h("div", { className: "lr-overlay-card", ref: motion.track("card") },
    h("span", { className: "lr-overlay-star", ariaHidden: "true" }, won ? "✺" : "✧"),
    h("p", { className: "lr-eyebrow" }, restart ? "NEW JOURNEY" : won ? "THE NIGHT IS YOURS" : lost ? "UNTIL THE NEXT ADVENTURE" : "PAUSED"),
    h("h2", { id: "lr-overlay-title" }, heading), h("p", { className: "lr-overlay-description" }, description),
    won || lost ? h("div", { className: "lr-results" },
      [["Starlight", game.state.score.toLocaleString("en")], ["Best streak", `×${game.state.bestCombo}`], ["Journey", clockLabel(elapsed)]].map(([label, value]) =>
        h("div", { key: label }, h("strong", null, value), h("span", null, label))),
    ) : null,
    !won && !lost && !restart ? h("div", { className: "lr-instructions" },
      h("p", null, h("kbd", null, "WASD / ↑↓←→"), " Move"),
      h("p", null, h("kbd", null, "SPACE / SHIFT"), " Dash through shadows"),
      h("p", null, h("kbd", null, "E / ENTER"), " Give 3 lights to a lantern"),
      h("p", null, "Collect quickly for a ×5 streak. Lit lanterns mark your progress."),
    ) : null,
    h("div", { className: "lr-overlay-actions" },
      h("button", { className: "lr-button lr-primary", onClick: restart || won || lost ? onRestart : onResume }, restart ? "Start fresh" : won || lost ? "Back to the gardens" : "Keep going →"),
      restart ? h("button", { className: "lr-button lr-secondary", onClick: onCancel }, "Keep my journey") : null,
      !won && !lost && !restart ? h("button", { className: "lr-button lr-secondary", onClick: onMute }, game.muted ? "Turn sound on" : "Turn sound off") : null,
    ),
  ));
}
