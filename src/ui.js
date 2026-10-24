import { coinSVG, foodSprite } from "./sprites.js";
const views = new WeakMap();
const setText = (el, value) => {
  if (el.textContent !== String(value)) el.textContent = value;
};
export function canServe(plate, order) {
  return (
    !!order &&
    plate.rice &&
    plate.riceState === "cooked" &&
    plate.egg &&
    plate.eggState === "cooked" &&
    plate.meat === order.meat &&
    plate.meatState === "cooked"
  );
}
export function renderHUD(container, state) {
  let refs = views.get(container);
  if (!refs) {
    container.innerHTML = `<section id="order-ticket" aria-label="Current order">
      <div class="ticket-top"><span>ORDER UP!</span><span id="order-number"></span></div>
      <h2 id="order-name"></h2><p id="order-desc"></p>
      <div class="ticket-needs">${["rice", "egg", "meat"].map((k) => `<span id="need-${k}"></span>`).join("")}</div>
      <div class="time-label"><span>CUSTOMER PATIENCE</span><span id="time-text"></span></div>
      <div id="order-timer" class="timer-bar" role="progressbar" aria-label="Customer patience" aria-valuemin="0" aria-valuemax="100"><div id="timer-fill"></div></div>
      <div class="ticket-bottom">FRESH OFF THE STOVE <span id="reward"></span></div></section>
      <section class="plating-panel" aria-label="Plate contents"><h3>YOUR SILOG</h3><div class="plate-slots">${["rice", "egg", "meat"].map((k) => `<div id="slot-${k}" class="plate-slot"><span id="plate-icon-${k}" aria-hidden="true"></span><span id="plate-label-${k}"></span><button id="remove-${k}" aria-label="Remove ${k} from plate">×</button></div>`).join("")}</div><button id="serve-btn" class="primary" aria-label="Serve plate (Enter)">SERVE IT UP <span>↵</span></button></section>
      <div id="feedback" role="status" hidden></div>`;
    refs = {};
    for (const el of container.querySelectorAll("[id]")) refs[el.id] = el;
    refs.lastIcons = {};
    for (const key of ["rice", "egg", "meat"])
      refs[`remove-${key}`].addEventListener("click", () => {
        state.plate[key] = key === "meat" ? null : false;
        state.plate[`${key}State`] = null;
        state.onPlateChange();
      });
    views.set(container, refs);
  }
  const { order, plate } = state;
  setText(document.getElementById("coin-count"), `₱${state.coins}`);
  setText(document.getElementById("served-count"), state.served);
  setText(document.getElementById("message-bar"), state.message);
  setText(
    refs["order-number"],
    `#${String(state.orderNumber).padStart(3, "0")}`,
  );
  setText(refs["order-name"], order?.name || "Kitchen is closed");
  setText(
    refs["order-desc"],
    order?.description || "A little rice. A little sunshine.",
  );
  setText(refs.reward, order ? `₱${order.reward} + tip` : "");
  const remaining = Math.ceil(
    ((order?.timeLeft || 0) / 100) * (order?.timeLimit || 0),
  );
  setText(refs["time-text"], `${remaining}s`);
  const percent = Math.max(0, Math.min(100, order?.timeLeft || 0));
  const width = `${percent.toFixed(2)}%`;
  if (refs["timer-fill"].style.width !== width)
    refs["timer-fill"].style.width = width;
  if (
    refs["order-timer"].getAttribute("aria-valuenow") !==
    String(Math.round(percent))
  )
    refs["order-timer"].setAttribute("aria-valuenow", Math.round(percent));
  refs["order-timer"].classList.toggle("urgent", percent > 0 && percent < 20);
  for (const key of ["rice", "egg", "meat"]) {
    const type = key === "meat" ? plate.meat || order?.meat || "tapa" : key;
    const present = !!plate[key],
      cooked = present && plate[`${key}State`] === "cooked";
    setText(
      refs[`need-${key}`],
      `${cooked && (key !== "meat" || plate.meat === order?.meat) ? "✓" : "□"} ${key === "meat" ? order?.meat || "meat" : key}`,
    );
    refs[`need-${key}`].classList.toggle(
      "done",
      !!cooked && (key !== "meat" || plate.meat === order?.meat),
    );
    setText(refs[`plate-label-${key}`], present ? type : key);
    refs[`slot-${key}`].classList.toggle("filled", present);
    refs[`remove-${key}`].hidden = !present;
    const iconKey = present ? `${type}:${plate[`${key}State`]}` : "";
    if (refs.lastIcons[key] !== iconKey) {
      refs[`plate-icon-${key}`].innerHTML = present
        ? foodSprite(type, plate[`${key}State`])
        : '<span class="empty-mark">+</span>';
      refs.lastIcons[key] = iconKey;
    }
  }
  refs["serve-btn"].classList.toggle("serve-ready", !!canServe(plate, order));
  const feedback = refs.feedback;
  feedback.hidden = !state.feedback;
  if (state.feedback) {
    setText(feedback, state.feedback.msg);
    const cls = `feedback ${state.feedback.type}`;
    if (feedback.className !== cls) feedback.className = cls;
  }
}
let feedbackTimer;
export function clearFeedback(state) {
  clearTimeout(feedbackTimer);
  feedbackTimer = undefined;
  state.feedback = null;
}
export function showFeedback(state, msg, type = "good") {
  clearFeedback(state);
  state.feedback = { msg, type };
  state.renderUI();
  feedbackTimer = setTimeout(() => {
    state.feedback = null;
    state.renderUI();
  }, 2500);
}
export { coinSVG };
