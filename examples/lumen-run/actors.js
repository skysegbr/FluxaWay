import { ellipse, line, glow, star } from "./paint.js";

export function drawLantern(ctx, x, y, lit, index, time) {
  if (lit) glow(ctx, x, y - 27, 150, "#f9ca653a");
  ellipse(ctx, x, y + 8, 39, 17, "#102e3099");
  ellipse(ctx, x, y + 3, 31, 16, "#526d65");
  ellipse(ctx, x, y, 31, 13, "#809180");
  ctx.strokeStyle = lit ? "#efcf8d" : "#a5b79e77"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y, 42, 22, 0, 0, Math.PI * 2); ctx.stroke();
  line(ctx, [[x, y - 4], [x, y - 34]], "#a9a785", 7);
  ctx.fillStyle = "#314d49"; ctx.fillRect(x - 15, y - 66, 30, 35);
  ctx.fillStyle = lit ? "#ffdc8e" : "#839585"; ctx.fillRect(x - 10, y - 61, 20, 25);
  line(ctx, [[x, y - 63], [x, y - 34]], "#596b52", 3);
  line(ctx, [[x - 17, y - 65], [x, y - 80], [x + 17, y - 65]], "#adc09c", 5);
  line(ctx, [[x - 18, y - 31], [x + 18, y - 31]], "#bac09a", 4);
  if (lit) { glow(ctx, x, y - 48, 45, "#ffe6a888"); star(ctx, x, y - 49, 9, "#fff6c8"); }
  else {
    ctx.fillStyle = "#d8dfbd"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText(`0${index + 1}`, x, y + 41);
    for (let i = 0; i < 3; i++) ellipse(ctx, x - 9 + i * 9, y - 95 + Math.sin(time * 1.5) * 2, 2, 2, "#e9c98288");
  }
}

export function drawCourier(ctx, player, time, bag) {
  const { x, y, dx, dy, dash, shield, moving } = player;
  const bob = moving ? Math.sin(time * 19) * 2.3 : Math.sin(time * 3) * 1.2;
  ellipse(ctx, x, y + 10, 19, 7, "#081f2799");
  if (shield > 0) glow(ctx, x, y - 8, 52, "#9ce1ca55");
  if (dash > 0) glow(ctx, x, y - 8, 65, "#ffd98c66");
  ctx.save(); ctx.translate(x, y + bob);
  // A little leaf cloak, amber scarf, oversized hood and two bright eyes.
  ctx.fillStyle = "#e0ae6c"; ctx.beginPath(); ctx.moveTo(-5, -14);
  ctx.quadraticCurveTo(-dx * 26 - 10, -dy * 15 - 11, -dx * 32 - 10, -dy * 13 - 3 + Math.sin(time * 9) * 3);
  ctx.lineTo(-3, -6); ctx.fill();
  line(ctx, [[-7, 5], [-9 - (moving ? Math.sin(time * 19) * 3 : 0), 11]], "#b8c6a0", 5);
  line(ctx, [[7, 5], [9 + (moving ? Math.sin(time * 19) * 3 : 0), 11]], "#b8c6a0", 5);
  ctx.fillStyle = "#5f9e8b"; ctx.beginPath(); ctx.moveTo(0, -21);
  ctx.quadraticCurveTo(-17, -9, -18, 6); ctx.quadraticCurveTo(0, 15, 18, 6);
  ctx.quadraticCurveTo(16, -10, 0, -21); ctx.fill();
  ellipse(ctx, 0, -21, 17, 16, "#d5debb");
  ctx.fillStyle = "#c2d3a6"; ctx.beginPath(); ctx.moveTo(-14, -28); ctx.lineTo(-13, -44); ctx.lineTo(-3, -33); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7, -32); ctx.lineTo(19, -42); ctx.lineTo(15, -23); ctx.fill();
  ellipse(ctx, dx * 3, -20 + dy * 2, 11.5, 9, "#253f42");
  ellipse(ctx, -4 + dx * 3, -21 + dy * 2, 1.6, 2.3, "#ffe7a5");
  ellipse(ctx, 5 + dx * 3, -21 + dy * 2, 1.6, 2.3, "#ffe7a5");
  line(ctx, [[-10, -7], [1, -4], [12, -8]], "#efb96e", 5);
  if (bag) {
    glow(ctx, 17, -4, 28, "#ffcf6560");
    ellipse(ctx, 17, -4, 6, 8, "#f4cf83");
    star(ctx, 17, -5, 5, "#fff4c4");
  }
  ctx.restore();
}

export function drawShadow(ctx, enemy, time) {
  const { x, y, stunned } = enemy;
  ellipse(ctx, x, y + 10, 23, 8, "#0a192a66");
  glow(ctx, x, y - 5, 46, stunned > 0 ? "#d2dfb533" : "#b19ac725");
  ctx.fillStyle = stunned > 0 ? "#677c86" : "#303447";
  ctx.beginPath(); ctx.moveTo(x - 20, y + 6);
  ctx.bezierCurveTo(x - 30, y - 35, x + 25, y - 35, x + 21, y + 6);
  for (let i = 4; i >= 0; i--) ctx.lineTo(x - 20 + i * 10, y + 5 + Math.sin(time * 5 + i) * 5);
  ctx.closePath(); ctx.fill();
  ellipse(ctx, x - 6, y - 9, 3, 3.5, stunned > 0 ? "#d7e9b3" : "#dda7cc");
  ellipse(ctx, x + 6, y - 9, 3, 3.5, stunned > 0 ? "#d7e9b3" : "#dda7cc");
  if (stunned > 0) for (let i = 0; i < 3; i++) {
    const angle = time * 4 + i * Math.PI * 2 / 3;
    star(ctx, x + Math.cos(angle) * 23, y - 32 + Math.sin(angle) * 5, 4, "#f5df9b");
  }
}
