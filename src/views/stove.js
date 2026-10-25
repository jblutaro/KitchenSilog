import { layout } from '../art/layout.js';
import { drawBasket, drawPlate, drawBurners, drawTrash, drawClose } from './shared.js';
export function renderStove(r) {
  r.art.draw(r.ctx, 'stove-zoom', 0, 0);
  const config = layout.stove;
  drawBurners(r, config, true); drawPlate(r, config, true);
  drawBasket(r, config, true); drawTrash(r, config); drawClose(r, config);
}
