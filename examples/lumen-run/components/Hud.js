import { h, useEffect, useState } from "/dist/fluxaway.js";
import { useGame } from "/dist/fluxaway-game.js";
import { GARDENS, capacity, gardenFor, litCount, clockLabel } from "../data.js";

export function Hud({ game: source, viewRef, onPause }) {
  const game = useGame(source);
  const [telemetry, setTelemetry] = useState({ elapsed: 0, cooldown: 0, comboTime: 0 });
  useEffect(() => {
    const timer = setInterval(() => {
      const snapshot = viewRef.current?.world.read();
      if (snapshot) setTelemetry(snapshot);
    }, 100);
    return () => clearInterval(timer);
  }, []);
  const garden = gardenFor(game.scene);
  const chapter = GARDENS.indexOf(garden);
  const filled = game.state.bag;
  const max = capacity(game);
  const hearts = game.state.upgrades.includes("heart") ? 4 : 3;
  const dash = telemetry.cooldown <= 0;
  return h("div", { className: "lr-hud" },
    h("div", { className: "lr-hud-top" },
      h("div", { className: "lr-chapter" },
        h("p", { className: "lr-eyebrow" }, `GARDEN 0${chapter + 1} / 03`),
        h("h1", null, garden.name),
        h("div", { className: "lr-lantern-count", ariaLabel: `${litCount(game)} of 3 lanterns lit` },
          [0, 1, 2].map((i) => h("span", { key: i, className: i < litCount(game) ? "is-lit" : "", ariaHidden: "true" }, "✧")),
          h("span", null, `${litCount(game)} / 3 awake`)),
      ),
      h("div", { className: "lr-run-stats" },
        h("div", { className: "lr-score" }, h("span", { className: "lr-eyebrow" }, "STARLIGHT"), h("strong", null, String(game.state.score).padStart(5, "0"))),
        h("button", { className: "lr-icon-button", onClick: onPause, ariaLabel: "Pause game", title: "Pause · Esc" }, "Ⅱ")),
    ),
    h("div", { className: "lr-hud-bottom" },
      h("div", { className: "lr-pocket-panel" },
        h("div", { className: "lr-hearts", ariaLabel: game.state.relaxed ? "Gentle journey: no damage" : `${game.state.health} of ${hearts} hearts` },
          game.state.relaxed ? h("span", null, "∞", h("small", null, " GENTLE JOURNEY")) :
            Array.from({ length: hearts }, (_, i) => h("span", { key: i, className: i < game.state.health ? "" : "is-empty", ariaHidden: "true" }, "♥"))),
        h("div", { className: "lr-pockets", ariaLabel: `${filled} of ${max} lights carried` },
          Array.from({ length: max }, (_, i) => h("span", { key: i, className: i < filled ? "is-full" : "", ariaHidden: "true" }, "✦")),
          h("strong", null, `${filled}/${max}`)),
        h("p", { className: "lr-objective", ariaLive: "polite" }, filled >= 3 ? "Follow the arrow. Kindle a lantern with E." : "Gather 3 lights to wake a lantern."),
      ),
      h("div", { className: "lr-dash-status" },
        game.state.combo > 1 ? h("span", { className: "lr-combo" }, `×${game.state.combo} light streak`) : null,
        h("span", { className: "lr-dash-label" }, h("kbd", null, "SPACE"), dash ? "Dash ready" : "Recharging…"),
        h("progress", { max: game.state.upgrades.includes("wing") ? 0.85 : 1.45,
          value: (game.state.upgrades.includes("wing") ? 0.85 : 1.45) - telemetry.cooldown, ariaLabel: "Dash charge" }),
        h("span", { className: "lr-timer" }, clockLabel(telemetry.elapsed))),
    ),
  );
}
