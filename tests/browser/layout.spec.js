import { test, expect } from '@playwright/test';

test('stage fills common desktop sizes with crisp integer scales and no scrolling', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop viewport matrix; touch interactions are covered by game.spec.js');
  for (const [width, height, kitchenPixels] of [[1366, 768, 600], [1440, 900, 800], [1920, 1080, 1000], [2560, 1440, 1400], [1024, 768, 600]]) {
    await page.setViewportSize({ width, height }); await page.goto('/');
    await expect(page.locator('#scene')).toHaveAttribute('width', String(kitchenPixels));
    await expect(page.locator('#scene')).toHaveAttribute('height', String(kitchenPixels));
    const measure = async () => page.evaluate(() => {
      const canvas = document.querySelector('#scene'), stage = document.querySelector('.stage');
      const box = canvas.getBoundingClientRect(), cell = stage.getBoundingClientRect();
      return {
        noScroll: [document.documentElement, document.body, document.querySelector('#app')].every(el => el.scrollWidth <= innerWidth && el.scrollHeight <= innerHeight),
        contained: box.left >= cell.left && box.right <= cell.right && box.top >= cell.top && box.bottom <= cell.bottom,
        crisp: getComputedStyle(canvas).imageRendering === 'pixelated' && !canvas.getContext('2d').imageSmoothingEnabled,
        controlsFit: document.querySelector('#actions').scrollHeight <= document.querySelector('#actions').clientHeight,
      };
    });
    expect(await measure()).toEqual({ noScroll: true, contained: true, crisp: true, controlsFit: true });
    for (const copy of ['THE BREAKFAST RUSH', 'Orders up', '01 / THE KITCHEN', 'Your little breakfast corner', 'A LITTLE HELP FROM THE CHEF', 'Click to move · Drag to cook · Esc to return']) await expect(page.locator('body')).not.toContainText(copy);
    if (width === 1920 || width === 1366) await page.screenshot({ path: `artifacts/screenshots/layout-${width}x${height}.png`, animations: 'disabled' });
    for (const view of ['stove', 'fridge']) {
      await page.locator(`[data-view="${view}"]`).click();
      await expect(page.locator('.stage')).toHaveAttribute('data-view', view);
      const expectedZ = await page.locator('.stage').evaluate(el => Math.floor(Math.min((el.clientWidth - 8) / 160, (el.clientHeight - 8) / 100)));
      await expect(page.locator('#scene')).toHaveAttribute('width', String(expectedZ * 160));
      await expect(page.locator('#scene')).toHaveAttribute('height', String(expectedZ * 100));
      expect(await measure()).toEqual({ noScroll: true, contained: true, crisp: true, controlsFit: true });
    }
  }
});
