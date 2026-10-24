# Silog Kitchen — visual refresh and optimization

- Self-contained CSS kitchen: replaces external scene/equipment images so no missing artwork can break the game.
- Checkered floor, tiled wall, window, cabinets, and pantry jars: gives the kitchen a consistent warm pixel-art setting.
- Detailed cached rice, egg, tapa, tocino, and longganisa SVGs: improves food readability without repeated SVG generation.
- Distinct raw, cooking, cooked, and burnt artwork, with steam and smoke: makes cooking states recognizable at a glance.
- VT323 with a monospace fallback, a preloaded font stylesheet, and a subtle CRT/vignette layer: unifies typography while keeping the game usable without Google Fonts.
- Flames, sizzle, plate bounce, coin pop, and floating +₱ feedback: adds clear visual responses to cooking and serving.
- Wrong-plate button shake and a pulsing red timer below 20%: highlights errors and urgency.
- Title screen, How to Play dialog, and End shift summary/restart: adds a complete session flow without imposing a new loss condition on the original endless game.
- Responsive aspect-ratio/clamp layout: keeps the kitchen and controls available on narrow and wide screens.
- Pointer capture and pointer events with tap-to-plate fallback: supports mouse, touch, and pen without HTML5 drag listeners.
- One-time HUD construction and cached references: updates only changed text, icons, timer values, and state classes.
- One shared 100 ms clock using performance.now(): removes per-slot animation loops while preserving all original cooking/burn durations.
- Cooking bars use transform: scaleX(): avoids layout work for progress animation.
- Stable burner handlers and direct Serve button binding: prevents repeated listeners and removes the global click handler.
- Cancelled/replaced feedback timeout: prevents an older message timer from clearing a newer message.
- Visibility/help pause and lifecycle cleanup: prevents cooking or patience from advancing while away and clears the shared interval on exit/disposal.
- Scoped will-change/contain and cached artwork: limits animation work without adding runtime dependencies.
- Removed unused counter.js and obsolete/duplicate CSS: reduces dead code and conflicting styles.
- Live message region, labeled buttons/progress, native modal focus management, reduced-motion support, and keyboard shortcuts: improves accessibility.
- Existing recipes, rewards, cooking/burn thresholds, discarding, plate removal, time bonuses, and order expiry are preserved.

## Controls

F: load empty burners. 1: egg. 2: meat. 3: rice. Enter: serve. Tap a raw burner to cook, tap a ready burner to plate, or drag ready food to the plate. Tap burnt food to discard it. Use × in the plate HUD to remove an ingredient. Help and hidden tabs pause gameplay. Choose End shift to see the summary.

## Validation

- Production build passed: complete dist output, including copied public files, is 67,034 bytes (uncompressed), below 100 KB. The optional Google Fonts response is external and is not part of dist; the fallback works offline.
- Browser checks passed for successful service/rewards, wrong plates, all five ingredients' exact cooking/burn thresholds, touch drag-and-drop, help/visibility pause, stable HUD elements, burnt discard, urgent timer, order expiry, summary, and restart.
- No browser JavaScript errors during the checks.
- No horizontal overflow at 320, 375, 414, 768, and 1280 px. Desktop and mobile screenshots were visually inspected.

## Full source

The ZIP contains the complete updated project files (not snippets), including unchanged orders.js, package files, public assets, and the new src/tokens.css. counter.js is intentionally absent. Run npm install, then npm run dev. Run npm run build for production.

