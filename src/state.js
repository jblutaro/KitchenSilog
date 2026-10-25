import { ORDERS } from './orders.js';
export const DAY_LENGTH = 180000;
export const TUTORIAL = [
  ['fridge', 'Open the fridge and pick rice, egg and tapa.'],
  ['basket', 'Your basket holds four items. Return to the kitchen.'],
  ['burner', 'Move a basket ingredient to a burner. Flip when prompted.'],
  ['sink', 'Get a clean plate from the sink.'],
  ['plate', 'Move cooked rice, egg and meat onto the plate.'],
  ['serve', 'Drag the complete plate to its matching ticket, or press Serve.'],
  ['done', 'Keep cooking! Three perfect plates earn a combo bonus.'],
];
export function makeOrder(type, now, serial) {
  return { ...ORDERS[type], type, id: `order-${serial}`, expiresAt: now + ORDERS[type].timeLimit * 1000, penalty: 0 };
}
export function createState(now = Date.now(), day = 1, coins = 0) {
  return {
    view: 'kitchen', day, coins, startedAt: now, now, ended: false,
    basket: [], burners: [null, null, null, null], plate: null,
    orders: Object.keys(ORDERS).map((key, i) => makeOrder(key, now, i)), serial: 3,
    served: 0, earnings: 0, streak: 0, bestStreak: 0, selected: null,
    hover: null, drag: null, tutorial: 0, hints: true, debug: false,
    message: 'A fresh day, a hot stove. Let’s make breakfast.', messageUntil: now + 5000,
    animation: null, effects: [], result: null, shakeUntil: 0,
    sound: false, selectedBurner: 0,
  };
}
