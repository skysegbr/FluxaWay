import { gardenFor, START } from "./data.js";
import { makeLandscape } from "./landscape.js";
import { freshPlayer, makeEnemies, stepWorld, walkable } from "./simulation.js";
import { createRenderer } from "./renderer.js";

export function createWorld({ canvas, game, input }) {
  const model = {
    garden: gardenFor(game.scene), player: freshPlayer(), enemies: [], landscape: null,
    elapsed: 0, clock: 0, comboTime: 0, shake: 0, particles: [], labels: [], dashRequested: false,
    burst(x, y, color, count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count;
        model.particles.push({ x, y, vx: Math.cos(angle) * 65, vy: Math.sin(angle) * 65 - 15,
          life: 0.6, total: 0.6, color, size: 2 + i % 3 });
      }
    },
    message(text, x, y) { model.labels.push({ text, x, y, life: 1.5 }); },
  };
  const renderer = createRenderer(canvas, model, game);
  function resetScene(scene) {
    model.garden = gardenFor(scene); model.landscape = makeLandscape(model.garden);
    model.enemies = makeEnemies(model.garden); model.player = freshPlayer();
    model.particles = []; model.labels = []; model.comboTime = 0; model.dashRequested = false;
  }
  resetScene(game.scene);
  let lit = game.state.lit.length;
  const unsubscribe = game.subscribe(() => {
    if (game.state.lit.length > lit) {
      model.garden.beacons.forEach(([x, y]) => model.burst(x, y - 40, "#ffe3a0", 24));
      model.message("A little more light. +300", model.player.x, model.player.y - 55);
    }
    lit = game.state.lit.length;
  });
  const live = () => game.started && !game.busy && !game.dialogue && !game.state.paused && game.state.status === "playing";
  return {
    update(dt) {
      if (game.state.paused) return;
      model.clock += dt; model.shake = Math.max(0, model.shake - dt);
      for (const particle of model.particles) {
        particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt;
      }
      model.particles = model.particles.filter((particle) => particle.life > 0);
      for (const label of model.labels) { label.y -= dt * 18; label.life -= dt; }
      model.labels = model.labels.filter((label) => label.life > 0);
      if (live()) stepWorld(model, game, input, dt);
      else { model.player.moving = false; model.dashRequested = false; }
    },
    render: renderer.render, resize: renderer.resize,
    position: () => live() ? [model.player.x, model.player.y] : [-10000, -10000],
    dash() { if (live()) model.dashRequested = true; },
    read: () => ({ elapsed: model.elapsed, cooldown: model.player.cooldown, comboTime: model.comboTime }),
    travel(_from, to) { resetScene(to); },
    save: () => ({ player: { ...model.player }, elapsed: model.elapsed, comboTime: model.comboTime,
      enemies: model.enemies.map((enemy) => ({ ...enemy })) }),
    load(data) {
      resetScene(game.scene);
      if (data?.player && walkable(data.player.x, data.player.y, model.garden)) {
        Object.assign(model.player, data.player, { dash: 0, shield: Math.max(1.5, data.player.shield || 0), moving: false });
      } else Object.assign(model.player, START);
      model.elapsed = Number.isFinite(data?.elapsed) ? Math.max(0, data.elapsed) : 0;
      model.comboTime = Number.isFinite(data?.comboTime) ? Math.max(0, data.comboTime) : 0;
      if (Array.isArray(data?.enemies)) data.enemies.forEach((enemy, i) => {
        if (model.enemies[i] && walkable(enemy.x, enemy.y, model.garden, 8)) Object.assign(model.enemies[i], enemy);
      });
    },
    destroy: unsubscribe,
  };
}
