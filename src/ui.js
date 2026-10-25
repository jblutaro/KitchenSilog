import { isComplete } from './stations/plate.js';

import { TUTORIAL, DAY_LENGTH } from './state.js';



export function spriteHTML(art, name, frame = 0, scale = 2) {

  const s = art.sprites.get(name);

  return `<span class="sprite" aria-hidden="true" style="width:${s.frameWidth * scale}px;height:${s.frameHeight * scale}px;background-image:url('/sprites/${name}.png');background-size:${s.frameWidth * s.frames * scale}px ${s.frameHeight * scale}px;background-position:-${frame * s.frameWidth * scale}px 0"></span>`;

}

export function buildUI(app) {

  app.innerHTML = `

    <main class="game-shell">

      <aside class="orders-rail" aria-label="Orders"><div class="rail-brand">SILOG KITCHEN</div><div id="tickets" aria-label="Customer orders"></div></aside>

      <section class="stage" aria-label="Game stage">

        <canvas id="surroundings" aria-hidden="true"></canvas>

        <nav aria-label="Stations"><button data-view="kitchen">Kitchen</button><button data-view="stove">Stove</button><button data-view="fridge">Fridge</button></nav>

        <div class="scene-wrap"><canvas id="scene" tabindex="0" aria-label="Interactive kitchen. Use the station and action buttons as a keyboard alternative."></canvas></div>

        <span id="scene-label" aria-hidden="true"></span>

        <div id="feedback" role="status" aria-live="polite"></div><div id="result" aria-live="polite"></div>

      </section>

      <aside class="controls-rail" aria-label="Kitchen controls">

        <div class="day-stats" id="day-stats"></div>

        <div id="actions" class="actions" aria-label="Kitchen actions"></div>

        <div class="settings"><button id="sound" aria-label="Toggle sound" aria-pressed="false" data-tooltip="Sound off">♫<span class="sr-only">Sound off</span></button><button id="hints" aria-label="Toggle hints" aria-pressed="true" data-tooltip="Hints on">?<span class="sr-only">Hints on</span></button><button id="debug" aria-label="Toggle zones" aria-pressed="false" data-tooltip="Show interactive zones">▧<span class="sr-only">Zones</span></button></div>

      </aside>

      <dialog id="summary" aria-labelledby="summary-title"></dialog>

    </main><canvas id="drag-ghost" aria-hidden="true"></canvas><span id="hud-tooltip" role="tooltip"></span>`;

}

// Avoid replacing unchanged controls (including the currently focused button).

function updateHTML(element, html) {

  if (element._content === html) return;

  const focused = element.contains(document.activeElement) ? document.activeElement : null;

  const key = focused?.getAttributeNames().find(name => name.startsWith('data-'));

  const value = key && focused.getAttribute(key);

  element.innerHTML = html; element._content = html;

  if (key) element.querySelector(`[${key}="${value}"]`)?.focus({ preventScroll: true });

}

function iconButton(art, name, text, attributes, extra = '') {

  return `<button ${attributes} class="action-button ${extra}" data-tooltip="${text}">${spriteHTML(art, name)}<span class="action-text">${text}</span></button>`;

}

export function renderHUD(state, art) {

  const seconds = Math.max(0, Math.ceil((DAY_LENGTH - state.now + state.startedAt) / 1000));

  updateHTML(document.querySelector('#day-stats'), `<span class="money">${spriteHTML(art, 'ui-coin', 0, 3)} ₱${state.coins}</span><span class="day-clock">DAY ${String(state.day).padStart(2, '0')} <b>${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}</b></span><small>${state.served} served · streak ${state.streak}</small>`);

  updateHTML(document.querySelector('#tickets'), state.orders.map((order, i) => {

    const patience = Math.max(0, (order.expiresAt - state.now) / (order.timeLimit * 1000));

    const mood = Math.min(2, (patience > 0.6 ? 0 : patience > 0.25 ? 1 : 2) + order.penalty);

    const wrong = state.plate?.meat && state.plate.meat.type !== order.meat;

    return `<button class="ticket ${wrong ? 'wrong' : ''} ${state.selected?.kind === 'plate' && !wrong ? 'drop-ready' : ''}" data-ticket="${order.id}" aria-label="Serve ${order.name}" data-tooltip="${order.name}: rice, egg, ${order.meat}">

      <span class="ticket-art">${spriteHTML(art, 'ui-ticket', 0, 2)}<span class="ticket-face">${spriteHTML(art, 'ui-mood', mood, 2)}</span></span>

      <span class="ticket-copy"><span class="ticket-heading"><strong>${order.name}</strong><span>₱${order.reward}</span></span><span class="ticket-ingredients">${['rice', 'egg', 'meat'].map(slot => `<span class="ingredient-icon ${state.plate?.[slot] ? slot === 'meat' && wrong ? 'incorrect' : 'checked' : 'waiting'}" data-tooltip="${slot === 'meat' ? order.meat : slot}">${spriteHTML(art, `ing-${slot === 'meat' ? order.meat : slot}`, 0, 2)}</span>`).join('')}</span><span class="patience"><span style="width:${patience * 100}%;background:${mood === 2 ? '#bd5a47' : mood === 1 ? '#b68d47' : '#789668'}"></span></span></span>

    </button>`;

  }).join(''));

  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-current', String(button.dataset.view === state.view)));

  const selection = state.selected ? selectionLabel(state) : 'Select an item, then its target';

  let actions = `<div class="inventory"><span class="basket-label">Basket ${state.basket.length}/4</span><div class="inventory-slots">${Array.from({ length: 4 }, (_, i) => {

    const item = state.basket[i];

    return item ? `<button data-basket="${item.id}" class="basket-chip ${state.selected?.id === item.id ? 'selected' : ''}" data-tooltip="${state.view === 'fridge' ? 'Return' : 'Select'} ${item.type}">${spriteHTML(art, `ing-${item.type}`, 0, 2)}<span class="sr-only">${item.type}</span></button>` : '<span class="empty-slot" aria-hidden="true">·</span>';

  }).join('')}</div></div>`;

  actions += `<div class="plate-status"><span>Plate ${['rice', 'egg', 'meat'].filter(slot => state.plate?.[slot]).length}/3</span><div class="inventory-slots">${['rice', 'egg', 'meat'].map(slot => {

    const type = state.plate?.[slot]?.type || (slot === 'meat' ? state.orders[0]?.meat || 'tapa' : slot);

    return `<span class="plate-slot ${state.plate?.[slot] ? '' : 'waiting'}" data-tooltip="${type.toUpperCase()}${state.plate?.[slot] ? ` · ${state.plate[slot].stage.toUpperCase()}` : ""}">${spriteHTML(art, `ing-${type}`, 0, 2)}</span>`;

  }).join('')}</div></div><span class="selection" aria-live="polite">${selection}</span><div class="action-stack">`;

  if (state.view === 'fridge') actions += ['rice', 'egg', 'tapa', 'tocino', 'longganisa', 'garlic'].map(type => iconButton(art, `ing-${type}`, type, `data-pick="${type}"`)).join('');

  else {

    actions += iconButton(art, 'sink-highlight', state.plate ? 'Plate is out' : '+ Clean plate', 'data-action="sink"');

    actions += state.burners.map((slot, index) => `<button data-burner="${index}" class="action-button ${state.selectedBurner === index ? 'active-burner' : ''}" data-tooltip="Burner ${index + 1}: ${slot ? `${slot.itemType} / ${slot.state}` : 'empty'} (key ${index + 1})"><span class="burner-number">${index + 1}</span>${spriteHTML(art, slot ? `cook-${slot.itemType}` : 'pan', slot ? ['raw', 'cooking', 'cooked', 'overcooked', 'burnt'].indexOf(slot.state) : 0, 1)}<span class="action-text">${index + 1} · ${slot ? `${slot.itemType} / ${slot.state}` : 'empty'}</span></button>${slot?.needsFlip ? iconButton(art, 'ui-flip', `Flip ${index + 1}!`, `data-flip="${index}"`, 'flip-action') : ''}`).join('');

    actions += iconButton(art, 'plate', isComplete(state.plate) ? 'Select plate' : 'Plate food', 'data-action="plate"');

    actions += iconButton(art, 'trash-bin', 'Trash', 'data-action="trash"');

  }

  actions += `</div><button id="serve-btn" class="serve-button ${state.tutorial === 5 ? 'tutorial-target' : ''}">SERVE →</button>`;

  updateHTML(document.querySelector('#actions'), actions);

  const feedback = document.querySelector('#feedback');

  // Tutorial copy is presentation-only and lives briefly above the stage edge.

  if (feedback.dataset.step !== String(state.tutorial)) {

    feedback.dataset.step = String(state.tutorial); feedback._tipUntil = state.now + 4000;

  }

  const message = state.messageUntil > state.now ? state.message : state.now < feedback._tipUntil ? TUTORIAL[state.tutorial][1] : '';

  feedback.textContent = message; feedback.classList.toggle('visible', !!message);

  const result = document.querySelector('#result');

  if (state.result && state.now - state.result.start < 5000) {

    result.innerHTML = `<div class="result-stars">${[1, 2, 3].map(i => spriteHTML(art, 'ui-star', i <= state.result.stars ? 1 : 0, 2)).join('')}</div><strong>${state.result.perfect ? 'Perfect breakfast!' : 'Breakfast is served.'}</strong><span>${spriteHTML(art, 'ui-coin')} ₱${state.result.coins} + ₱${state.result.tip} tip${state.result.bonus ? ` + ₱${state.result.bonus} combo` : ''}</span>${spriteHTML(art, 'fx-coin-pop', Math.min(3, Math.floor((state.now - state.result.start) / 120)), 2)}`;

    result.classList.add('visible');

  } else result.classList.remove('visible');

}

function selectionLabel(state) {

  const item = state.selected;

  if (item.kind === 'basket') return `Selected: ${state.basket.find(entry => entry.id === item.id)?.type || 'ingredient'} → choose a burner`;

  if (item.kind === 'burner') return `Selected: burner ${item.index + 1} → plate or trash`;

  if (item.kind === 'plated') return `Selected: ${item.slot} → trash to remove`;

  return 'Plate ready → choose a matching ticket';

}

