import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { CookingSlot, TIMINGS } from '../src/cooking.js';
import { addIngredient, removeIngredient } from '../src/stations/basket.js';
import { createPlate, isComplete, placeFood } from '../src/stations/plate.js';
import { ORDERS } from '../src/orders.js';
import { makeOrder } from '../src/state.js';
import { scorePlate } from '../src/scoring.js';
import { drawBasket } from '../src/views/shared.js';
import { layout } from '../src/art/layout.js';

const food = (type, stage = 'cooked') => ({ type, stage, flipped: type !== 'rice', garlic: false });
function breakfast(meat = 'tapa', stage = 'cooked') {
  const plate = createPlate();
  ['rice', 'egg', meat].forEach(type => placeFood(plate, food(type, stage)));
  return plate;
}
describe('independent cooking clocks', () => {
  for (const [type, timing] of Object.entries(TIMINGS)) {
    it(`${type}: preserves cook timing and adds three seconds of overcooking`, () => {
      const slot = new CookingSlot(type); slot.startCooking(1000);
      expect(slot.state).toBe('raw');
      slot.update(1200); expect(slot.state).toBe('cooking');
      slot.update(1000 + timing.cookTime - 1); expect(slot.state).toBe('cooking');
      slot.update(1000 + timing.cookTime); expect(slot.state).toBe('cooked');
      slot.update(1000 + timing.burnTime - 1); expect(slot.state).toBe('cooked');
      slot.update(1000 + timing.burnTime); expect(slot.state).toBe('overcooked');
      slot.update(1000 + timing.burnTime + 2999); expect(slot.state).toBe('overcooked');
      slot.update(1000 + timing.burnTime + 3000); expect(slot.state).toBe('burnt');
      expect(slot.cooking).toBe(false);
    });
  }
  it('catches up after time spent in another view', () => {
    const slot = new CookingSlot('egg'); slot.startCooking(0); slot.update(13000);
    expect(slot.state).toBe('burnt');
  });
  it('only awards one flip inside the two-second window', () => {
    const slot = new CookingSlot('egg'); slot.startCooking(0);
    slot.update(2499); expect(slot.flip()).toBe(false);
    slot.update(2500); expect(slot.flip()).toBe(true); expect(slot.flip()).toBe(false);
  });
  it('a missed flip lowers quality without blocking cooked food', () => {
    const slot = new CookingSlot('tapa'); slot.startCooking(0); slot.update(5001);
    expect(slot.flip()).toBe(false); slot.update(6000);
    expect(slot.food).toMatchObject({ stage: 'cooked', flipped: false });
  });
  it('garlic only goes into an uncooked rice wok once', () => {
    const rice = new CookingSlot('rice'); rice.startCooking(0);
    expect(rice.addGarlic()).toBe(true); expect(rice.addGarlic()).toBe(false);
    const late = new CookingSlot('rice'); late.startCooking(0); late.update(8000);
    expect(late.addGarlic()).toBe(false);
    expect(new CookingSlot('egg').addGarlic()).toBe(false);
  });
  it('reset frees cooking and quality state', () => {
    const slot = new CookingSlot('egg'); slot.startCooking(0); slot.update(2500); slot.flip(); slot.reset();
    expect(slot.cooking).toBe(false); expect(slot.state).toBe('raw'); expect(slot.flipped).toBe(false);
  });
});
describe('basket capacity', () => {
  it('holds four, rejects a fifth, and allows another after a return', () => {
    const basket = [];
    for (const type of ['egg', 'rice', 'tapa', 'garlic']) expect(addIngredient(basket, type)).toBe(true);
    expect(addIngredient(basket, 'tocino')).toBe(false); expect(basket).toHaveLength(4);
    removeIngredient(basket, basket[0].id); expect(addIngredient(basket, 'tocino')).toBe(true);
  });
  it('uses distinct identities for duplicate ingredients', () => {
    const basket = []; addIngredient(basket, 'egg'); addIngredient(basket, 'egg');
    expect(basket[0].id).not.toBe(basket[1].id);
    expect(removeIngredient(basket, 'missing')).toBeNull(); expect(basket).toHaveLength(2);
  });
});
describe('plate slots and completeness', () => {
  for (const order of Object.values(ORDERS)) it(`completes ${order.name}`, () => {
    expect(isComplete(breakfast(order.meat), order.meat)).toBe(true);
    expect(isComplete(breakfast(order.meat, 'overcooked'), order.meat)).toBe(true);
  });
  it('rejects raw, cooking and burnt items', () => {
    for (const stage of ['raw', 'cooking', 'burnt']) expect(placeFood(createPlate(), food('egg', stage))).toBe(false);
  });
  it('wrong meat occupies its slot but does not satisfy the order', () => {
    const plate = breakfast('tocino'); expect(isComplete(plate, 'tapa')).toBe(false);
    expect(placeFood(plate, food('tapa'))).toBe(false);
    plate.meat = null; expect(placeFood(plate, food('tapa'))).toBe(true); expect(isComplete(plate, 'tapa')).toBe(true);
  });
  it('incomplete plates remain locked', () => {
    const plate = createPlate(); placeFood(plate, food('egg'));
    expect(isComplete(plate)).toBe(false);
  });
});
describe('scoring', () => {
  const order = makeOrder('tapsilog', 0, 0);
  it('pays nothing for wrong or burnt plates', () => {
    expect(scorePlate(breakfast('tocino'), order, 20000).coins).toBe(0);
    const plate = breakfast(); plate.egg.stage = 'burnt';
    expect(scorePlate(plate, order, 20000).ok).toBe(false);
  });
  it('reduces reward for overcooked food and missing flips', () => {
    const good = scorePlate(breakfast(), order, 10000);
    const poor = scorePlate(breakfast('tapa', 'overcooked'), order, 10000);
    expect(good.stars).toBe(3); expect(poor.stars).toBe(1); expect(poor.coins).toBeLessThan(good.coins);
    const plate = breakfast(); plate.egg.flipped = false;
    expect(scorePlate(plate, order, 10000).perfect).toBe(false);
  });
  it('rewards patience, garlic and every third consecutive perfect plate', () => {
    const plate = breakfast(), early = scorePlate(plate, order, 10000);
    expect(scorePlate(plate, order, 80000).tip).toBeLessThan(early.tip);
    plate.rice.garlic = true;
    expect(scorePlate(plate, order, 10000).tip).toBe(early.tip + 3);
    expect(scorePlate(plate, order, 10000, 1).bonus).toBe(0);
    expect(scorePlate(plate, order, 10000, 2).bonus).toBe(15);
    expect(scorePlate(plate, order, 10000, 5).bonus).toBe(15);
  });
});
describe('supplied artwork integrity', () => {
  const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
  it('copies every supplied sprite byte for byte', () => {
    for (const name of readdirSync('new-sprites')) expect(hash(`public/sprites/${name}`), name).toBe(hash(`new-sprites/${name}`));
  });
  it('retains all expected manifest images', () => {
    const manifest = JSON.parse(readFileSync('public/sprites/sprites.json', 'utf8'));
    for (const sprite of manifest) expect(readdirSync('public/sprites')).toContain(sprite.file);
  });
  it('preserves the original JPEG bytes', () => {
    const originals = {
      'counter.jpg': '71ca4d844221c1dc814d226d14cc340ee9af42914e77173415251ef116854441',
      'kitchen-mockup.jpg': 'd2b418161d29de8b20244fa54407392d1f06217de3108db122ae78f8abc86a99',
      'stove.jpg': '93900f69b8c2331b5454f6cc841f48b647dff551a5921e7479d2a2cabb3c261d',
      'fridge.jpg': '0bc930bbb12fb7e3e3f4f4a3223af015a08a93cadaa4e0258e53cbc75608dfad',
    };
    for (const [name, expected] of Object.entries(originals)) expect(hash(`public/art/${name}`), name).toBe(expected);
  });
});

describe('basket rendering bounds and layering', () => {
  for (const [view, zoom] of [['kitchen', false], ['fridge', true], ['stove', true]]) {
    for (let count = 1; count <= 4; count++) it(`${view}: ${count} ingredients stay inside both sides and behind the front`, () => {
      const calls = [], clips = [];
      const ctx = { save() {}, restore() {}, beginPath() {}, clip() {}, rect: (...rect) => clips.push(rect) };
      const basket = ['rice', 'egg', 'tapa', 'tocino'].slice(0, count).map((type, id) => ({ type, id }));
      const state = { basket, selected: null, hover: null, effects: [], now: 1000, view, debug: false };
      drawBasket({ ctx, state, zones: [], art: { draw: (...args) => calls.push(args) } }, layout[view], zoom);
      const basketScale = zoom ? 2 : 1, [x, y] = layout[view].basket;
      const ingredients = calls.filter(call => call[1].startsWith('ing-'));
      expect(ingredients).toHaveLength(count);
      expect(calls.at(-1)[1]).toBe('basket');
      expect(clips).toEqual([[x, y + 2 * basketScale, 16 * basketScale, 8 * basketScale]]);
      for (const call of ingredients) {
        expect(call[2]).toBeGreaterThanOrEqual(x);
        expect(call[2] + 12 * call[4]).toBeLessThanOrEqual(x + 16 * basketScale);
        expect(call[4]).toBe(basketScale / 2);
      }
    });
  }
});
