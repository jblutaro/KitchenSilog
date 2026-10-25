import { layout } from './layout.js';

function light(ctx, x, y) {
  ctx.fillStyle = 'rgba(255, 220, 160, 0.12)';
  for (let row = 0; row < 14; row++) {
    const half = 2 + Math.floor(row / 2);
    ctx.fillRect(x + 4 - half, y + 14 + row, half * 2, 1);
  }
}
export class RoomRenderer {
  constructor(canvas, stage, art) { this.canvas = canvas; this.stage = stage; this.art = art; }
  draw(state, scale, scene) {
    const width = this.stage.clientWidth, height = this.stage.clientHeight;
    const frame = Math.floor(state.now / 1000) % 2;
    const key = `${width}:${height}:${scale}:${state.view}:${frame}`;
    if (key === this.key) return;
    this.key = key;
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    const ctx = this.canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const ox = Math.round((width - scene.width) / 2), oy = Math.round((height - scene.height) / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#FFCD9E'; ctx.fillRect(0, 0, width, height);
    const [tx, ty, tw, th] = layout.room.tile;
    if (this.tileScale !== scale) {
      const tile = document.createElement('canvas'); tile.width = tw * scale; tile.height = th * scale;
      const tc = tile.getContext('2d'); tc.imageSmoothingEnabled = false;
      tc.drawImage(this.art.kitchen, tx * 8, ty * 8, tw * 8, th * 8, 0, 0, tile.width, tile.height);
      this.tile = tile; this.tileScale = scale;
    }
    const pattern = ctx.createPattern(this.tile, 'repeat');
    pattern.setTransform(new DOMMatrix().translate(ox + tx * scale, oy + ty * scale));
    const floor = oy + layout.room.floorStart * scale;
    ctx.fillStyle = pattern; ctx.fillRect(0, floor, width, height - floor);
    ctx.fillStyle = '#000'; ctx.fillRect(0, oy + layout.room.baseboard[0] * scale, width, layout.room.baseboard[1] * scale);
    ctx.fillStyle = '#8B5018'; ctx.fillRect(0, 0, width, layout.room.trim[0] * scale);
    ctx.fillStyle = '#4A2A0E'; ctx.fillRect(0, layout.room.trim[0] * scale, width, layout.room.trim[1] * scale);
    const visible = [];
    if (state.view === 'kitchen') {
      ctx.setTransform(scale, 0, 0, scale, ox, oy);
      for (const decor of layout.room.decor) {
        const sprite = this.art.sprites.get(`decor/${decor.name}`);
        const x = decor.edge === 'right' ? 100 + decor.x : decor.x;
        const y = decor.ceiling ? -oy / scale + decor.y : decor.y;
        const fits = ox + x * scale >= 4 && ox + (x + sprite.frameWidth) * scale <= width - 4
          && oy + y * scale >= 0 && oy + (y + sprite.frameHeight) * scale <= height;
        // The center pendant spans the square's top edge: its upper cord is
        // visible here, while the kitchen canvas paints the lower portion.
        if (!fits || (decor.edge === 'inside' && decor.name !== 'pendant-lamp')) continue;
        if (decor.name === 'pendant-lamp') light(ctx, x, y);
        this.art.draw(ctx, `decor/${decor.name}`, x, y, 1, frame % sprite.frames); visible.push(decor.name);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (state.view === 'fridge') { ctx.fillStyle = '#4A2A0E'; ctx.fillRect(ox, oy + scene.height, scene.width, scale * 2); }
    this.canvas.dataset.decor = visible.join(',');
  }
}
export function drawKitchenDecor(r) {
  const { ctx, art, state } = r, stage = document.querySelector('.stage');
  const scale = ctx.getTransform().a;
  const ceiling = -(stage.clientHeight - 100 * scale) / 2 / scale;
  ctx.fillStyle = '#8B5018'; ctx.fillRect(0, ceiling, 100, 2);
  ctx.fillStyle = '#4A2A0E'; ctx.fillRect(0, ceiling + 2, 100, 1);
  for (const decor of layout.room.decor.filter(item => item.edge === 'inside')) {
    const y = decor.ceiling ? ceiling + decor.y : decor.y;
    if (decor.name === 'pendant-lamp') light(ctx, decor.x, y);
    const sprite = art.sprites.get(`decor/${decor.name}`);
    art.draw(ctx, `decor/${decor.name}`, decor.x, y, 1, Math.floor(state.now / 1000) % sprite.frames);
  }
}
