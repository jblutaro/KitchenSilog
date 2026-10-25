// Pointer capture keeps mouse, pen and touch on the same path. No HTML drag API.
export function attachInput({ canvas, state, hit, activate, drop, canDrag, onHover, ghost, ticketAt }) {
  let pressed = null;
  function move(event) {
    const target = hit(event.clientX, event.clientY);
    onHover(target);
    if (!pressed || pressed.pointerId !== event.pointerId) return;
    if (!pressed.dragging && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 5) {
      const source = canDrag(pressed.target?.payload);
      if (!source) { pressed.blocked = true; return; }
      pressed.dragging = true; state.drag = source; state.selected = source;
      ghost.show(source);
    }
    if (pressed.dragging) ghost.move(event.clientX, event.clientY);
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pressed) return;
    event.preventDefault(); canvas.setPointerCapture(event.pointerId);
    pressed = { pointerId: event.pointerId, target: hit(event.clientX, event.clientY), x: event.clientX, y: event.clientY, dragging: false };
  });
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', event => {
    if (!pressed || pressed.pointerId !== event.pointerId) return;
    if (pressed.dragging) {
      const ticket = ticketAt(event.clientX, event.clientY);
      drop(state.drag, ticket || hit(event.clientX, event.clientY)?.payload);
      ghost.hide(); state.drag = null; state.selected = null;
    } else if (!pressed.blocked) activate(pressed.target?.payload);
    pressed = null;
  });
  canvas.addEventListener('pointercancel', () => {
    pressed = null; state.drag = null; state.selected = null; ghost.hide();
  });
  canvas.addEventListener('pointerleave', () => { if (!pressed) onHover(null); });
  canvas.addEventListener('lostpointercapture', () => {
    if (pressed) { pressed = null; state.drag = null; ghost.hide(); }
  });
}
