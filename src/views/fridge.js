import { layout } from '../art/layout.js';
import { drawBasket, drawClose, zone } from './shared.js';
import { drawTag } from '../art/labels.js';
export function renderFridge(r) {
  const { art, ctx, state } = r, config = layout.fridge;
  art.draw(ctx, 'fridge-interior', 0, 0);
  for (const [type, [x, y]] of Object.entries(config.ingredients)) {
    const needed = state.hints && state.orders.some(order => ['rice', 'egg', order.meat].includes(type));
    const shake = state.shakeUntil > state.now && state.hover === `ingredient-${type}` ? Math.round(Math.sin(state.now / 25)) : 0;
    art.draw(ctx, `ing-${type}`, x + shake, y, 2, needed || state.hover === `ingredient-${type}` ? 1 : 0);
    zone(r, `ingredient-${type}`, [x, y, 24, 24], `Pick ${type}`, { kind: 'ingredient', type });
  }
  for (const [type, [x, y]] of Object.entries(config.ingredients)) {
    const needed = state.hints && state.orders.some(order => ['rice', 'egg', order.meat].includes(type));
    const rect = drawTag(ctx, config.labels[type], config.labelCenters[type], y + 24, {
      size: type === 'longganisa' ? 7 : 8, hover: state.hover === `ingredient-${type}`, needed,
    });
    zone(r, `ingredient-${type}`, rect, `Pick ${type}`, { kind: 'ingredient', type });
  }
  drawBasket(r, config, true); drawClose(r, config);
  for (const effect of state.effects.filter(effect => effect.kind === 'pick')) {
    const progress = Math.min(1, (state.now - effect.start) / 300), [x, y] = config.ingredients[effect.type];
    const index = state.basket.findIndex(item => item.id === effect.id);
    const [sx, sy] = layout.basketSlots[Math.max(0, index)];
    const tx = config.basket[0] + sx * 2, ty = config.basket[1] + sy * 2 - 5;
    art.draw(ctx, `ing-${effect.type}`, x + (tx - x) * progress,
      y + (ty - y) * progress - Math.sin(progress * Math.PI) * 12, 1);
  }
  if (state.burners.some(slot => slot?.state === 'overcooked'))
    art.animated(ctx, 'ui-warning', 139, 3, 1, state.now);
}
