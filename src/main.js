/**
 * main.js — Entry point
 */
import './style.css';
import { initGame, servePlate } from './game.js';

const app = document.getElementById('app');
initGame(app);

// Global serve button handler (HUD re-renders, so we use event delegation)
document.addEventListener('click', e => {
  if (e.target && e.target.id === 'serve-btn') {
    servePlate();
  }
});
