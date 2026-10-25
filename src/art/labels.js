import { layout } from './layout.js';

const cache = new Map();
export async function loadPixelFont() {
  const face = await new FontFace('Silkscreen', 'url(/fonts/Silkscreen-Regular.ttf)').load();
  document.fonts.add(face);
}
// Rasterize text once at art resolution and threshold its alpha. The cached
// glyphs have only opaque palette pixels and are enlarged without smoothing.
function textBitmap(text, size) {
  const key = `${size}:${text}`;
  if (cache.has(key)) return cache.get(key);
  const probe = document.createElement('canvas'), ctx = probe.getContext('2d', { willReadFrequently: true });
  ctx.font = `${size}px Silkscreen`;
  probe.width = Math.ceil(ctx.measureText(text).width) + 2; probe.height = size * 2;
  ctx.font = `${size}px Silkscreen`; ctx.textBaseline = 'top'; ctx.fillText(text, 0, 0);
  const pixels = ctx.getImageData(0, 0, probe.width, probe.height);
  let top = probe.height, bottom = 0;
  for (let y = 0; y < probe.height; y++) for (let x = 0; x < probe.width; x++) {
    const i = (y * probe.width + x) * 4, opaque = pixels.data[i + 3] >= 80;
    pixels.data[i] = 74; pixels.data[i + 1] = 42; pixels.data[i + 2] = 14; pixels.data[i + 3] = opaque ? 255 : 0;
    if (opaque) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  ctx.putImageData(pixels, 0, 0);
  const bitmap = document.createElement('canvas'); bitmap.width = probe.width; bitmap.height = Math.max(1, bottom - top + 1);
  bitmap.getContext('2d').drawImage(probe, 0, top, probe.width, bitmap.height, 0, 0, probe.width, bitmap.height);
  cache.set(key, bitmap); return bitmap;
}
export function drawTag(ctx, text, centerX, top, { size = 8, hover = false, needed = false, bounds = null, above = false } = {}) {
  const limit = bounds ? bounds[0] - 6 : Infinity;
  const lines = []; let line = '';
  for (const word of text.toUpperCase().split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && textBitmap(next, size).width > limit) { lines.push(textBitmap(line, size)); line = word; }
    else line = next;
  }
  if (line) lines.push(textBitmap(line, size));
  const width = Math.max(...lines.map(bitmap => bitmap.width)) + 4;
  const height = lines.reduce((sum, bitmap) => sum + bitmap.height + 1, 3);
  let x = Math.round(centerX - width / 2), y = Math.round(above ? top - height - 2 : top);
  if (bounds) { x = Math.max(1, Math.min(bounds[0] - width - 1, x)); y = Math.max(1, y); }
  ctx.fillStyle = '#000'; ctx.fillRect(x, y, width, height);
  ctx.fillStyle = hover ? '#FFB671' : '#FEF0E0'; ctx.fillRect(x + 1, y + 1, width - 2, height - 2);
  let textY = y + 2;
  for (const bitmap of lines) { ctx.drawImage(bitmap, x + Math.round((width - bitmap.width) / 2), textY); textY += bitmap.height + 1; }
  if (needed) {
    ctx.fillStyle = '#4A2A0E'; ctx.fillRect(x + width - 3, y - 2, 1, 2); ctx.fillRect(x + width - 3, y + 1, 1, 1);
  }
  return [x, y, width, height];
}
export function drawHoverTag(r) {
  const { state, zones, ctx } = r;
  const target = zones.findLast(item => item.id === state.hover);
  if (!target) return;
  let [x, y, width] = target.rect;
  let text = target.label;
  if (target.payload?.kind === 'ingredient') {
    text = `PICK ${target.payload.type === 'egg' ? 'EGGS' : target.payload.type}`;
    [x, y] = layout.fridge.ingredients[target.payload.type]; width = 24;
  }
  if (state.view === 'kitchen' && target.id.startsWith('basket')) text = state.basket.map(item => item.type).join(' · ') || 'BASKET EMPTY';
  // Food tags stay small enough for the kitchen; shelf tags are readable at Z.
  drawTag(ctx, text, x + width / 2, y, { size: 8, above: true, bounds: state.view === 'kitchen' ? [100, 100] : [160, 100] });
}
