# Silog Kitchen

A Vite + vanilla JavaScript breakfast game using the supplied pixel-art scenes and sprite strips.

## Play

Run `npm install`, then `npm run dev`. Open the local address printed by Vite.

1. Open the fridge and collect rice, egg and a meat. The basket holds four ingredients; select an item inside the fridge to return it.
2. Drag ingredients to the four burners, or select an ingredient and then a burner. Add garlic to rice before it finishes cooking for an extra tip.
3. Flip eggs and meat when the turner appears. The green gauge arc is the perfect window. Food then overcooks for three seconds before burning.
4. Get a plate from the sink. Move cooked or overcooked food to the plate. Remove individual plated items by selecting or dragging them to the trash.
5. Drag the complete plate by its rim to a matching ticket, or use Select plate and the ticket. Serve also finds a matching order automatically.

Esc returns to the kitchen. Keys 1–4 select burners in the stove view. The action buttons also support keyboard operation. Sound starts off. Hints highlight ingredients needed by open orders; Zones displays the interactive bounds.

A day lasts three minutes. The summary reports breakfasts served, earnings and best perfect streak. Three consecutive perfect breakfasts award a combo bonus. A perfect breakfast needs cooked food, both flips and more than 25% patience remaining.

## Checks

- `npm test`: timing, flipping, garlic, basket, plate, scoring and supplied-art integrity.
- `npm run test:e2e`: real mouse and emulated touch interactions in Chrome, all three recipes, both cooking views, invalid actions, serving and the day loop. Requires Google Chrome installed. The test server uses port 5174.
- `npm run build`: production build in `dist/`.

Browser screenshots are written to `artifacts/screenshots/`. Browser failure output is ignored by Git.

## Artwork and structure

`new-sprites/` is the supplied source folder. Its contents are copied unchanged into `public/sprites/`. The four original JPEGs are copied byte for byte into `public/art/`; the individual station JPEGs remain reference art. The kitchen uses the original full scene. No sprite preparation or image-generation script is part of the build.

`src/state.js` owns shared game state; `src/cooking.js` owns the independent cooking clocks. Basket and plate invariants live in `src/stations/`. Each station view renders the same state. Pointer handling is in `src/input/drag.js`; the sprite loader and all station coordinates are in `src/art/`. Audio is synthesized with Web Audio and requires no additional assets.

At day end, `window` emits `silog:day-end` with `{ day, served, earnings, bestStreak }` in `event.detail`. This is the integration hook for a future upgrades shop; the shop is not implemented.
