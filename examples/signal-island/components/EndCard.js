import { h, useEffect } from "/dist/fluxaway.js";
import { useTimeline } from "/dist/fluxaway-motion.js";
import { cutscenes } from "../cutscenes.js";

// The moment the signal goes out: a card that rises, holds and leaves — and
// that the story waits for with `await game.play(cutscenes.end, 0)`. Every
// track ends where it started, so a second playthrough starts clean.
const CARD = {
  autoplay: false,
  duration: 5200,
  tracks: {
    veil: [
      { at: 0, opacity: 0 },
      { at: 900, opacity: 1, ease: "outCubic" },
      { at: 4200, opacity: 1 },
      { at: 5200, opacity: 0, ease: "inCubic" },
    ],
    title: [
      { at: 300, opacity: 0, y: 26 },
      { at: 1300, opacity: 1, y: 0, ease: "outCubic" },
      { at: 4200, opacity: 1, y: 0 },
      { at: 5000, opacity: 0, y: 0 },
    ],
    line: [
      { at: 1100, opacity: 0 },
      { at: 2100, opacity: 1, ease: "outCubic" },
      { at: 4200, opacity: 1 },
      { at: 5000, opacity: 0 },
    ],
  },
};

export function EndCard() {
  const card = useTimeline(CARD);

  useEffect(() => {
    cutscenes.end = card;
    return () => {
      if (cutscenes.end === card) delete cutscenes.end;
    };
  }, []);

  // The story's lines say the same thing in words; this is the picture of it.
  return h(
    "div",
    { className: "si-end", ariaHidden: "true", ref: card.track("veil") },
    h("p", { className: "si-end-title", ref: card.track("title") }, "Signal sent"),
    h("p", { className: "si-end-line", ref: card.track("line") }, "Station Nine is on the air again."),
  );
}
