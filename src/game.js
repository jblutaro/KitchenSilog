import { randomOrder, checkPlate } from "./orders.js";
import { CookingSlot } from "./cooking.js";
import { renderHUD, showFeedback, clearFeedback } from "./ui.js";
import { foodSprite, plateSprite, flameSVG, coinSVG } from "./sprites.js";
const keys = ["egg", "meat", "rice"];
const emptyPlate = () => ({
  rice: false,
  riceState: null,
  egg: false,
  eggState: null,
  meat: null,
  meatState: null,
});
const state = {
  coins: 0,
  served: 0,
  missed: 0,
  burnt: 0,
  orderNumber: 0,
  order: null,
  plate: emptyPlate(),
  slots: { egg: null, meat: null, rice: null },
  message: "Welcome to your little corner of the Philippines.",
  feedback: null,
  playing: false,
};
let refs,
  controller,
  clock,
  lastTick = 0,
  orderElapsed = 0,
  drag = null,
  suppressClick = null;
const listen = (el, event, fn) =>
  el.addEventListener(event, fn, { signal: controller.signal });
const paused = () => !state.playing || document.hidden || refs.help.open;
const message = (text) => {
  state.message = text;
  state.renderUI();
};

export function initGame(app) {
  controller = new AbortController();
  app.innerHTML = `<main id="game-wrapper">
    <header class="masthead"><div class="brand"><span class="brand-icon" aria-hidden="true">${foodSprite("egg", "cooked")}</span><div><h1>SILOG KITCHEN</h1><p>MADE WITH SARAP. SERVED WITH LOVE.</p></div></div><div class="till">${coinSVG()}<span id="coin-count">₱0</span><small>EARNINGS</small></div></header>
    <div class="game-toolbar"><span><i class="open-light"></i> <span id="shift-label">BREAKFAST SHIFT</span></span><span><b id="served-count">0</b> served</span><button id="help-btn" aria-label="Open How to Play">? HOW TO PLAY</button></div>
    <div class="game-layout"><section id="kitchen-scene" aria-label="Interactive kitchen">
      <div class="wall" aria-hidden="true"></div><div class="window" aria-hidden="true"><div class="sun"></div><div class="cloud"></div><div class="hills"></div></div>
      <div class="wall-sign" aria-hidden="true">KAIN NA!<small>good food, good mood</small></div><div class="shelf" aria-hidden="true"><i></i><i></i><i></i><span>✿</span></div>
      <div class="floor" aria-hidden="true"></div><div class="backsplash" aria-hidden="true"></div>
      <div class="stove"><div class="station-title">THE HOT STUFF</div><div class="burners">${keys.map((key, i) => `<button class="burner-zone" id="burner-${key}" aria-label="${key} burner (${i + 1}): empty"><span class="pan" aria-hidden="true"></span><span class="flame" aria-hidden="true">${flameSVG()}</span><span class="burner-food" id="food-${key}" aria-hidden="true"></span><span class="vapour" aria-hidden="true"><i></i><i></i><i></i></span><span class="sizzle" aria-hidden="true"><i></i><i></i><i></i></span><span class="burner-title"><kbd>${i + 1}</kbd> ${key === "meat" ? "MEAT" : key.toUpperCase()}</span><span class="cook-track"><span id="prog-${key}"></span></span><span id="status-${key}" class="food-status">empty</span></button>`).join("")}</div><div class="stove-front" aria-hidden="true"><i></i><i></i><i></i><div class="oven"></div></div></div>
      <div class="counter"><div class="station-title">A LITTLE BIT OF EVERYTHING</div><div id="plate-scene" aria-label="Plate drop area"><div class="plate-art" aria-hidden="true">${plateSprite()}</div><div id="plate-food-stack">${["rice", "egg", "meat"].map((k) => `<span id="scene-${k}"></span>`).join("")}</div></div><span class="plate-caption">COOK → PLATE → SERVE</span><div class="cabinet" aria-hidden="true"><i></i><i></i></div><span id="serve-effect" aria-hidden="true"></span></div>
      <button id="hs-fridge" class="fridge" aria-label="Open fridge to load ingredients (F)"><span class="fridge-note">FRESH<br>DAILY</span><span class="fridge-line"></span><span class="fridge-handle"></span><span class="fridge-title"><kbd>F</kbd> FRIDGE</span></button>
      <div class="scene-footer">SINANGAG + ITLOG + A WHOLE LOT OF LOVE</div>
    </section><aside id="hud-root" aria-label="Order and plate"></aside></div>
    <div id="message-bar" role="status" aria-live="polite" aria-atomic="true"></div>
    <footer class="bottom-bar"><span>Tap to cook. Tap or drag to plate.</span><button id="end-btn">END SHIFT</button></footer>
    <dialog id="start-screen" aria-labelledby="start-title"><div class="screen-eyebrow">A TINY FILIPINO BREAKFAST GAME</div><div class="hero-food" aria-hidden="true">${foodSprite("rice", "cooked")}${foodSprite("egg", "cooked")}${foodSprite("tocino", "cooked")}</div><p class="screen-kicker">Magandang umaga, chef!</p><h2 id="start-title">SILOG<br><span>KITCHEN</span></h2><p>Warm pans. Golden eggs. Happy customers.<br>Your neighborhood silogan is ready to open.</p><button id="start-btn" class="primary">LET’S COOK!</button><button id="start-help">HOW TO PLAY</button><small>NO RUSH TO START. JUST DON’T BURN THE RICE.</small></dialog>
    <dialog id="help" aria-labelledby="help-title"><span class="screen-eyebrow">THE SILOG FIELD GUIDE</span><h2 id="help-title">How to play</h2><ol><li>Read the ticket. Every silog needs rice, egg, and the requested meat.</li><li>Open the <strong>fridge (F)</strong> to load empty burners.</li><li>Tap a burner or press <strong>1: egg, 2: meat, 3: rice</strong> to start cooking.</li><li>When it says <strong>READY</strong>, tap again or drag the food to the plate. Steam means cooked; smoke means burnt. Tap burnt food to discard it.</li><li>Tap <strong>Serve</strong> or press <strong>Enter</strong>. Faster service earns a bigger tip. Use × to remove food from the plate.</li></ol><p>The shift keeps going until you choose End shift. Cooking and patience pause while this guide is open or the tab is hidden.</p><button id="close-help" class="primary">GOT IT, CHEF!</button></dialog>
    <dialog id="summary" aria-labelledby="summary-title"><span class="screen-eyebrow">THE APRON’S OFF</span><h2 id="summary-title">Salamat, chef!</h2><p>Another breakfast shift, made with love.</p><dl><div><dt>Total earnings</dt><dd id="summary-coins"></dd></div><div><dt>Plates served</dt><dd id="summary-served"></dd></div><div><dt>Customers missed</dt><dd id="summary-missed"></dd></div><div><dt>Items burnt</dt><dd id="summary-burnt"></dd></div></dl><button id="restart-btn" class="primary">COOK ANOTHER SHIFT</button></dialog>
    <div id="drag-ghost" aria-hidden="true" hidden></div></main>`;
  refs = {};
  app.querySelectorAll("[id]").forEach((el) => {
    refs[el.id] = el;
  });
  refs.help = refs["help"];
  state.renderUI = () => renderHUD(refs["hud-root"], state);
  state.onPlateChange = () => {
    updatePlate();
    state.renderUI();
  };
  state.renderUI();
  // HUD nodes are stable for the entire session.
  refs.serve = document.getElementById("serve-btn");
  keys.forEach((key) => {
    const zone = refs[`burner-${key}`];
    listen(zone, "click", () => {
      if (suppressClick === key) {
        suppressClick = null;
        return;
      }
      activate(key);
    });
    listen(zone, "pointerdown", (e) => beginDrag(e, key));
    listen(zone, "pointermove", moveDrag);
    listen(zone, "pointerup", finishDrag);
    listen(zone, "pointercancel", cancelDrag);
    listen(zone, "lostpointercapture", cancelDrag);
  });
  listen(refs["hs-fridge"], "click", loadFridge);
  listen(refs["start-btn"], "click", startShift);
  listen(refs["restart-btn"], "click", startShift);
  for (const id of ["help-btn", "start-help"])
    listen(refs[id], "click", () => {
      flushClock();
      cancelDrag();
      refs.help.showModal();
      syncClock();
    });
  listen(refs["close-help"], "click", () => refs.help.close());
  listen(refs.help, "close", syncClock);
  listen(refs["end-btn"], "click", endShift);
  listen(refs["start-screen"], "cancel", (e) => e.preventDefault());
  listen(refs.summary, "cancel", (e) => e.preventDefault());
  listen(document, "keydown", (e) => {
    if (
      e.repeat ||
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      paused() ||
      refs["start-screen"].open ||
      refs.summary.open
    )
      return;
    if (e.target.closest("input,textarea,select")) return;
    if (
      e.key === "Enter" &&
      e.target.closest("#help-btn,#end-btn,.plate-slot button")
    )
      return;
    const index = Number(e.key) - 1;
    if (index >= 0 && index < 3) {
      e.preventDefault();
      activate(keys[index]);
    }
    if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      loadFridge();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      servePlate();
    }
  });
  listen(document, "visibilitychange", () => {
    cancelDrag();
    syncClock();
    refs["game-wrapper"].classList.toggle("paused", document.hidden);
  });
  listen(window, "pagehide", stopClock);
  listen(window, "pageshow", syncClock);
  listen(refs["serve-effect"], "animationend", () => {
    refs["serve-effect"].className = "";
  });
  listen(refs.serve, "animationend", () =>
    refs.serve.classList.remove("shake"),
  );
  refs["start-screen"].showModal();
  return () => {
    stopClock();
    cancelDrag();
    clearFeedback(state);
    controller.abort();
    keys.forEach((k) => state.slots[k]?.reset());
  };
}
function stopClock() {
  clearInterval(clock);
  clock = null;
}
function syncClock() {
  stopClock();
  lastTick = performance.now();
  refs["game-wrapper"].classList.toggle("paused", paused());
  if (!paused()) clock = setInterval(flushClock, 100);
}
function flushClock() {
  if (paused()) return;
  const now = performance.now(),
    delta = now - lastTick;
  lastTick = now;
  keys.forEach((k) => state.slots[k]?.update(delta));
  orderElapsed += delta;
  state.order.timeLeft = Math.max(
    0,
    100 - (orderElapsed / (state.order.timeLimit * 1000)) * 100,
  );
  if (state.order.timeLeft <= 0) {
    state.missed++;
    cancelDrag();
    resetPlate();
    clearSlots();
    newOrder();
    showFeedback(state, "Customer left! A fresh ticket is waiting.", "bad");
  }
  state.renderUI();
}
function startShift() {
  stopClock();
  clearFeedback(state);
  cancelDrag();
  clearSlots();
  Object.assign(state, {
    coins: 0,
    served: 0,
    missed: 0,
    burnt: 0,
    orderNumber: 0,
    playing: true,
  });
  resetPlate();
  newOrder();
  refs["start-screen"].close();
  refs.summary.close();
  refs["shift-label"].textContent = "BREAKFAST SHIFT";
  syncClock();
  refs["hs-fridge"].focus();
}
function endShift() {
  if (!state.playing) return;
  flushClock();
  state.playing = false;
  stopClock();
  cancelDrag();
  clearFeedback(state);
  for (const key of ["coins", "served", "missed", "burnt"])
    refs[`summary-${key}`].textContent =
      key === "coins" ? `₱${state[key]}` : state[key];
  refs["shift-label"].textContent = "SHIFT COMPLETE";
  refs.summary.showModal();
  syncClock();
}
function newOrder() {
  state.order = { ...randomOrder(), timeLeft: 100 };
  orderElapsed = 0;
  state.orderNumber++;
  message(`Order up: ${state.order.name}! Open the fridge to get started.`);
}
function clearSlots() {
  keys.forEach((k) => {
    state.slots[k]?.reset();
    state.slots[k] = null;
    updateBurner(k);
  });
}
function loadFridge() {
  if (paused()) return;
  flushClock();
  const loaded = [];
  for (const key of keys)
    if (!state.slots[key]) {
      const type = key === "meat" ? state.order.meat : key;
      state.slots[key] = new CookingSlot(type, (slot) =>
        updateBurner(key, slot),
      );
      updateBurner(key, state.slots[key]);
      loaded.push(type);
    }
  message(
    loaded.length
      ? `Loaded ${loaded.join(", ")}. Tap each burner to cook!`
      : "All burners are full. Cook, plate, or discard burnt food.",
  );
}
function activate(key) {
  if (paused()) return;
  flushClock();
  const slot = state.slots[key];
  if (!slot) return message("Open the fridge first to load your ingredients.");
  if (slot.state === "raw") {
    slot.startCooking();
    message(`${slot.itemType} is cooking. Watch for READY!`);
  } else if (slot.state === "cooking")
    message(`${slot.itemType} is still cooking. Give it a moment.`);
  else if (slot.state === "cooked") plateFood(key);
  else {
    slot.reset();
    state.slots[key] = null;
    updateBurner(key);
    message("Burnt food discarded. Grab a fresh ingredient from the fridge.");
  }
}
function plateFood(key) {
  const slot = state.slots[key];
  if (!slot || slot.state !== "cooked") return;
  const type = slot.itemType;
  state.plate[key] = key === "meat" ? type : true;
  state.plate[`${key}State`] = slot.pickup();
  state.slots[key] = null;
  updateBurner(key);
  updatePlate(key);
  message(`${type} plated! Add the rest, then serve it up.`);
}
function resetPlate() {
  state.plate = emptyPlate();
  updatePlate();
}
function updatePlate(landed) {
  for (const key of ["rice", "egg", "meat"]) {
    const el = refs[`scene-${key}`];
    const signature = state.plate[key]
      ? `${key === "meat" ? state.plate.meat : key}:${state.plate[`${key}State`]}`
      : "";
    if (el.dataset.sprite !== signature) {
      el.innerHTML = signature
        ? foodSprite(
            key === "meat" ? state.plate.meat : key,
            state.plate[`${key}State`],
          )
        : "";
      el.dataset.sprite = signature;
    }
    if (key === landed) {
      el.classList.remove("land");
      void el.offsetWidth;
      el.classList.add("land");
    }
  }
}
function updateBurner(key, slot) {
  const zone = refs[`burner-${key}`],
    previous = zone.dataset.state;
  const next = slot?.state || "empty";
  if (previous !== next || zone.dataset.type !== slot?.itemType) {
    if (next === "burnt" && previous !== "burnt") state.burnt++;
    zone.dataset.state = next;
    zone.dataset.type = slot?.itemType || "";
    refs[`food-${key}`].innerHTML = slot ? foodSprite(slot.itemType, next) : "";
    refs[`status-${key}`].textContent = {
      empty: "empty",
      raw: "tap to cook",
      cooking: "cooking…",
      cooked: "READY · plate it!",
      burnt: "BURNT · discard",
    }[next];
    zone.setAttribute(
      "aria-label",
      `${key} burner: ${slot?.itemType || key}, ${refs[`status-${key}`].textContent}`,
    );
  }
  refs[`prog-${key}`].style.transform =
    `scaleX(${!slot || next === "raw" ? 0 : next === "cooked" ? 1 - slot.progress / 100 : slot.progress / 100})`;
}
export function servePlate() {
  if (!refs || paused()) return;
  flushClock();
  const result = checkPlate(state.order, state.plate);
  if (!result.ok) {
    showFeedback(state, result.reason, "bad");
    refs.serve.classList.remove("shake");
    void refs.serve.offsetWidth;
    refs.serve.classList.add("shake");
    return;
  }
  if (
    ["rice", "egg", "meat"].some((k) => state.plate[`${k}State`] === "burnt")
  ) {
    state.coins = Math.max(0, state.coins - 5);
    resetPlate();
    showFeedback(state, "Burnt food! Customer unhappy. −₱5.", "bad");
    return;
  }
  const earned =
    state.order.reward + Math.round((state.order.timeLeft / 100) * 10);
  state.coins += earned;
  state.served++;
  const effect = refs["serve-effect"];
  effect.innerHTML = `${coinSVG()}<b>+₱${earned}</b>`;
  effect.className = "";
  void effect.offsetWidth;
  effect.className = "coin-pop";
  resetPlate();
  newOrder();
  showFeedback(state, `Sarap! +₱${earned}. Another happy customer.`);
}
function beginDrag(e, key) {
  if (paused() || !e.isPrimary || e.button !== 0) return;
  flushClock();
  if (state.slots[key]?.state !== "cooked") return;
  suppressClick = null;
  drag = {
    key,
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    moved: false,
    zone: e.currentTarget,
  };
  drag.zone.setPointerCapture(e.pointerId);
}
function moveDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7)
    return;
  drag.moved = true;
  const ghost = refs["drag-ghost"];
  if (ghost.hidden) {
    ghost.innerHTML = foodSprite(
      state.slots[drag.key]?.itemType || drag.key,
      "cooked",
    );
    ghost.hidden = false;
    refs["plate-scene"].classList.add("drop-active");
  }
  ghost.style.transform = `translate3d(${e.clientX - 35}px,${e.clientY - 35}px,0)`;
}
function finishDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { key, moved } = drag;
  if (moved) {
    suppressClick = key;
    flushClock();
    const bounds = refs["plate-scene"].getBoundingClientRect();
    if (
      e.clientX >= bounds.left &&
      e.clientX <= bounds.right &&
      e.clientY >= bounds.top &&
      e.clientY <= bounds.bottom
    )
      plateFood(key);
  }
  cancelDrag();
}
function cancelDrag() {
  const previous = drag;
  drag = null;
  if (previous?.zone.hasPointerCapture(previous.id))
    previous.zone.releasePointerCapture(previous.id);
  if (refs) {
    refs["drag-ghost"].hidden = true;
    refs["plate-scene"].classList.remove("drop-active");
  }
}
