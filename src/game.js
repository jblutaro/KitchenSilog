import { CookingSlot } from './cooking.js';
import { ORDERS } from './orders.js';
import { createState, makeOrder, DAY_LENGTH } from './state.js';
import { addIngredient, removeIngredient } from './stations/basket.js';
import { createPlate, placeFood, isComplete } from './stations/plate.js';
import { scorePlate } from './scoring.js';
import { SpriteLoader } from './art/spriteLoader.js';
import { layout } from './art/layout.js';
import { Audio } from './audio.js';
import { renderKitchen } from './views/kitchen.js';
import { renderStove } from './views/stove.js';
import { renderFridge } from './views/fridge.js';
import { drawHighlights } from './views/shared.js';
import { drawHoverTag } from './art/labels.js';
import { RoomRenderer } from './art/room.js';
import { attachInput } from './input/drag.js';
import { buildUI, renderHUD } from './ui.js';

let state, art, canvas, ctx, sound, room, scale = 2, zones = [], lastHUD = 0, uiPressed = false;
const renderers = { kitchen: renderKitchen, stove: renderStove, fridge: renderFridge };
const viewNames = { kitchen: 'Kitchen', stove: 'Stove', fridge: 'Fridge' };
function tip(message, mistake = false) {
  state.message = message; state.messageUntil = state.now + 3500;
  if (mistake) {
    state.shakeUntil = state.now + 400;
    canvas.classList.remove('mistake'); void canvas.offsetWidth; canvas.classList.add('mistake');
  }
  lastHUD = 0;
}
function effect(kind, data = {}) { state.effects.push({ kind, start: state.now, ...data }); }
function advance(step) { state.tutorial = Math.max(state.tutorial, step); }
function usable() { return !state.ended && !state.animation; }
function completeForOrder() { return state.orders.some(order => isComplete(state.plate, order.meat)); }
function pick(type) {
  if (!usable() || state.view !== 'fridge') return;
  if (!addIngredient(state.basket, type)) { tip('Basket full — return an item or load a burner.', true); return; }
  const item = state.basket.at(-1);
  effect('pick', { type, id: item.id }); effect('land', { id: item.id, start: state.now + 300 }); sound.play('pick');
  advance(1); tip(`${type} added · ${state.basket.length}/4 in your basket.`);
}
function navigate(view) {
  if (!usable() || view === state.view) return;
  state.selected = null; state.hover = null;
  if (state.view === 'fridge') {
    changeView('kitchen'); state.animation = { kind: 'fridge', reverse: true, start: state.now, nextView: view };
    sound.play('close'); advance(2);
  } else if (view === 'fridge') {
    changeView('kitchen'); state.animation = { kind: 'fridge', reverse: false, start: state.now, nextView: 'fridge' };
    sound.play('open'); advance(1);
  } else changeView(view);
  lastHUD = 0;
}
function changeView(view) {
  state.view = view; state.hover = null;
  canvas.classList.remove('view-enter'); void canvas.offsetWidth; canvas.classList.add('view-enter');
  fitCanvas(); lastHUD = 0;
}
function sink() {
  if (!usable()) return;
  if (state.plate) { tip('One plate at a time — finish this breakfast first.', true); return; }
  state.plate = createPlate(); sound.play('plate'); advance(4); tip('Clean plate ready on the cutting board.');
}
function sourceFood(source) {
  if (!source) return null;
  if (source.kind === 'basket') return state.basket.find(item => item.id === source.id);
  if (source.kind === 'burner') return state.burners[source.index]?.food;
  if (source.kind === 'plated') return state.plate?.[source.slot];
  return null;
}
function canDrop(source, target) {
  if (!source || !target || state.ended) return false;
  const food = sourceFood(source);
  if (target.kind === 'trash') return ['basket', 'burner', 'plated'].includes(source.kind) && !!food;
  if (target.kind === 'burner' && source.kind === 'basket' && food) {
    const slot = state.burners[target.index];
    return food.type === 'garlic' ? !!slot && slot.itemType === 'rice' && ['raw', 'cooking'].includes(slot.state) && !slot.garlic : !slot;
  }
  if (['plate', 'plated'].includes(target.kind) && source.kind === 'burner' && food && state.plate)
    return ['cooked', 'overcooked'].includes(food.stage) && !state.plate[['rice', 'egg'].includes(food.type) ? food.type : 'meat'];
  if (target.kind === 'ticket' && source.kind === 'plate') return isComplete(state.plate, state.orders.find(order => order.id === target.id)?.meat);
  return false;
}
function canDrag(payload) {
  if (!usable() || !payload) return null;
  if (payload.kind === 'plate') {
    if (!completeForOrder()) { tip('Plate locked — add cooked rice, egg and an ordered meat.', true); return null; }
    return payload;
  }
  if (payload.kind === 'burner') {
    if (!state.burners[payload.index]) return null;
    return payload;
  }
  return ['basket', 'plated'].includes(payload.kind) ? payload : null;
}
function removeSource(source) {
  if (source.kind === 'basket') removeIngredient(state.basket, source.id);
  if (source.kind === 'burner') { state.burners[source.index].reset(); state.burners[source.index] = null; }
  if (source.kind === 'plated') state.plate[source.slot] = null;
}
function drop(source, target) {
  if (!usable()) return false;
  // A ticket can report a wrong order even when it is not a valid highlighted target.
  if (source?.kind === 'plate' && target?.kind === 'ticket') { servePlate(target.id); return true; }
  if (!canDrop(source, target)) {
    const food = sourceFood(source);
    tip(food?.stage === 'burnt' ? 'Burnt food belongs in the trash.'
      : target?.kind === 'plate' && !state.plate ? 'Get a clean plate from the sink first.'
      : food?.stage && !['cooked', 'overcooked'].includes(food.stage) && target?.kind === 'plate' ? 'Give it a little longer — it is not cooked yet.'
      : 'That does not go here. Try another target.', true);
    return false;
  }
  const food = sourceFood(source);
  if (target.kind === 'trash') {
    removeSource(source); sound.play('trash'); tip(`${food.type} discarded. Burner and plate space freed.`);
  } else if (target.kind === 'burner') {
    if (food.type === 'garlic') {
      state.burners[target.index].addGarlic(); tip('Garlic added! A little extra love for your sinangag.');
    } else {
      const slot = new CookingSlot(food.type); slot.startCooking(state.now); state.burners[target.index] = slot;
      advance(3); tip(`${food.type} cooking on burner ${target.index + 1}. Watch the green gauge window.`);
    }
    removeIngredient(state.basket, source.id); effect('land', { index: target.index });
  } else {
    const wasComplete = completeForOrder();
    if (!placeFood(state.plate, food)) return false;
    removeSource(source); sound.play('plate');
    if (!wasComplete && completeForOrder()) { effect('sparkle'); advance(5); tip('Breakfast ready — drag the plate to a matching ticket.'); }
    else tip(`${food.type} plated${food.stage === 'overcooked' ? ' — a little overdone' : ''}.`);
  }
  state.selected = null; lastHUD = 0; return true;
}
function flip(index) {
  if (!usable()) return;
  if (state.burners[index]?.flip()) { sound.play('flip'); tip('Nice flip! Quality bonus earned.'); }
  else tip('Flip when the little turner appears.');
}
function activate(payload) {
  if (!usable() || !payload) return;
  if (state.selected && canDrop(state.selected, payload)) { drop(state.selected, payload); return; }
  if (payload.kind === 'view' || payload.kind === 'close') { navigate(payload.kind === 'close' ? 'kitchen' : payload.view); return; }
  if (payload.kind === 'sink') { sink(); return; }
  if (payload.kind === 'ingredient') { pick(payload.type); return; }
  if (payload.kind === 'basket' && state.view === 'fridge') {
    removeIngredient(state.basket, payload.id); tip('Ingredient returned to the shelf.'); return;
  }
  if (payload.kind === 'flip') { flip(payload.index); return; }
  if (payload.kind === 'trash') { if (state.selected) drop(state.selected, payload); else tip('Select an item, then the trash bin.'); return; }
  if (payload.kind === 'ticket') {
    if (state.selected?.kind === 'plate') servePlate(payload.id);
    else { tip('Finish your plate, then select it and choose a ticket.'); }
    return;
  }
  // A click on plated food selects it for removal; dragging a complete plate is
  // available from its rim and the accessible Select plate button.
  if (payload.kind === 'burner') state.selectedBurner = payload.index;
  if (payload.kind === 'burner' && state.view === 'kitchen' && !state.selected && !state.burners[payload.index]) {
    navigate('stove'); return;
  }
  const source = canDrag(payload);
  if (source) { state.selected = state.selected && JSON.stringify(state.selected) === JSON.stringify(source) ? null : source; lastHUD = 0; }
  else if (payload.kind === 'burner') tip(`Burner ${payload.index + 1} is empty — select an ingredient first.`);
}
export function servePlate(orderId) {
  if (!usable()) return;
  const order = orderId ? state.orders.find(entry => entry.id === orderId)
    : state.orders.find(entry => isComplete(state.plate, entry.meat)) || state.orders[0];
  if (!order) return;
  const result = scorePlate(state.plate, order, state.now, state.streak);
  if (!result.ok) {
    order.penalty = Math.min(2, order.penalty + 1); state.streak = 0;
    tip(`Not quite ${order.name} — needs rice, egg and ${order.meat}. No coins; remove wrong food using the trash.`, true); return;
  }
  const total = result.coins + result.tip + result.bonus;
  state.coins += total; state.earnings += total; state.served++;
  state.streak = result.perfect ? state.streak + 1 : 0; state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.result = { ...result, start: state.now }; sound.play('serve');
  setTimeout(() => sound.play('coin'), 180);
  state.orders.splice(state.orders.indexOf(order), 1, nextOrder());
  state.plate = null; state.selected = null; advance(6); tip(`Served! +₱${total}. Get your next clean plate from the sink.`);
}
function nextOrder() {
  const keys = Object.keys(ORDERS);
  return makeOrder(keys[state.serial % keys.length], state.now, state.serial++);
}
function fitCanvas() {
  if (!canvas) return;
  const [w, h] = layout[state.view].size;
  const stage = document.querySelector('.stage');
  const availableWidth = stage.clientWidth - 8;
  const availableHeight = stage.clientHeight - 8;
  const fit = Math.floor(Math.min(availableWidth / w, availableHeight / h));
  scale = state.view === 'kitchen' ? Math.max(4, Math.floor(fit / 2) * 2) : Math.max(1, fit);
  if (state.view === 'kitchen') state.kitchenScale = scale;
  canvas.width = w * scale; canvas.height = h * scale;
  canvas.style.width = `${canvas.width}px`; canvas.style.height = `${canvas.height}px`;
  stage.style.setProperty('--floor-line', `${(stage.clientHeight - canvas.height) / 2 + canvas.height * 0.73}px`);
  stage.dataset.view = state.view;
  ctx.imageSmoothingEnabled = false;
}
function hit(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  // Keep pointer coordinates aligned during the existing scale/fade transition.
  const [artWidth, artHeight] = layout[state.view].size;
  const x = (clientX - rect.left) / rect.width * artWidth;
  const y = (clientY - rect.top) / rect.height * artHeight;
  return zones.findLast(zone => x >= zone.rect[0] && y >= zone.rect[1] && x <= zone.rect[0] + zone.rect[2] && y <= zone.rect[1] + zone.rect[3]);
}
function onHover(zone) {
  state.hover = zone?.id || null; canvas.style.cursor = zone ? 'pointer' : 'default';
  const label = document.querySelector('#scene-label');
  label.textContent = '';
}
function createGhost() {
  const element = document.querySelector('#drag-ghost'), gc = element.getContext('2d');
  return {
    show(source) {
      const food = sourceFood(source), name = source.kind === 'plate' ? 'plate-zoom'
        : source.kind === 'basket' ? `ing-${food.type}` : `cook-${food.type}-zoom`;
      const sprite = art.sprites.get(name), gs = 2;
      element.width = sprite.frameWidth * gs; element.height = sprite.frameHeight * gs;
      gc.imageSmoothingEnabled = false;
      const frame = food?.stage ? ['raw', 'cooking', 'cooked', 'overcooked', 'burnt'].indexOf(food.stage) : 0;
      art.draw(gc, name, 0, 0, gs, frame);
      if (source.kind === 'plate') {
        for (const slot of ['rice', 'meat', 'egg']) {
          const item = state.plate[slot], [x, y] = layout.stove.plated[slot];
          art.draw(gc, `plated-${item.type}-zoom`, x * gs, (y + 3) * gs, gs, item.stage === 'overcooked' ? 1 : 0);
        }
      }
      element.style.display = 'block';
    },
    move(x, y) { element.style.left = `${x}px`; element.style.top = `${y}px`; },
    hide() { element.style.display = 'none'; },
  };
}
function finishDay() {
  state.ended = true; state.drag = null; state.selected = null; sound.sizzle(0);
  document.querySelector('#drag-ghost').style.display = 'none';
  const summary = document.querySelector('#summary');
  summary.innerHTML = `<span class="eyebrow">THE LAST PLATE IS OUT</span><h2 id="summary-title">That’s a good day’s work.</h2><p>Day ${state.day} at Silog Kitchen</p><div class="summary-stats"><span><b>${state.served}</b>breakfasts served</span><span><b>₱${state.earnings}</b>earned today</span><span><b>${state.bestStreak}</b>best perfect streak</span></div><p>Tomorrow, another fresh start.</p><button id="next-day" class="serve-button">Start day ${state.day + 1} →</button>`;
  summary.showModal();
  // Upgrade screens can subscribe here without changing the day loop.
  window.dispatchEvent(new CustomEvent('silog:day-end', { detail: { day: state.day, served: state.served, earnings: state.earnings, bestStreak: state.bestStreak } }));
}
function frame() {
  state.now = Date.now();
  if (!state.ended) {
    for (const slot of state.burners) slot?.update(state.now);
    state.effects = state.effects.filter(entry => state.now - entry.start < (entry.kind === 'pick' ? 300 : entry.kind === 'land' ? 200 : 700));
    if (state.animation && state.now - state.animation.start >= 400) {
      const view = state.animation.nextView; state.animation = null; changeView(view);
    }
    if (state.now - state.startedAt >= DAY_LENGTH) finishDay();
    else for (let i = 0; i < state.orders.length; i++) if (state.now >= state.orders[i].expiresAt) {
      state.orders[i] = nextOrder(); state.streak = 0; tip('A customer had to leave. A new order is waiting.', true);
    }
    sound.sizzle(state.burners.filter(slot => slot?.cooking).length);
  }
  ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.imageSmoothingEnabled = false;
  room.draw(state, scale, canvas);
  zones = []; const render = { ctx, art, state, zones };
  renderers[state.view](render); drawHighlights(render, canDrop); drawHoverTag(render);
  if (!uiPressed && state.now - lastHUD > 150) { renderHUD(state, art); lastHUD = state.now; }
  requestAnimationFrame(frame);
}
export async function initGame(app) {
  app.innerHTML = '<div class="loading">Opening Silog Kitchen…</div>';
  art = new SpriteLoader();
  try { await art.load(); } catch (error) { app.innerHTML = ''; const message = document.createElement('p'); message.className = 'loading'; message.textContent = `${error.message} Please supply the original sprite file.`; app.append(message); throw error; }
  state = createState(); sound = new Audio(); buildUI(app);
  canvas = document.querySelector('#scene'); ctx = canvas.getContext('2d'); fitCanvas();
  room = new RoomRenderer(document.querySelector('#surroundings'), document.querySelector('.stage'), art);
  attachInput({ canvas, state, hit, activate, drop, canDrag, onHover, ghost: createGhost(), ticketAt(x, y) {
    const ticket = document.elementFromPoint(x, y)?.closest('[data-ticket]');
    return ticket ? { kind: 'ticket', id: ticket.dataset.ticket } : null;
  } });
  new ResizeObserver(fitCanvas).observe(document.querySelector('.stage'));
  const hudTooltip = document.querySelector('#hud-tooltip');
  function showHUDTag(event) {
    const target = event.target.closest('[data-tooltip]');
    if (!target) { hudTooltip.classList.remove('visible'); return; }
    hudTooltip.textContent = target.dataset.tooltip;
    hudTooltip.classList.add('visible');
    const box = target.getBoundingClientRect(), tip = hudTooltip.getBoundingClientRect();
    hudTooltip.style.left = `${Math.max(6, Math.min(innerWidth - tip.width - 6, box.left + box.width / 2 - tip.width / 2))}px`;
    hudTooltip.style.top = `${Math.max(6, box.top - tip.height - 6)}px`;
  }
  app.addEventListener('pointermove', showHUDTag);
  app.addEventListener('focusin', showHUDTag);
  app.addEventListener('pointerleave', () => hudTooltip.classList.remove('visible'));
  app.addEventListener('focusout', () => hudTooltip.classList.remove('visible'));
  // A HUD refresh must not replace a button between touch-down and its click.
  app.addEventListener('pointerdown', event => { if (event.target.closest('button')) uiPressed = true; }, true);
  const releaseUI = () => { setTimeout(() => { uiPressed = false; }, 0); };
  document.addEventListener('pointerup', releaseUI, true);
  document.addEventListener('pointercancel', releaseUI, true);
  // Handle touch button releases directly. Chrome can suppress its synthesized
  // click immediately after a canvas drag; keyboard and mouse still use click.
  app.addEventListener('pointerup', event => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    const button = event.target.closest('button');
    if (!button) return;
    const rect = button.getBoundingClientRect();
    if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) button.click();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (state.ended) { event.preventDefault(); return; }
      state.selected = null; navigate('kitchen');
    }
    if (state.view === 'stove' && /^[1-4]$/.test(event.key) && !state.ended) {
      event.preventDefault(); activate({ kind: 'burner', index: Number(event.key) - 1 });
    }
  });
  document.querySelector('#summary').addEventListener('cancel', event => event.preventDefault());
  app.addEventListener('click', event => {
    if (event.pointerType === 'touch') return;
    const button = event.target.closest('button'); if (!button) return;
    if (button.id === 'next-day') {
      document.querySelector('#summary').close();
      // Keep the state identity used by Pointer Events, reset its contents.
      const fresh = createState(Date.now(), state.day + 1, state.coins);
      fresh.sound = state.sound; fresh.hints = state.hints; fresh.tutorial = 6;
      Object.assign(state, fresh); changeView('kitchen'); return;
    }
    if (button.id === 'sound') {
      state.sound = sound.toggle(); button.dataset.tooltip = state.sound ? 'Sound on' : 'Sound off'; button.setAttribute('aria-pressed', String(state.sound)); return;
    }
    if (state.ended) return;
    if (button.dataset.view) navigate(button.dataset.view);
    if (button.dataset.pick) pick(button.dataset.pick);
    if (button.dataset.basket) {
      if (state.view === 'fridge') { removeIngredient(state.basket, button.dataset.basket); tip('Ingredient returned to the shelf.'); }
      else activate({ kind: 'basket', id: button.dataset.basket });
    }
    if (button.dataset.burner !== undefined) activate({ kind: 'burner', index: Number(button.dataset.burner) });
    if (button.dataset.flip !== undefined) flip(Number(button.dataset.flip));
    if (button.dataset.ticket) activate({ kind: 'ticket', id: button.dataset.ticket });
    if (button.dataset.action) {
      if (button.dataset.action === 'sink') sink();
      else activate({ kind: button.dataset.action });
    }
    if (button.id === 'serve-btn') servePlate();
    if (button.id === 'hints') { state.hints = !state.hints; button.dataset.tooltip = `Hints ${state.hints ? 'on' : 'off'}`; button.setAttribute('aria-pressed', String(state.hints)); }
    if (button.id === 'debug') { state.debug = !state.debug; button.setAttribute('aria-pressed', String(state.debug)); }
    lastHUD = 0;
  });
  requestAnimationFrame(frame);
}
