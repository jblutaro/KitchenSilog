import { loadPixelFont } from './labels.js';

export class SpriteLoader {
  constructor() { this.sprites = new Map(); }
  async load() {
    const response = await fetch('/sprites/sprites.json');
    if (!response.ok) throw new Error('The supplied sprite manifest is missing.');
    this.manifest = await response.json();
    await Promise.all(this.manifest.map(async entry => {
      const image = await this.loadImage(`/sprites/${entry.file}`);
      if (image.naturalWidth !== entry.frameWidth * entry.frames || image.naturalHeight !== entry.frameHeight)
        throw new Error(`Sprite dimensions do not match: ${entry.file}`);
      this.sprites.set(entry.file.replace('.png', ''), { ...entry, image });
    }));
    this.kitchen = await this.loadImage('/art/kitchen-mockup.jpg');
    const decorResponse = await fetch('/sprites/decor/manifest.json');
    if (!decorResponse.ok) throw new Error('Decor manifest is missing.');
    const decor = await decorResponse.json();
    await Promise.all(decor.map(async entry => {
      const image = await this.loadImage(`/sprites/decor/${entry.file}`);
      this.sprites.set(`decor/${entry.file.replace('.png', '')}`, { ...entry, image });
    }));
    await loadPixelFont();
  }
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Missing supplied image: ${url}`)); img.src = url;
    });
  }
  draw(ctx, name, x, y, scale = 1, frame = 0) {
    const sprite = this.sprites.get(name);
    if (!sprite) throw new Error(`Missing supplied sprite: ${name}`);
    const index = Math.max(0, Math.min(sprite.frames - 1, Math.floor(frame)));
    // Snap destination origins to physical canvas pixels at both overlay scales.
    const sceneScale = ctx.getTransform().a || 1;
    ctx.drawImage(sprite.image, index * sprite.frameWidth, 0, sprite.frameWidth, sprite.frameHeight,
      Math.round(x * sceneScale) / sceneScale, Math.round(y * sceneScale) / sceneScale,
      sprite.frameWidth * scale, sprite.frameHeight * scale);
  }
  animated(ctx, name, x, y, scale, now, start = 0, once = false) {
    const sprite = this.sprites.get(name);
    const frame = Math.floor((now - start) / 1000 * sprite.fps);
    this.draw(ctx, name, x, y, scale, once ? Math.min(frame, sprite.frames - 1) : frame % sprite.frames);
  }
}

