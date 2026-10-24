import "./style.css";
import { initGame, servePlate } from "./game.js";
const cleanup = initGame(document.getElementById("app"));
document.getElementById("serve-btn").addEventListener("click", servePlate);
if (import.meta.hot) import.meta.hot.dispose(cleanup);
