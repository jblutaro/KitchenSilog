/**
 * cooking.js
 * Manages cooking slots: raw → cooking → cooked → burnt
 * Each slot is independent (stove burners, rice cooker).
 */

export const COOK_STATES = ['raw', 'cooking', 'cooked', 'burnt'];

// Timings in milliseconds
const TIMINGS = {
  rice:       { cookTime: 8000,  burnTime: 14000 },
  egg:        { cookTime: 5000,  burnTime: 9000  },
  tapa:       { cookTime: 6000,  burnTime: 11000 },
  tocino:     { cookTime: 5000,  burnTime: 9000  },
  longganisa: { cookTime: 7000,  burnTime: 12000 },
};

export class CookingSlot {
  /**
   * @param {string} itemType  - 'rice' | 'egg' | 'tapa' | 'tocino' | 'longganisa'
   * @param {Function} onUpdate - called whenever state changes
   */
  constructor(itemType, onUpdate) {
    this.itemType  = itemType;
    this.state     = 'raw';
    this.progress  = 0;      // 0-100
    this.cooking   = false;
    this.onUpdate  = onUpdate;
    this._timer    = null;
    this._startTime = null;
    const t = TIMINGS[itemType] || { cookTime: 6000, burnTime: 11000 };
    this.cookTime  = t.cookTime;
    this.burnTime  = t.burnTime;
  }

  startCooking() {
    if (this.state !== 'raw' || this.cooking) return;
    this.cooking    = true;
    this.state      = 'cooking';
    this._startTime = Date.now();
    this._tick();
    this.onUpdate(this);
  }

  _tick() {
    this._timer = requestAnimationFrame(() => {
      if (!this.cooking) return;
      const elapsed = Date.now() - this._startTime;

      if (elapsed >= this.burnTime) {
        this.state    = 'burnt';
        this.progress = 100;
        this.cooking  = false;
        this.onUpdate(this);
        return;
      }

      if (elapsed >= this.cookTime && this.state !== 'cooked') {
        this.state = 'cooked';
        this.onUpdate(this);
      }

      // progress within current phase
      if (this.state === 'cooking') {
        this.progress = Math.min(99, (elapsed / this.cookTime) * 100);
      } else if (this.state === 'cooked') {
        this.progress = Math.min(99,
          ((elapsed - this.cookTime) / (this.burnTime - this.cookTime)) * 100);
      }

      this.onUpdate(this);
      this._tick();
    });
  }

  /** Player picks up the item. Returns the state it was in. */
  pickup() {
    this.cooking = false;
    if (this._timer) cancelAnimationFrame(this._timer);
    const s = this.state;
    this.reset();
    return s;
  }

  reset() {
    this.cooking   = false;
    this.state     = 'raw';
    this.progress  = 0;
    if (this._timer) cancelAnimationFrame(this._timer);
  }
}
