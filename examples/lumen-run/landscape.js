import { ellipse, line, island, random, rock } from "./paint.js";

function fern(ctx, x, y, size, color) {
  ctx.save(); ctx.translate(x, y);
  line(ctx, [[0, 0], [0, -size]], "#779b7377", 1.5);
  for (let i = 0; i < 4; i++) {
    const at = -size * i / 5;
    for (const side of [-1, 1]) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, at);
      ctx.quadraticCurveTo(side * size * 0.8, at - size * 0.12, side * size * 0.45, at - size * 0.48);
      ctx.quadraticCurveTo(side * size * 0.1, at - size * 0.45, 0, at); ctx.fill();
    }
  }
  ctx.restore();
}

function mushroom(ctx, x, y, size, color) {
  line(ctx, [[x, y], [x + 1, y - size * 0.65]], "#b7bd91", 3);
  ctx.fillStyle = color; ctx.beginPath();
  ctx.ellipse(x, y - size * 0.7, size * 0.65, size * 0.45, 0, Math.PI, Math.PI * 2); ctx.fill();
  ellipse(ctx, x - size * 0.2, y - size * 0.9, 2, 1.3, "#f4dfb4");
}

// Draw the expensive, static illustration once per chapter, not every frame.
export function makeLandscape(garden) {
  const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 850;
  const ctx = canvas.getContext("2d"); const rng = random(198 + garden.rocks.length);
  ellipse(ctx, 600, 460, 475, 330, "#061b2180");
  ctx.fillStyle = "#112e32"; island(ctx, 22); ctx.fill();
  ctx.strokeStyle = "#66847766"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = garden.ground; island(ctx); ctx.fill();
  ctx.strokeStyle = "#7b9a7066"; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); island(ctx); ctx.clip();
  const wash = ctx.createRadialGradient(590, 330, 20, 590, 330, 510);
  wash.addColorStop(0, "#71916a55"); wash.addColorStop(1, "#081f2d44");
  ctx.fillStyle = wash; ctx.fillRect(0, 0, 1200, 800);
  for (let i = 0; i < 2400; i++) {
    const x = rng() * 1200; const y = rng() * 800;
    ellipse(ctx, x, y, 1 + rng() * 2, 0.7, rng() > 0.5 ? "#c7dba310" : "#051d241a");
  }
  // Pebbled paths lead towards the three lanterns, so the world teaches its route.
  for (const [bx, by] of garden.beacons) {
    ctx.strokeStyle = "#b3b89112"; ctx.lineWidth = 43; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(600, 650); ctx.quadraticCurveTo(600, 400, bx, by); ctx.stroke();
    for (let t = 0.15; t < 1; t += 0.09) {
      const x = (1 - t) * (1 - t) * 600 + 2 * (1 - t) * t * 600 + t * t * bx;
      const y = (1 - t) * (1 - t) * 650 + 2 * (1 - t) * t * 400 + t * t * by;
      ellipse(ctx, x + (rng() - 0.5) * 20, y, 9 + rng() * 6, 4, "#c1c5a423");
    }
  }
  for (let i = 0; i < 140; i++) {
    const angle = rng() * Math.PI * 2; const radius = 0.85 + rng() * 0.14;
    const x = 600 + Math.cos(angle) * 430 * radius;
    const y = 410 + Math.sin(angle) * 305 * radius;
    fern(ctx, x, y, 12 + rng() * 20, rng() > 0.4 ? garden.grass : "#91a376");
    if (i % 5 === 0) mushroom(ctx, x + 12, y + 4, 12 + rng() * 6, garden.color);
  }
  for (const [x, y, r] of garden.rocks) {
    rock(ctx, x, y, r);
    fern(ctx, x + r * 0.7, y + r * 0.4, 24, garden.grass);
    mushroom(ctx, x - r, y + 9, 15, "#dbab7b");
  }
  // A little landing dock, a hand-painted sign, and an abandoned gardener's pot.
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? "#737b59" : "#626e53";
    ctx.fillRect(564, 691 + i * 12, 72, 9);
  }
  line(ctx, [[653, 680], [653, 636]], "#878565", 5);
  ctx.fillStyle = "#b6ae81"; ctx.fillRect(638, 627, 37, 19);
  ctx.fillStyle = "#3a5044"; ctx.font = "bold 13px serif"; ctx.fillText("↑", 651, 642);
  ellipse(ctx, 330, 615, 15, 11, "#a07f69");
  ellipse(ctx, 330, 608, 17, 7, "#c6a17b");
  ellipse(ctx, 330, 608, 12, 4, "#394c3c");
  fern(ctx, 330, 605, 23, "#93a976");
  ctx.restore();
  return canvas;
}
