import { COOK_STATES } from '../cooking.js';
import { isComplete } from '../stations/plate.js';
import { layout } from '../art/layout.js';

export function zone(r, id, rect, label, payload = null) {
  r.zones.push({ id, rect, label, payload });
}
export function drawBasket(r, config, zoom) {
  const { ctx, art, state } = r;
  const basketScale = zoom ? 2 : 1, scale = basketScale / 2, [bx, by] = config.basket;
  // Keep the supplied back rim behind the protruding tops; only the basket's
  // front occludes food. This is runtime clipping, not an edited sprite file.
  art.draw(ctx, 'basket', bx, by, basketScale);
  zone(r, 'basket', [bx, by, 16 * basketScale, 10 * basketScale], state.basket.map(item => item.type.toUpperCase()).join(' · ') || 'BASKET EMPTY');
  state.basket.forEach((item, index) => {
    const [dx, dy] = layout.basketSlots[index], x = bx + dx * basketScale, y = by + dy * basketScale;
    const selected = state.selected?.kind === 'basket' && state.selected.id === item.id;
    const landing = state.effects.find(effect => effect.kind === 'land' && effect.id === item.id);
    const age = landing ? state.now - landing.start : 1000;
    const drop = age < 140 ? -Math.ceil((1 - age / 140) * 5) : age < 200 ? -1 : 0;
    // A flying fridge ingredient is shown only once until it reaches the basket.
    const flying = state.view === 'fridge' && state.effects.some(effect => effect.kind === 'pick' && effect.id === item.id);
    if (!flying) art.draw(ctx, `ing-${item.type}`, x, y + drop * basketScale, scale, selected || state.hover === `basket-${item.id}` ? 1 : 0);
    zone(r, `basket-${item.id}`, [x, y, 6 * basketScale, 6 * basketScale], `${item.type.toUpperCase()} · BASKET`, { kind: 'basket', id: item.id });
  });
  ctx.save(); ctx.beginPath();
  ctx.rect(bx, by + layout.basketFrontY * basketScale, 16 * basketScale, (10 - layout.basketFrontY) * basketScale); ctx.clip();
  art.draw(ctx, 'basket', bx, by, basketScale); ctx.restore();
  if (state.debug) {
    ctx.lineWidth = 0.5; ctx.strokeStyle = '#FEF0E0'; ctx.strokeRect(bx, by, 16 * basketScale, 10 * basketScale);
    layout.basketSlots.forEach(([x, y]) => {
      ctx.strokeStyle = '#86B85E'; ctx.strokeRect(bx + x * basketScale, by + y * basketScale, 6 * basketScale, 6 * basketScale);
      console.assert(x >= 0 && x + 6 <= 16, 'Basket item exceeds the basket sides');
    });
  }
}
export function drawPlate(r, config, zoom) {
  const { ctx, art, state } = r;
  if (!state.plate) return;
  const scale = zoom ? 1 : 0.5, suffix = zoom ? '-zoom' : '';
  const [px, py] = config.plate;
  const shake = state.shakeUntil > state.now ? Math.round(Math.sin(state.now / 30)) : 0;
  ctx.save(); ctx.translate(shake, 0);
  art.draw(ctx, `plate${suffix}`, px, py, scale);
  zone(r, 'plate', config.plateZone, isComplete(state.plate) ? 'Plate ready — serve it' : 'Plate — needs rice, egg and meat', { kind: 'plate' });
  for (const slot of ['rice', 'meat', 'egg']) {
    const food = state.plate[slot]; if (!food) continue;
    const [x, y] = config.plated[slot];
    art.draw(ctx, `plated-${food.type}${suffix}`, px + x * scale, py + y * scale, scale, food.stage === 'overcooked' ? 1 : 0);
    const sprite = art.sprites.get(`plated-${food.type}${suffix}`);
    zone(r, `plated-${slot}`, [px + x * scale, py + y * scale, sprite.frameWidth * scale, sprite.frameHeight * scale], `${food.type.toUpperCase()} · ${food.stage.toUpperCase()}`, { kind: 'plated', slot });
  }
  if (isComplete(state.plate)) {
    ctx.strokeStyle = '#fbe8a6'; ctx.lineWidth = 0.5;
    ctx.strokeRect(config.plateZone[0], config.plateZone[1], config.plateZone[2], config.plateZone[3]);
  }
  ctx.restore();
  for (const effect of state.effects.filter(effect => effect.kind === 'sparkle'))
    art.animated(ctx, 'fx-sparkle', px + (zoom ? 14 : 3), py - 5, zoom ? 2 : 1, state.now, effect.start, true);
}
export function drawBurners(r, config, zoom) {
  const { ctx, art, state } = r;
  config.burners.forEach(([x, y], index) => {
    const slot = state.burners[index], target = `burner-${index}`;
    zone(r, target, config.burnerZones[index], slot ? `${slot.itemType.toUpperCase()} · ${slot.state.toUpperCase()}` : `BURNER ${index + 1} · EMPTY`, { kind: 'burner', index });
    if (!slot) return;
    ctx.save();
    if (state.effects.some(effect => effect.kind === 'land' && effect.index === index)) ctx.translate(0, -1);
    const active = ['raw', 'cooking', 'cooked'].includes(slot.state);
    if (active) art.animated(ctx, 'burner-flame', x - (zoom ? 12 : 3), y - (zoom ? 5 : 1.25), zoom ? 2 : 0.5, state.now);
    if (zoom) {
      const rice = slot.itemType === 'rice', [ox, oy] = rice ? config.wokOffset : config.panOffset;
      const [fx, fy] = rice ? config.foodWokOffset : config.foodPanOffset;
      art.draw(ctx, rice ? 'wok-zoom' : 'pan-zoom', x + ox, y + oy);
      art.draw(ctx, `cook-${slot.itemType}-zoom`, x + ox + fx, y + oy + fy, 1, COOK_STATES.indexOf(slot.state));
    } else art.draw(ctx, `cook-${slot.itemType}`, x - 3.5, y - 2, 0.5, COOK_STATES.indexOf(slot.state));
    const effect = slot.state === 'burnt' ? 'fx-smoke-heavy' : slot.state === 'overcooked' ? 'fx-smoke-light' : 'fx-steam';
    const ef = art.sprites.get(effect), es = zoom ? 1 : 0.5;
    art.animated(ctx, effect, x - ef.frameWidth * es / 2, y - (zoom ? 7 : 2) - ef.frameHeight * es, es, state.now);
    const [gx, gy] = zoom ? [x + config.gaugeOffset[0], y] : config.gauges[index], gs = zoom ? 2 : 0.5;
    drawGauge(r, slot, gx, gy, gs);
    if (slot.needsFlip) {
      const fs = zoom ? 2 : 0.5, fy = y - (zoom ? 14 : 7);
      art.animated(ctx, 'ui-flip', x - 4.5 * fs, fy - 4.5 * fs, fs, state.now);
      zone(r, `flip-${index}`, [x - 5 * fs, fy - 5 * fs, 10 * fs, 10 * fs], `Flip ${slot.itemType}!`, { kind: 'flip', index });
    }
    ctx.restore();
  });
}
function drawGauge(r, slot, x, y, scale) {
  const { ctx, art } = r, radius = 4 * scale;
  art.draw(ctx, 'ui-gauge', x - 6 * scale, y - 6 * scale, scale);
  ctx.save(); ctx.lineWidth = Math.max(0.5, scale);
  ctx.strokeStyle = '#6b4e34'; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#87b35e'; ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2 + slot.cookTime / slot.burnTime * Math.PI * 2,
    -Math.PI / 2 + slot.overcookTime / slot.burnTime * Math.PI * 2); ctx.stroke();
  const angle = -Math.PI / 2 + slot.progress / 100 * Math.PI * 2;
  ctx.strokeStyle = slot.state === 'overcooked' || slot.state === 'burnt' ? '#d65344' : '#fff0c6';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius); ctx.stroke(); ctx.restore();
}
export function drawTrash(r, config) {
  r.art.draw(r.ctx, 'trash-bin', ...config.trash, 1, r.state.hover === 'trash' && r.state.drag ? 1 : 0);
  zone(r, 'trash', [...config.trash, 10, 14], 'Trash — discard food', { kind: 'trash' });
}
export function drawClose(r, config) {
  r.art.draw(r.ctx, 'ui-close', ...config.close, 1, r.state.hover === 'close' ? 1 : 0);
  zone(r, 'close', [...config.close, 9, 9], 'Back to kitchen (Esc)', { kind: 'close' });
}
export function drawHighlights(r, canDrop) {
  const { ctx, state } = r;
  for (const item of r.zones) {
    const valid = state.selected && canDrop(state.selected, item.payload);
    const hovered = state.hover === item.id;
    if (!state.debug && !hovered && !valid) continue;
    ctx.strokeStyle = valid ? '#bde890' : hovered ? '#fff5d6' : '#f46b61'; ctx.lineWidth = 1;
    ctx.strokeRect(...item.rect);
  }
  // The tutorial points at the next station without changing any supplied artwork.
  const steps = ['fridge', 'basket', 'burner', 'sink', 'plate', 'serve'];
  const target = steps[state.tutorial];
  const zoneItem = r.zones.find(item => item.id === target || item.id.startsWith(`${target}-`));
  if (zoneItem) {
    const [x, y, w] = zoneItem.rect;
    ctx.fillStyle = '#fff0ac'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
    ctx.fillText('↓', x + w / 2, y - 2 - Math.floor(state.now / 400) % 2);
  }
}
