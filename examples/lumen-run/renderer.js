import { SIZE, beaconKey } from "./data.js";
import { ellipse, glow, star } from "./paint.js";
import { drawCourier, drawShadow, drawLantern } from "./actors.js";

export function createRenderer(canvas, model, game) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable.");
  let width = 1, height = 1, dpr = 1;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastScene = null;
  let camera = { x: 600, y: 410 };

  function render() {
    const { player, garden, clock } = model;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, width, height);
    sky.addColorStop(0, "#122f32"); sky.addColorStop(0.5, "#112d33"); sky.addColorStop(1, "#071f29");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    const title = !game.started;
    const mobile = width < 650;
    const scale = title ? Math.min(height / 790, width / (mobile ? 760 : 1050))
      : mobile ? Math.max(0.7, Math.min(0.95, height / 720)) : Math.min(width / SIZE.w, height / 860);
    const target = mobile && !title ? { x: player.x, y: player.y - 25 } : { x: 600, y: 410 };
    if (lastScene !== game.scene) { camera = { ...target }; lastScene = game.scene; }
    camera.x += (target.x - camera.x) * 0.12; camera.y += (target.y - camera.y) * 0.12;
    const shiftX = title && !mobile ? width * 0.72 : width / 2;
    const shiftY = title && mobile ? height * 0.69 : height * 0.52;
    ctx.save(); ctx.translate(shiftX, shiftY); ctx.scale(scale, scale); ctx.translate(-camera.x, -camera.y);
    if (model.shake > 0 && !reduced) ctx.translate(Math.sin(clock * 90) * 3, Math.cos(clock * 80) * 3);
    // Gentle ripples and scattered stars carry the world beyond the island.
    for (let i = 0; i < 45; i++) {
      const x = (i * 197 % 1700) - 250; const y = (i * 137 % 1050) - 100;
      ctx.strokeStyle = "#91c1ac0d"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y, 28 + Math.sin(clock * 0.4 + i) * 5, 5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.drawImage(model.landscape, 0, 0);
    for (let i = 0; i < 30; i++) {
      const x = 170 + i * 137 % 880; const y = 140 + i * 83 % 560;
      const pulse = 0.35 + (Math.sin(clock * 0.7 + i * 1.7) + 1) * 0.25;
      ctx.globalAlpha = pulse;
      ellipse(ctx, x + Math.sin(clock * 0.25 + i) * 8, y + Math.cos(clock * 0.4 + i) * 6, 1.5, 1.5, "#c5ddac");
    }
    ctx.globalAlpha = 1;
    garden.lights.forEach(([x, y], i) => {
      if (game.state.collected.includes(`${game.scene}:${i}`)) return;
      const bob = reduced ? 0 : Math.sin(clock * 2.5 + i) * 4;
      glow(ctx, x, y - 8, 33, "#f4cf8330");
      ellipse(ctx, x, y + 8, 7, 3, "#0b303c55");
      star(ctx, x, y - 9 + bob, 9, "#f6d98e");
      ellipse(ctx, x, y - 9 + bob, 2, 2, "#fff5cd");
    });
    const actors = garden.beacons.map(([x, y], i) => ({ y, draw: () => drawLantern(ctx, x, y, game.state.lit.includes(beaconKey(game.scene, i)), i, clock) }));
    model.enemies.forEach((enemy) => actors.push({ y: enemy.y, draw: () => drawShadow(ctx, enemy, clock) }));
    actors.push({ y: player.y, draw: () => drawCourier(ctx, player, clock, game.state.bag) });
    actors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw());
    if (game.started && game.state.bag >= 3) {
      const available = garden.beacons.filter((_, i) => !game.state.lit.includes(beaconKey(game.scene, i)));
      available.sort((a, b) => Math.hypot(a[0] - player.x, a[1] - player.y) - Math.hypot(b[0] - player.x, b[1] - player.y));
      if (available[0]) {
        const angle = Math.atan2(available[0][1] - player.y, available[0][0] - player.x);
        ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(angle);
        ctx.fillStyle = "#f5d693bb"; ctx.beginPath(); ctx.moveTo(39, 0); ctx.lineTo(31, -5); ctx.lineTo(31, 5); ctx.fill(); ctx.restore();
      }
    }
    for (const particle of model.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.total);
      ellipse(ctx, particle.x, particle.y, particle.size, particle.size, particle.color);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "center"; ctx.font = "600 13px system-ui";
    for (const label of model.labels) {
      ctx.globalAlpha = Math.min(1, label.life * 2);
      ctx.strokeStyle = "#173537"; ctx.lineWidth = 4; ctx.strokeText(label.text, label.x, label.y);
      ctx.fillStyle = "#fff0ba"; ctx.fillText(label.text, label.x, label.y);
    }
    ctx.globalAlpha = 1; ctx.restore();
    // A compact map keeps all destinations findable when the mobile camera follows.
    if (mobile && game.started) {
      const mx = width - 108, my = 115, s = 0.08;
      ctx.fillStyle = "#0b2428cc"; ctx.beginPath(); ctx.roundRect(mx - 8, my - 8, 108, 78, 12); ctx.fill();
      ctx.strokeStyle = "#a7c5a044"; ctx.beginPath(); ctx.ellipse(mx + 48, my + 33, 35, 24, 0, 0, Math.PI * 2); ctx.stroke();
      garden.beacons.forEach(([x, y], i) => star(ctx, mx + x * s, my + y * s, 4,
        game.state.lit.includes(beaconKey(game.scene, i)) ? "#f7cf79" : "#88a4a2"));
      ellipse(ctx, mx + player.x * s, my + player.y * s, 3, 3, "#fff6d6");
    }
  }
  return {
    render,
    resize(w, h, ratio) {
      width = w; height = h; dpr = Math.min(ratio, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    },
  };
}
