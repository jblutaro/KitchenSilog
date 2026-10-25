import { isComplete } from './stations/plate.js';
export function scorePlate(plate, order, now, streak = 0) {
  if (!isComplete(plate, order.meat)) return { ok: false, coins: 0, tip: 0, bonus: 0, stars: 0, perfect: false };
  const foods = [plate.rice, plate.egg, plate.meat];
  const quality = foods.reduce((sum, food) => sum + (food.stage === 'cooked' ? 1 : 0.5), 0) / 3;
  const flips = foods.filter(food => food.flipped).length;
  const patience = Math.max(0, Math.min(1, (order.expiresAt - now) / (order.timeLimit * 1000)));
  const perfect = quality === 1 && flips === 2 && patience > 0.25;
  const tip = Math.round(patience * 8 + flips * 2 + (plate.rice.garlic ? 3 : 0));
  const bonus = perfect && (streak + 1) % 3 === 0 ? 15 : 0;
  return { ok: true, coins: Math.round(order.reward * quality), tip, bonus, perfect, stars: perfect ? 3 : quality > 0.8 ? 2 : 1 };
}
