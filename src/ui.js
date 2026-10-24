/**
 * ui.js
 * Renders the HUD: order ticket, plate assembly, coins, feedback, instructions.
 */
import { coinSVG } from './sprites.js';

export function renderHUD(container, state) {
  container.innerHTML = buildHUD(state);
  bindHUDEvents(container, state);
}

function buildHUD(state) {
  const { order, plate, coins, feedback, message } = state;

  const meatLabel = order ? order.meat.charAt(0).toUpperCase() + order.meat.slice(1) : '';

  return `
  <div id="hud">

    <!-- ORDER TICKET -->
    <div id="order-ticket" class="${order ? 'has-order' : 'no-order'}">
      <div class="ticket-header">📋 ORDER TICKET</div>
      ${order ? `
        <div class="ticket-name">${order.emoji} ${order.name}</div>
        <div class="ticket-desc">${order.description}</div>
        <div class="ticket-needs">
          <span class="${plate.rice && plate.riceState === 'cooked' ? 'done' : ''}">🍚 Rice</span>
          <span class="${plate.egg && plate.eggState === 'cooked' ? 'done' : ''}">🍳 Egg</span>
          <span class="${plate.meat === order.meat && plate.meatState === 'cooked' ? 'done' : ''}">${order.emoji} ${meatLabel}</span>
        </div>
        <div class="ticket-timer">
          <div class="timer-bar">
            <div class="timer-fill" style="width:${order.timeLeft}%"></div>
          </div>
        </div>
      ` : '<div class="no-order-msg">Waiting for customer…</div>'}
    </div>

    <!-- PLATE ASSEMBLY -->
    <div id="plate-area">
      <div class="plate-header">🍽️ YOUR PLATE</div>
      <div class="plate-slots">
        <div class="plate-slot ${plate.rice ? (plate.riceState === 'burnt' ? 'burnt' : plate.riceState === 'cooked' ? 'cooked' : 'raw') : 'empty'}" id="slot-rice">
          ${plate.rice ? `🍚 Rice<br><small>${plate.riceState}</small>` : '<small>empty</small>'}
          ${plate.rice ? `<button class="remove-btn" data-slot="rice">✕</button>` : ''}
        </div>
        <div class="plate-slot ${plate.egg ? (plate.eggState === 'burnt' ? 'burnt' : plate.eggState === 'cooked' ? 'cooked' : 'raw') : 'empty'}" id="slot-egg">
          ${plate.egg ? `🍳 Egg<br><small>${plate.eggState}</small>` : '<small>empty</small>'}
          ${plate.egg ? `<button class="remove-btn" data-slot="egg">✕</button>` : ''}
        </div>
        <div class="plate-slot ${plate.meat ? (plate.meatState === 'burnt' ? 'burnt' : plate.meatState === 'cooked' ? 'cooked' : 'raw') : 'empty'}" id="slot-meat">
          ${plate.meat ? `${plate.meat}<br><small>${plate.meatState}</small>` : '<small>empty</small>'}
          ${plate.meat ? `<button class="remove-btn" data-slot="meat">✕</button>` : ''}
        </div>
      </div>
      ${order ? `<button id="serve-btn" class="${canServe(plate, order) ? 'serve-ready' : ''}">🛎️ SERVE</button>` : ''}
    </div>

    <!-- COINS -->
    <div id="coins-display">
      ${coinSVG()} <span id="coin-count">₱${coins}</span>
    </div>

    <!-- FEEDBACK -->
    ${feedback ? `<div id="feedback" class="feedback ${feedback.type}">${feedback.msg}</div>` : ''}

    <!-- MESSAGE / INSTRUCTIONS -->
    ${message ? `<div id="message-bar">${message}</div>` : ''}

  </div>`;
}

function canServe(plate, order) {
  return plate.rice && plate.riceState === 'cooked'
      && plate.egg  && plate.eggState  === 'cooked'
      && plate.meat === order.meat && plate.meatState === 'cooked';
}

function bindHUDEvents(container, state) {
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const slot = btn.dataset.slot;
      if (slot === 'rice') { state.plate.rice = false; state.plate.riceState = null; }
      if (slot === 'egg')  { state.plate.egg  = false; state.plate.eggState  = null; }
      if (slot === 'meat') { state.plate.meat = null;  state.plate.meatState = null; }
      state.onPlateChange();
    });
  });
}

/** Show a temporary feedback message */
export function showFeedback(state, msg, type = 'good') {
  state.feedback = { msg, type };
  state.renderUI();
  setTimeout(() => {
    state.feedback = null;
    state.renderUI();
  }, 2500);
}
