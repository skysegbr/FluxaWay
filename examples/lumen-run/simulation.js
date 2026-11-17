import { START, capacity } from "./data.js";

export function freshPlayer() {
  return { ...START, dx: 0, dy: -1, dash: 0, cooldown: 0, shield: 1.5, moving: false };
}
export function makeEnemies(garden) {
  return garden.enemies.map(([x, y, speed], index) => ({ x, y, homeX: x, homeY: y, speed, phase: index * 2.1, stunned: 0 }));
}
export function walkable(x, y, garden, padding = 13) {
  if (((x - 600) / 425) ** 2 + ((y - 410) / 295) ** 2 > 1) return false;
  return !garden.rocks.some(([rx, ry, radius]) => Math.hypot(x - rx, y - ry) < radius + padding);
}
function move(entity, vx, vy, dt, garden, padding) {
  // Axis-separated collision lets a courier slide along rocks instead of sticking.
  if (walkable(entity.x + vx * dt, entity.y, garden, padding)) entity.x += vx * dt;
  if (walkable(entity.x, entity.y + vy * dt, garden, padding)) entity.y += vy * dt;
}

export function stepWorld(model, game, input, dt) {
  const p = model.player;
  p.cooldown = Math.max(0, p.cooldown - dt); p.shield = Math.max(0, p.shield - dt);
  model.elapsed += dt; model.comboTime = Math.max(0, model.comboTime - dt);
  if (model.comboTime === 0 && game.state.combo) game.set("combo", 0);
  const direction = input.vector("left", "right", "back", "forward");
  p.moving = Math.hypot(direction.x, direction.y) > 0.05;
  if (p.dash <= 0 && p.moving) { p.dx = direction.x; p.dy = -direction.y; }
  if ((input.pressed("dash") || model.dashRequested) && p.cooldown <= 0) {
    p.dash = 0.22; p.cooldown = game.state.upgrades.includes("wing") ? 0.85 : 1.45;
    game.sound("dash"); model.burst(p.x, p.y, "#e3d39a", 10);
  }
  model.dashRequested = false;
  const dashing = p.dash > 0;
  // Small substeps prevent the dash from tunnelling through a collision circle.
  for (let i = 0; i < 3; i++) move(p,
    dashing ? p.dx * 690 : direction.x * 210,
    dashing ? p.dy * 690 : -direction.y * 210, dt / 3, model.garden, 13);
  if (dashing) {
    p.dash -= dt;
    model.particles.push({ x: p.x, y: p.y - 8, vx: 0, vy: 0, life: 0.3, total: 0.3, color: "#eace8c", size: 10 });
  }
  for (const enemy of model.enemies) {
    enemy.stunned = Math.max(0, enemy.stunned - dt);
    if (enemy.stunned > 0) continue;
    let distance = Math.hypot(p.x - enemy.x, p.y - enemy.y);
    const hunting = distance < 225;
    const tx = hunting ? p.x : enemy.homeX + Math.cos(model.elapsed * 0.65 + enemy.phase) * 75;
    const ty = hunting ? p.y : enemy.homeY + Math.sin(model.elapsed * 0.65 + enemy.phase) * 65;
    const length = Math.hypot(tx - enemy.x, ty - enemy.y) || 1;
    const speed = enemy.speed * (game.state.relaxed ? 0.65 : 1);
    move(enemy, (tx - enemy.x) / length * speed, (ty - enemy.y) / length * speed, dt, model.garden, 8);
    distance = Math.hypot(p.x - enemy.x, p.y - enemy.y);
    if (distance < 48 && dashing) {
      enemy.stunned = 2.8; model.burst(enemy.x, enemy.y, "#c1e1b5", 14);
      model.message("Nice dash!", enemy.x, enemy.y - 40); game.sound("stun");
      game.set("score", game.state.score + 50);
    } else if (distance < 30 && p.shield <= 0 && !game.state.relaxed) {
      p.shield = 2.3; enemy.stunned = 1; model.shake = 0.22;
      model.burst(p.x, p.y, "#e9b2a4", 15); game.sound("bump");
      const health = game.state.health - 1;
      game.set({ health, combo: 0, status: health <= 0 ? "lost" : "playing" });
      if (health <= 0) return;
      model.message("Ouch! Dash through shadows.", p.x, p.y - 50);
    }
  }
  model.garden.lights.forEach(([x, y], index) => {
    const id = `${game.scene}:${index}`;
    if (game.state.collected.includes(id) || game.state.bag >= capacity(game)) return;
    if (Math.hypot(p.x - x, p.y - y) > 30) return;
    const combo = model.comboTime > 0 ? Math.min(5, game.state.combo + 1) : 1;
    model.comboTime = 5;
    model.burst(x, y, "#f7d78c", 12); game.sound("pick");
    model.message(`+${combo * 50}`, x, y - 24);
    game.set((state) => ({ collected: [...state.collected, id], bag: state.bag + 1,
      combo, bestCombo: Math.max(combo, state.bestCombo), score: state.score + combo * 50 }));
    if (game.state.bag === capacity(game)) model.message("Pockets full · find a lantern", p.x, p.y - 65);
  });
}
