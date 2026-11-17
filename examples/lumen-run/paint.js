// Canvas primitives shared by the cached landscape and the live world.
export function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
export function line(ctx, points, color, width = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
export function glow(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color); gradient.addColorStop(1, "transparent");
  ellipse(ctx, x, y, radius, radius, gradient);
}
export function star(ctx, x, y, radius, color) {
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x, y - radius); ctx.quadraticCurveTo(x + 2, y - 2, x + radius * 0.7, y);
  ctx.quadraticCurveTo(x + 2, y + 2, x, y + radius);
  ctx.quadraticCurveTo(x - 2, y + 2, x - radius * 0.7, y);
  ctx.quadraticCurveTo(x - 2, y - 2, x, y - radius); ctx.fill();
}
export function random(seed = 71) {
  let value = seed;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}
export function island(ctx, offset = 0) {
  ctx.beginPath(); ctx.moveTo(180, 220 + offset);
  ctx.bezierCurveTo(255, 120 + offset, 465, 80 + offset, 600, 95 + offset);
  ctx.bezierCurveTo(765, 65 + offset, 960, 135 + offset, 1010, 230 + offset);
  ctx.bezierCurveTo(1080, 330 + offset, 1060, 540 + offset, 970, 620 + offset);
  ctx.bezierCurveTo(850, 730 + offset, 740, 750 + offset, 590, 735 + offset);
  ctx.bezierCurveTo(430, 765 + offset, 245, 660 + offset, 190, 580 + offset);
  ctx.bezierCurveTo(130, 490 + offset, 115, 325 + offset, 180, 220 + offset);
  ctx.closePath();
}
export function rock(ctx, x, y, radius) {
  ellipse(ctx, x, y + radius * 0.5, radius + 8, radius * 0.55, "#0e292c88");
  ctx.fillStyle = "#334e50"; ctx.beginPath();
  ctx.moveTo(x - radius, y + radius * 0.2); ctx.lineTo(x - radius * 0.7, y - radius * 0.65);
  ctx.lineTo(x + radius * 0.1, y - radius); ctx.lineTo(x + radius * 0.8, y - radius * 0.55);
  ctx.lineTo(x + radius, y + radius * 0.4); ctx.lineTo(x, y + radius * 0.65); ctx.closePath(); ctx.fill();
  line(ctx, [[x - radius * 0.65, y - radius * 0.55], [x, y - radius * 0.8], [x + radius * 0.6, y - radius * 0.5]], "#78928766", 3);
  ellipse(ctx, x - radius * 0.3, y - radius * 0.45, radius * 0.5, radius * 0.17, "#71916a");
}
