import { layout } from '../art/layout.js';
import { zone, drawBasket, drawPlate, drawBurners, drawTrash } from './shared.js';
import { drawKitchenDecor } from '../art/room.js';
export function renderKitchen(r) {
  const { ctx, art, state } = r, config = layout.kitchen;
  ctx.drawImage(art.kitchen, 0, 0, 100, 100);
  drawKitchenDecor(r);
  zone(r, 'stove', config.stove, 'Stove — open cooking station', { kind: 'view', view: 'stove' });
  zone(r, 'fridge', config.fridge, 'Fridge — choose ingredients', { kind: 'view', view: 'fridge' });
  zone(r, 'sink', config.sink, 'Sink — get a clean plate', { kind: 'sink' });
  drawBurners(r, config, false);
  if (!state.plate) art.draw(ctx, 'sink-highlight', ...config.sinkHighlight, 0.5);
  drawPlate(r, config, false); drawBasket(r, config, false); drawTrash(r, config);
  if (state.burners.some(slot => slot?.state === 'overcooked'))
    art.animated(ctx, 'ui-warning', config.warning[0] - 3.5, config.warning[1] - 4.5, 1, state.now);
  if (state.animation?.kind === 'fridge') {
    const frame = Math.min(3, Math.floor((state.now - state.animation.start) / 100));
    art.draw(ctx, 'fridge-open', ...config.fridgeAnimation, 1, state.animation.reverse ? 3 - frame : frame);
  }
}
