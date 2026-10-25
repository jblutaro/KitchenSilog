export const COOK_STATES = ['raw', 'cooking', 'cooked', 'overcooked', 'burnt'];
export const TIMINGS = {
  rice: { cookTime: 8000, burnTime: 14000 }, egg: { cookTime: 5000, burnTime: 9000 },
  tapa: { cookTime: 6000, burnTime: 11000 }, tocino: { cookTime: 5000, burnTime: 9000 },
  longganisa: { cookTime: 7000, burnTime: 12000 },
};
// All slots receive the same game clock; navigation cannot pause them.
export class CookingSlot {
  constructor(itemType, onUpdate = () => {}) {
    if (!TIMINGS[itemType]) throw new Error(`Cannot cook ${itemType}`);
    Object.assign(this, TIMINGS[itemType]);
    this.itemType = itemType; this.onUpdate = onUpdate;
    this.overcookTime = this.burnTime; this.burnTime += 3000; this.reset();
  }
  startCooking(now = Date.now()) {
    if (this.cooking || this.state !== 'raw') return;
    this.startedAt = now; this.cooking = true; this.onUpdate(this);
  }
  update(now = Date.now()) {
    if (!this.cooking) return;
    this.elapsed = Math.max(0, now - this.startedAt);
    this.state = this.elapsed >= this.burnTime ? 'burnt'
      : this.elapsed >= this.overcookTime ? 'overcooked'
      : this.elapsed >= this.cookTime ? 'cooked'
      : this.elapsed > 150 ? 'cooking' : 'raw';
    this.progress = Math.min(100, this.elapsed / this.burnTime * 100);
    if (this.state === 'burnt') this.cooking = false;
    this.onUpdate(this);
  }
  get needsFlip() {
    return this.itemType !== 'rice' && !this.flipped && this.elapsed >= this.cookTime / 2
      && this.elapsed <= this.cookTime / 2 + 2000;
  }
  flip() { if (!this.needsFlip) return false; this.flipped = true; return true; }
  addGarlic() {
    if (this.itemType !== 'rice' || !['raw', 'cooking'].includes(this.state) || this.garlic) return false;
    this.garlic = true; return true;
  }
  get food() { return { type: this.itemType, stage: this.state, flipped: this.flipped, garlic: this.garlic }; }
  pickup() { const stage = this.state; this.reset(); return stage; }
  reset() {
    this.state = 'raw'; this.cooking = false; this.progress = 0;
    this.elapsed = 0; this.flipped = false; this.garlic = false; this.startedAt = null;
  }
}
