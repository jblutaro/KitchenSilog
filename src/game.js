/**
 * game.js
 * Core game state, kitchen hotspot setup, and game loop.
 */
import { randomOrder, checkPlate } from './orders.js';
import { CookingSlot } from './cooking.js';
import { renderHUD, showFeedback } from './ui.js';
import { riceSprite, eggSprite, meatSprite, flameSVG } from './sprites.js';

// ─── STATE ──────────────────────────────────────────────────────────────────
const state = {
  coins:    0,
  order:    null,
  plate:    { rice: false, riceState: null, egg: false, eggState: null, meat: null, meatState: null },
  feedback: null,
  message:  '👆 Click the Refrigerator to get ingredients, then cook on the Stove!',

  // cooking slots
  slots: {
    rice:       null,   // CookingSlot – lives in rice cooker
    egg:        null,   // CookingSlot – stove left burner
    meat:       null,   // CookingSlot – stove right burner
  },

  // which meat is currently being cooked
  meatType: null,

  renderUI: null,   // injected below
  onPlateChange: null,
};

// ─── INIT ────────────────────────────────────────────────────────────────────
export function initGame(appEl) {
  buildDOM(appEl);
  state.renderUI    = () => renderHUD(document.getElementById('hud-root'), state);
  state.onPlateChange = () => { updateScenePlate(); state.renderUI(); };

  startNewOrder();
  state.renderUI();
  startOrderTimer();
}

// ─── DOM LAYOUT ──────────────────────────────────────────────────────────────
function buildDOM(appEl) {
  appEl.innerHTML = `
  <div id="game-wrapper">

    <!-- KITCHEN SCENE -->
    <div id="kitchen-scene">

      <!-- BACKGROUND -->
      <img id="kitchen-bg" src="/kitchen.png" alt="Filipino kitchen background" draggable="false"/>

      <!-- ═══ SPRITE LAYER — each sprite sits at exact background position ═══ -->

      <!-- STOVE SPRITE (left ~3%–27%, top ~30%–78%) -->
      <div id="sprite-stove" class="sprite-wrap" title="Stove">
        <img src="/stove.svg" alt="Stove" class="kitchen-sprite" draggable="false"/>

        <!-- Top-left burners → egg slot -->
        <div class="burner-zone" id="burner-egg">
          <div class="burner-food" id="food-egg"></div>
          <div class="burner-progress-wrap"><div class="burner-progress" id="prog-egg"></div></div>
          <div class="burner-label-tag">🍳 Egg</div>
        </div>

        <!-- Top-right burners → meat slot -->
        <div class="burner-zone" id="burner-meat">
          <div class="burner-food" id="food-meat"></div>
          <div class="burner-progress-wrap"><div class="burner-progress" id="prog-meat"></div></div>
          <div class="burner-label-tag">🥩 Meat</div>
        </div>

        <!-- Bottom-center → rice slot (uses the two bottom burners together) -->
        <div class="burner-zone" id="burner-rice">
          <div class="burner-food" id="food-rice"></div>
          <div class="burner-progress-wrap"><div class="burner-progress" id="prog-rice"></div></div>
          <div class="burner-label-tag">🍚 Rice</div>
        </div>
      </div>

      <!-- COUNTER SPRITE (center ~27%–72%, top ~37%–72%) -->
      <div id="sprite-counter" class="sprite-wrap" title="Counter – plating area">
        <img src="/counter.svg" alt="Counter" class="kitchen-sprite" draggable="false"/>

        <!-- PLATE SPRITE on the cutting board (left of counter) -->
        <div id="plate-scene">
          <img id="plate-sprite-img" src="/plate.svg" alt="Plate" draggable="false"/>
          <div id="plate-food-stack">
            <!-- food items injected here by updateScenePlate() -->
          </div>
        </div>

        <!-- Counter background click (informational) -->
        <div class="counter-click" id="hs-counter" title="Counter – plating area"></div>
      </div>

      <!-- FRIDGE SPRITE (right ~72%–96%, top ~28%–80%) -->
      <div id="sprite-fridge" class="sprite-wrap" title="Refrigerator – click to get ingredients">
        <img src="/fridge.svg" alt="Refrigerator" class="kitchen-sprite" draggable="false"/>
        <div class="fridge-click" id="hs-fridge"></div>
        <div class="fridge-label">🧊 GET<br>INGR.</div>
      </div>

    </div><!-- end kitchen-scene -->

    <!-- HUD PANEL -->
    <div id="hud-root"></div>

    <!-- INSTRUCTIONS OVERLAY -->
    <div id="instructions">
      <h3>🍳 How to Play</h3>
      <ol>
        <li>Check the <strong>Order Ticket</strong> on the right.</li>
        <li>Click the <strong>Fridge</strong> (right) to load ingredients onto the stove.</li>
        <li>Click the <strong>top-left</strong> stove zone to cook the Egg.</li>
        <li>Click the <strong>top-right</strong> stove zone to cook the Meat.</li>
        <li>Click the <strong>bottom</strong> stove zone to cook the Rice.</li>
        <li>Wait for items to turn <span style="color:#5A8A3C">green (Cooked)</span>.</li>
        <li><strong>Drag</strong> a cooked item onto the <strong>Plate</strong> on the counter — or just click it!</li>
        <li>Click <strong>SERVE</strong> in the right panel when all three are ready!</li>
        <li>Don't let items go <span style="color:#FF4400">Burnt 🔥</span>!</li>
      </ol>
      <button id="close-instructions">Got it! Let's cook 🍳</button>
    </div>
    <div id="instructions-backdrop"></div>

  </div>`;

  bindHotspots();
  bindPlateDropZone();
  bindInstructions();
}

// ─── HOTSPOT BINDINGS ────────────────────────────────────────────────────────
function bindHotspots() {
  // FRIDGE — single binding on the overlay zone inside sprite
  document.getElementById('hs-fridge').addEventListener('click', onFridgeClick);

  // STOVE — each burner zone handles its own ingredient
  document.getElementById('burner-egg').addEventListener('click',  onEggBurnerClick);
  document.getElementById('burner-meat').addEventListener('click', onMeatBurnerClick);
  document.getElementById('burner-rice').addEventListener('click', onRiceBurnerClick);
}

// ─── FRIDGE ──────────────────────────────────────────────────────────────────
function onFridgeClick() {
  if (!state.order) {
    setMessage('⚠️ No order yet! Wait for a customer.');
    return;
  }

  let loaded = [];

  if (!state.slots.egg) {
    state.slots.egg = new CookingSlot('egg', s => updateBurnerUI('egg', s));
    updateBurnerUI('egg', state.slots.egg);
    loaded.push('egg');
  }

  if (!state.slots.rice) {
    state.slots.rice = new CookingSlot('rice', s => updateBurnerUI('rice', s));
    updateBurnerUI('rice', state.slots.rice);
    loaded.push('rice');
  }

  if (!state.slots.meat) {
    const meatType = state.order.meat;
    state.meatType  = meatType;
    state.slots.meat = new CookingSlot(meatType, s => updateBurnerUI('meat', s));
    updateBurnerUI('meat', state.slots.meat);
    loaded.push(meatType);
  }

  if (loaded.length > 0) {
    // Reset last-rendered state so new ingredients render immediately
    loaded.forEach(k => { _lastRenderedState[k] = null; });
    setMessage(`✅ Loaded ${loaded.join(', ')} onto stove. Now click each burner to start cooking!`);
    state.renderUI();
  } else {
    setMessage('⚠️ Stove & cooker are full. Cook or serve what\'s there.');
  }
}

// ─── RICE BURNER (bottom stove zone) ─────────────────────────────────────────
function onRiceBurnerClick() {
  const slot = state.slots.rice;
  if (!slot) {
    setMessage('❗ Open the Fridge first to load rice!');
    return;
  }
  handleBurnerClick('rice', slot, 'rice');
}

// ─── EGG BURNER ──────────────────────────────────────────────────────────────
function onEggBurnerClick() {
  const slot = state.slots.egg;
  if (!slot) {
    setMessage('❗ Open the Fridge first to load an egg!');
    return;
  }
  handleBurnerClick('egg', slot, 'egg');
}

// ─── MEAT BURNER ─────────────────────────────────────────────────────────────
function onMeatBurnerClick() {
  const slot = state.slots.meat;
  if (!slot) {
    setMessage('❗ Open the Fridge first to load meat!');
    return;
  }
  handleBurnerClick('meat', slot, state.meatType);
}

function handleBurnerClick(slotKey, slot, itemLabel) {
  if (slot.state === 'raw') {
    slot.startCooking();
    setMessage(`🔥 ${itemLabel} is cooking on the stove!`);
    return;
  }
  if (slot.state === 'cooking') {
    setMessage(`⏳ ${itemLabel} is still cooking…`);
    return;
  }
  if (slot.state === 'cooked') {
    const pickedState = slot.pickup();
    state.slots[slotKey] = null;
    _lastRenderedState[slotKey] = null;
    disableDrag(slotKey);
    addToPlate(slotKey, pickedState);
    setMessage(`✅ ${itemLabel} placed on the plate!`);
    return;
  }
  if (slot.state === 'burnt') {
    slot.pickup();
    state.slots[slotKey] = null;
    _lastRenderedState[slotKey] = null;
    disableDrag(slotKey);
    if (slotKey === 'meat') state.meatType = null;
    setMessage(`😱 ${itemLabel} is burnt! Get a fresh one from the Fridge.`);
    return;
  }
}

// ─── PLATE ───────────────────────────────────────────────────────────────────
function addToPlate(key, cookState) {
  if (key === 'rice') {
    state.plate.rice      = true;
    state.plate.riceState = cookState;
  } else if (key === 'egg') {
    state.plate.egg      = true;
    state.plate.eggState = cookState;
  } else if (key === 'meat') {
    state.plate.meat      = state.meatType;
    state.plate.meatState = cookState;
  }
  updateScenePlate();
  state.renderUI();
  checkServeReady();
}

/** Update the visible plate sprite on the counter in the scene */
function updateScenePlate() {
  const stack = document.getElementById('plate-food-stack');
  if (!stack) return;

  const { plate } = state;

  const items = [
    { hasItem: plate.rice,   cookState: plate.riceState, emoji: '🍚', label: 'Rice' },
    { hasItem: plate.egg,    cookState: plate.eggState,  emoji: '🍳', label: 'Egg'  },
    { hasItem: !!plate.meat, cookState: plate.meatState, emoji: getMeatEmoji(plate.meat), label: plate.meat || '' },
  ].filter(i => i.hasItem);

  stack.innerHTML = items.map(({ emoji, cookState, label }) => `
    <div class="plate-food-item">
      <span class="pfood-emoji">${emoji}</span>
      <span class="pfood-state s-${cookState}">${cookState === 'cooked' ? '✓' : cookState}</span>
    </div>
  `).join('');
}

function getMeatEmoji(meatType) {
  if (meatType === 'tapa')      return '🥩';
  if (meatType === 'tocino')    return '🍖';
  if (meatType === 'longganisa') return '🌭';
  return '🥩';
}

function checkServeReady() {
  const { plate, order } = state;
  if (!order) return;
  if (plate.rice && plate.riceState === 'cooked'
   && plate.egg  && plate.eggState  === 'cooked'
   && plate.meat === order.meat && plate.meatState === 'cooked') {
    setMessage('🎉 Plate is ready! Click SERVE to send it!');
  }
}

// ─── SERVE (called from HUD serve button) ────────────────────────────────────
export function servePlate() {
  const { plate, order } = state;
  const result = checkPlate(order, plate);

  if (!result.ok) {
    showFeedback(state, `❌ ${result.reason}`, 'bad');
    return;
  }

  // All items must be cooked (not burnt)
  if (plate.riceState === 'burnt' || plate.eggState === 'burnt' || plate.meatState === 'burnt') {
    showFeedback(state, '💀 Burnt food! Customer unhappy. -5 coins.', 'bad');
    state.coins = Math.max(0, state.coins - 5);
    resetPlate();
    state.renderUI();
    return;
  }

  // Success!
  const bonus = Math.round((order.timeLeft / 100) * 10); // time bonus up to 10
  const earned = order.reward + bonus;
  state.coins += earned;
  showFeedback(state, `😋 Sarap! +₱${earned} (₱${order.reward} + ₱${bonus} bonus)`, 'good');
  resetPlate();
  startNewOrder();
  state.renderUI();
}

function resetPlate() {
  state.plate = { rice: false, riceState: null, egg: false, eggState: null, meat: null, meatState: null };
  updateScenePlate();
}

// ─── ORDER TIMER ─────────────────────────────────────────────────────────────
let orderTimerInterval = null;

function startOrderTimer() {
  clearInterval(orderTimerInterval);
  orderTimerInterval = setInterval(() => {
    if (!state.order) return;
    state.order.timeLeft = Math.max(0, state.order.timeLeft - (100 / state.order.timeLimit));

    if (state.order.timeLeft <= 0) {
      showFeedback(state, '⏰ Too slow! Customer left. No coins.', 'bad');
      resetPlate();
      // clear all cooking slots
      ['rice','egg','meat'].forEach(k => {
        if (state.slots[k]) { state.slots[k].reset(); state.slots[k] = null; }
      });
      state.meatType = null;
      startNewOrder();
    }
    state.renderUI();
  }, 1000);
}

function startNewOrder() {
  const order = randomOrder();
  order.timeLeft = 100; // percentage for timer bar
  state.order = order;
  setMessage(`🧑‍🍳 New order: ${order.name}! Click Fridge to start.`);
}

// ─── DRAG & DROP STATE ───────────────────────────────────────────────────────
let dragKey = null; // 'egg' | 'meat' | 'rice' — what's being dragged

// Called from updateBurnerUI whenever a slot reaches 'cooked'
function enableDrag(key) {
  const foodEl = document.getElementById(`food-${key}`);
  if (!foodEl) return;
  foodEl.setAttribute('draggable', 'true');
  foodEl.style.cursor = 'grab';

  foodEl.addEventListener('dragstart', (e) => {
    dragKey = key;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    foodEl.classList.add('dragging');
    // Show the plate drop zone highlight
    document.getElementById('plate-scene').classList.add('drop-target-active');
    setMessage('🍽️ Drop it on the plate!');
  });

  foodEl.addEventListener('dragend', () => {
    foodEl.classList.remove('dragging');
    document.getElementById('plate-scene').classList.remove('drop-target-active');
    dragKey = null;
  });
}

function disableDrag(key) {
  const foodEl = document.getElementById(`food-${key}`);
  if (!foodEl) return;
  foodEl.removeAttribute('draggable');
  foodEl.style.cursor = '';
  // Clear the visual if the slot is gone
  if (!state.slots[key]) {
    foodEl.innerHTML = '';
    const progEl = document.getElementById(`prog-${key}`);
    if (progEl) progEl.style.width = '0%';
  }
}

// Wire up the plate as a drop zone
function bindPlateDropZone() {
  const plateEl = document.getElementById('plate-scene');

  plateEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    plateEl.classList.add('drop-hover');
  });

  plateEl.addEventListener('dragleave', () => {
    plateEl.classList.remove('drop-hover');
  });

  plateEl.addEventListener('drop', (e) => {
    e.preventDefault();
    plateEl.classList.remove('drop-hover');
    plateEl.classList.remove('drop-target-active');

    const key = e.dataTransfer.getData('text/plain') || dragKey;
    if (!key) return;

    const slot = state.slots[key];
    if (!slot) return;

    if (slot.state === 'cooked') {
      const pickedState = slot.pickup();
      state.slots[key] = null;
      _lastRenderedState[key] = null;
      disableDrag(key);
      addToPlate(key, pickedState);
      setMessage(`✅ ${key} placed on the plate!`);
    } else if (slot.state === 'burnt') {
      setMessage(`🚫 That ${key} is burnt — can't plate it!`);
    } else {
      setMessage(`⏳ ${key} is not cooked yet!`);
    }
    dragKey = null;
  });
}


// Track last-rendered state to avoid full DOM rebuild every RAF frame
const _lastRenderedState = { egg: null, meat: null, rice: null };

function updateBurnerUI(key, slot) {
  const foodEl = document.getElementById(`food-${key}`);
  const progEl = document.getElementById(`prog-${key}`);
  if (!foodEl || !progEl) return;

  const stateChanged = _lastRenderedState[key] !== slot.state;

  // ── Only rebuild HTML when cook state actually changes ──────────────
  if (stateChanged) {
    _lastRenderedState[key] = slot.state;

    let svg = '';
    if (key === 'rice')      svg = riceSprite(slot.state);
    else if (key === 'egg')  svg = eggSprite(slot.state);
    else                     svg = meatSprite(state.meatType || 'tapa', slot.state);

    const stateColors = {
      raw:     '#D4956A',
      cooking: '#FF8800',
      cooked:  '#5A8A3C',
      burnt:   '#1A0A00',
    };
    const label = slot.state === 'cooked' ? 'drag to plate!' : slot.state;
    foodEl.innerHTML = svg + `<span class="food-state-label" style="background:${stateColors[slot.state]}">${label}</span>`;

    // Drag enable/disable
    if (slot.state === 'cooked') {
      enableDrag(key);
    } else {
      disableDrag(key);
    }

    // Glow class
    if (slot.state === 'cooked') foodEl.classList.add('cooked-glow');
    else                         foodEl.classList.remove('cooked-glow');

    // Flame indicator
    const burnerEl = document.getElementById(`burner-${key}`);
    if (burnerEl) {
      const existingFlame = burnerEl.querySelector('.flame');
      if (slot.state === 'cooking' && !existingFlame) {
        const f = document.createElement('div');
        f.className = 'flame';
        f.innerHTML = flameSVG();
        const foodDiv = burnerEl.querySelector('.burner-food');
        if (foodDiv) burnerEl.insertBefore(f, foodDiv);
        else burnerEl.prepend(f);
      } else if (slot.state !== 'cooking' && existingFlame) {
        existingFlame.remove();
      }
    }
  }

  // ── Progress bar updates every frame (no DOM rebuild) ───────────────
  if (slot.state === 'cooking') {
    progEl.style.width = slot.progress + '%';
    progEl.style.background = '#FF8800';
  } else if (slot.state === 'cooked') {
    progEl.style.width = (100 - slot.progress) + '%';
    progEl.style.background = '#5A8A3C';
  } else if (slot.state === 'burnt') {
    progEl.style.width = '100%';
    progEl.style.background = '#1A0A00';
  } else {
    progEl.style.width = '0%';
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function setMessage(msg) {
  state.message = msg;
  // update message bar without full re-render to avoid flicker
  const bar = document.getElementById('message-bar');
  if (bar) bar.textContent = msg;
}

function bindInstructions() {
  document.getElementById('close-instructions').addEventListener('click', () => {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('instructions-backdrop').style.display = 'none';
  });
  document.getElementById('instructions-backdrop').addEventListener('click', () => {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('instructions-backdrop').style.display = 'none';
  });
}
