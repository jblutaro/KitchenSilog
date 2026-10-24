/**
 * orders.js
 * Defines silog orders and generates random order tickets.
 */

export const ORDERS = {
  tapsilog: {
    name: 'Tapsilog',
    meat: 'tapa',
    emoji: '🥩',
    description: 'Tapa + Sinangag + Itlog',
    reward: 25,
    timeLimit: 90,
  },
  tocilog: {
    name: 'Tocilog',
    meat: 'tocino',
    emoji: '🍖',
    description: 'Tocino + Sinangag + Itlog',
    reward: 30,
    timeLimit: 85,
  },
  longsilog: {
    name: 'Longsilog',
    meat: 'longganisa',
    emoji: '🌭',
    description: 'Longganisa + Sinangag + Itlog',
    reward: 28,
    timeLimit: 95,
  },
};

export function randomOrder() {
  const keys = Object.keys(ORDERS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { id: key, ...ORDERS[key] };
}

/** Check if a plate assembly satisfies the order */
export function checkPlate(order, plate) {
  // plate = { rice: bool, egg: bool, meat: string|null }
  if (!plate.rice) return { ok: false, reason: 'Missing sinangag (rice)!' };
  if (!plate.egg)  return { ok: false, reason: 'Missing itlog (egg)!' };
  if (!plate.meat) return { ok: false, reason: `Missing ${order.meat}!` };
  if (plate.meat !== order.meat) return { ok: false, reason: `Wrong meat! Need ${order.meat}.` };
  return { ok: true };
}
