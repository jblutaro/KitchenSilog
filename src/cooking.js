export const COOK_STATES = ["raw", "cooking", "cooked", "burnt"];
const TIMINGS = {
  rice: [8000, 14000],
  egg: [5000, 9000],
  tapa: [6000, 11000],
  tocino: [5000, 9000],
  longganisa: [7000, 12000],
};
// Slots consume the shared game clock; they never schedule their own work.
export class CookingSlot {
  constructor(itemType, onUpdate) {
    this.itemType = itemType;
    [this.cookTime, this.burnTime] = TIMINGS[itemType] || TIMINGS.tapa;
    this.onUpdate = onUpdate;
    this.reset();
  }
  startCooking() {
    if (this.state !== "raw") return;
    this.state = "cooking";
    this.cooking = true;
    this.onUpdate(this);
  }
  update(delta) {
    if (!this.cooking) return;
    this.elapsed += delta;
    if (this.elapsed >= this.burnTime) {
      this.state = "burnt";
      this.progress = 100;
      this.cooking = false;
    } else if (this.elapsed >= this.cookTime) {
      this.state = "cooked";
      this.progress = Math.min(
        99,
        ((this.elapsed - this.cookTime) / (this.burnTime - this.cookTime)) *
          100,
      );
    } else this.progress = Math.min(99, (this.elapsed / this.cookTime) * 100);
    this.onUpdate(this);
  }
  pickup() {
    const previous = this.state;
    this.reset();
    return previous;
  }
  reset() {
    this.state = "raw";
    this.progress = 0;
    this.elapsed = 0;
    this.cooking = false;
  }
}
