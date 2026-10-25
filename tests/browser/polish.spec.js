import { test, expect } from '@playwright/test';

test('labels, four basket slots and room surroundings at requested sizes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Touch gameplay is covered by game.spec.js');
  await page.clock.install();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const [width, height] of [[1920, 1080], [1366, 768]]) {
    await page.setViewportSize({ width, height }); await page.goto('/');
    await expect(page.locator('#scene')).toBeVisible();
    await page.locator('[data-view="fridge"]').click();
    await page.clock.fastForward(700); await page.clock.runFor(180);
    await expect(page.locator('.stage')).toHaveAttribute('data-view', 'fridge');
    const readBasket = () => page.locator('#scene').evaluate(canvas => {
      const scale = canvas.width / 160, ctx = canvas.getContext('2d');
      return Array.from(ctx.getImageData(112 * scale, 62 * scale, 44 * scale, 28 * scale).data);
    });
    const baseline = await readBasket();
    for (const [index, type] of ['rice', 'egg', 'tapa', 'tocino'].entries()) {
      await page.locator(`[data-pick="${type}"]`).click();
      await page.clock.runFor(650);
      const cell = await page.locator('.stage').boundingBox(); await page.mouse.move(cell.x + 2, cell.y + 2);
      await page.clock.runFor(32);
      await expect(page.locator('.basket-label')).toHaveText(`Basket ${index + 1}/4`);
      const pixels = await readBasket(), scale = await page.locator('#scene').evaluate(canvas => canvas.width / 160);
      let changedOutside = 0, changedTops = 0;
      for (let y = 0; y < 28 * scale; y++) for (let x = 0; x < 44 * scale; x++) {
        const offset = (y * 44 * scale + x) * 4;
        if (pixels[offset] !== baseline[offset] || pixels[offset + 1] !== baseline[offset + 1] || pixels[offset + 2] !== baseline[offset + 2]) {
          if (x < 6 * scale || x >= 38 * scale) changedOutside++;
          else if (y < 12 * scale) changedTops++;
        }
      }
      expect(changedOutside).toBe(0); expect(changedTops).toBeGreaterThan(0);
      await page.screenshot({ path: `artifacts/screenshots/polish-fridge-${width}x${height}-basket${index + 1}.png`, animations: 'disabled' });
    }
    await page.screenshot({ path: `artifacts/screenshots/polish-fridge-${width}x${height}.png`, animations: 'disabled' });
    const rice = page.locator('.basket-chip').first(); await rice.hover();
    await expect(page.locator('#hud-tooltip')).toContainText('rice');
    await page.locator('[data-view="kitchen"]').click();
    await page.clock.fastForward(700); await page.clock.runFor(180);
    await expect(page.locator('.stage')).toHaveAttribute('data-view', 'kitchen');
    const cell = await page.locator('.stage').boundingBox(); await page.mouse.move(cell.x + 2, cell.y + 2);
    await page.screenshot({ path: `artifacts/screenshots/polish-kitchen-${width}x${height}.png`, animations: 'disabled' });
    await expect(page.locator('#surroundings')).toHaveAttribute('data-decor', /plant/);
    if (width === 1366) await expect(page.locator('#surroundings')).toHaveAttribute('data-decor', /window/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  }
  expect(errors).toEqual([]);
});
