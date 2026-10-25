import { test, expect } from '@playwright/test';

async function press(page, locator, touch) {
  if (touch) await locator.tap(); else await locator.click();
}
async function advance(page, ms) {
  await page.clock.fastForward(ms); await page.clock.runFor(180);
}
async function nav(page, view, touch) {
  await press(page, page.locator(`[data-view="${view}"]`), touch);
  await advance(page, 650);
  await expect(page.locator('.stage')).toHaveAttribute('data-view', view);
}
async function point(page, x, y, width = 160) {
  const bounds = await page.locator('#scene').boundingBox();
  return { x: bounds.x + x * bounds.width / width, y: bounds.y + y * bounds.width / width };
}
async function drag(page, from, to, touch) {
  if (touch) {
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] });
    for (let i = 1; i <= 8; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * i / 8, y: from.y + (to.y - from.y) * i / 8, id: 1 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
  } else {
    await page.mouse.move(from.x, from.y); await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 }); await page.mouse.up();
  }
  await page.clock.runFor(180);
}
async function prepare(page, touch, meat) {
  await page.clock.install(); await page.goto('/');
  await expect(page.locator('#scene')).toBeVisible();
  await nav(page, 'fridge', touch);
  for (const type of ['rice', 'egg', meat]) await press(page, page.locator(`[data-pick="${type}"]`), touch);
  await nav(page, 'stove', touch);
  await press(page, page.locator('[data-action="sink"]'), touch);
}
async function loadAndCook(page, touch, meat, useDrag = true) {
  const centers = [[35, 41], [85, 41], [35, 72]];
  for (let i = 0; i < 3; i++) {
    if (useDrag) await drag(page, await point(page, 129, 19), await point(page, ...centers[i]), touch);
    else {
      await press(page, page.locator('[data-basket]').first(), touch);
      await press(page, page.locator(`[data-burner="${i}"]`), touch);
    }
  }
  await expect(page.locator('[data-burner="0"]')).toContainText('rice');
  await expect(page.locator('[data-burner="1"]')).toContainText('egg');
  await expect(page.locator('[data-burner="2"]')).toContainText(meat);
  await advance(page, 2700);
  const eggFlip = page.locator('[data-flip="1"]');
  if (await eggFlip.count()) await press(page, eggFlip, touch);
  await advance(page, 650);
  const meatFlip = page.locator('[data-flip="2"]');
  if (await meatFlip.count()) await press(page, meatFlip, touch);
  await advance(page, 4200);
  // Wait only as far as the rice's cooked window.
  if (!(await page.locator('[data-burner="0"]').textContent()).includes('/ cooked')) await advance(page, 750);
  await expect(page.locator('[data-burner="0"]')).toContainText('/ cooked');
}

test('loads all three views with original sprites', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const touch = testInfo.project.name === 'touch';
  await page.goto('/'); await expect(page.locator('#scene')).toBeVisible();
  await page.screenshot({ path: `artifacts/screenshots/kitchen-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' });
  await press(page, page.locator('[data-view="fridge"]'), touch);
  await expect(page.locator('.stage')).toHaveAttribute('data-view', 'fridge');
  await page.screenshot({ path: `artifacts/screenshots/fridge-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' });
  await press(page, page.locator('[data-view="stove"]'), touch);
  await expect(page.locator('.stage')).toHaveAttribute('data-view', 'stove');
  await page.screenshot({ path: `artifacts/screenshots/stove-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const [meat, recipe] of [['tapa', 'Tapsilog'], ['tocino', 'Tocilog'], ['longganisa', 'Longsilog']]) {
  test(`cooks and serves ${recipe} with pointer drag`, async ({ page }, testInfo) => {
    const touch = testInfo.project.name === 'touch';
    await prepare(page, touch, meat);
    await loadAndCook(page, touch, meat);
    if (meat === 'tapa') await page.screenshot({ path: `artifacts/screenshots/stove-active-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' });
    for (const [x, y] of [[35, 41], [85, 41], [35, 72]]) await drag(page, await point(page, x, y), await point(page, 139, 73), touch);
    await expect(page.locator('[data-action="plate"]')).toHaveText('Select plate');
    if (meat === 'tapa') {
      await nav(page, 'kitchen', touch);
      await page.screenshot({ path: `artifacts/screenshots/kitchen-plated-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' });
      await nav(page, 'stove', touch);
    }
    const ticket = page.locator('.ticket').filter({ hasText: recipe });
    const bounds = await ticket.boundingBox();
    await drag(page, await point(page, 154, 76), { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }, touch);
    await expect(page.locator('#result')).toContainText('Breakfast');
    await expect(page.locator('#day-stats')).toContainText('1 served');
    await expect(page.locator('[data-action="sink"]')).toHaveText('+ Clean plate');
    if (meat === 'tapa') await page.screenshot({ path: `artifacts/screenshots/served-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' });
  });
}

test('basket full, ingredient return, incomplete plate and burning feedback', async ({ page }, testInfo) => {
  const touch = testInfo.project.name === 'touch';
  await page.clock.install(); await page.goto('/'); await expect(page.locator('#scene')).toBeVisible();
  await nav(page, 'fridge', touch);
  for (const type of ['rice', 'egg', 'tapa', 'garlic', 'tocino']) await press(page, page.locator(`[data-pick="${type}"]`), touch);
  await expect(page.locator('#feedback')).toContainText('Basket full');
  await expect(page.locator('.basket-label')).toHaveText('Basket 4/4');
  await press(page, page.locator('[data-basket]').last(), touch);
  await expect(page.locator('.basket-label')).toHaveText('Basket 3/4');
  await nav(page, 'stove', touch);
  await press(page, page.locator('[data-action="sink"]'), touch);
  await drag(page, await point(page, 140, 70), await point(page, 100, 90), touch);
  await expect(page.locator('#feedback')).toContainText('Plate locked');
  await press(page, page.locator('[data-basket]').filter({ hasText: 'egg' }), touch);
  await expect(page.locator('.selection')).toContainText('Selected: egg');
  await press(page, page.locator('[data-burner="0"]'), touch);
  await expect(page.locator('[data-burner="0"]')).toContainText('egg');
  await nav(page, 'fridge', touch); await advance(page, 13000);
  await nav(page, 'stove', touch);
  await expect(page.locator('[data-burner="0"]')).toContainText('burnt');
  await drag(page, await point(page, 35, 41), await point(page, 140, 70), touch);
  await expect(page.locator('#feedback')).toContainText('Burnt food');
  await drag(page, await point(page, 35, 41), await point(page, 151, 90), touch);
  await expect(page.locator('[data-burner="0"]')).toContainText('empty');
});

test('kitchen loading and plating, wrong meat removal and keyboard return', async ({ page }, testInfo) => {
  const touch = testInfo.project.name === 'touch';
  await page.clock.install(); await page.goto('/'); await expect(page.locator('#scene')).toBeVisible();
  await nav(page, 'fridge', touch);
  for (const type of ['rice', 'egg', 'tocino']) await press(page, page.locator(`[data-pick="${type}"]`), touch);
  await nav(page, 'kitchen', touch);
  await press(page, page.locator('[data-action="sink"]'), touch);
  await press(page, page.locator('[data-action="sink"]'), touch);
  await expect(page.locator('#feedback')).toContainText('One plate at a time');
  for (const [x, y] of [[9.5, 48.5], [18.5, 48.5], [9.5, 53.5]])
    await drag(page, await point(page, 80.5, 73.5, 100), await point(page, x, y, 100), touch);
  await advance(page, 8000);
  for (const [x, y] of [[9.5, 48.5], [18.5, 48.5], [9.5, 53.5]])
    await drag(page, await point(page, x, y, 100), await point(page, 37, 52, 100), touch);
  await expect(page.locator('[data-action="plate"]')).toHaveText('Select plate');
  await expect(page.locator('.ticket').filter({ hasText: 'Tapsilog' })).toHaveClass(/wrong/);
  // Meat sits at plate origin + (2,3), at half scale in the kitchen.
  await drag(page, await point(page, 35, 51, 100), await point(page, 7, 82, 100), touch);
  await expect(page.locator('[data-action="plate"]')).toHaveText('Plate food');
  await expect(page.locator('.ticket').filter({ hasText: 'Tapsilog' })).not.toHaveClass(/wrong/);
  await nav(page, 'stove', touch);
  await page.keyboard.press('3');
  await expect(page.locator('[data-burner="2"]')).toHaveClass(/active-burner/);
  await page.keyboard.press('Escape'); await advance(page, 300);
  await expect(page.locator('.stage')).toHaveAttribute('data-view', 'kitchen');
  await press(page, page.locator('#sound'), touch);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'true');
  await press(page, page.locator('#sound'), touch);
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed', 'false');
});

test('click-to-move fallback, wrong ticket and next-day summary', async ({ page }, testInfo) => {
  const touch = testInfo.project.name === 'touch';
  await prepare(page, touch, 'tocino'); await loadAndCook(page, touch, 'tocino', false);
  for (let i = 0; i < 3; i++) {
    await press(page, page.locator(`[data-burner="${i}"]`), touch);
    await press(page, page.locator('[data-action="plate"]'), touch);
  }
  await expect(page.locator('[data-action="plate"]')).toHaveText('Select plate');
  await press(page, page.locator('[data-action="plate"]'), touch);
  await press(page, page.locator('.ticket').filter({ hasText: 'Tapsilog' }), touch);
  await expect(page.locator('#feedback')).toContainText('Not quite Tapsilog');
  await expect(page.locator('#day-stats')).toContainText('₱0');
  await press(page, page.locator('#serve-btn'), touch);
  await expect(page.locator('#day-stats')).toContainText('1 served');
  await advance(page, 180000);
  await expect(page.locator('#summary')).toBeVisible();
  await expect(page.locator('#summary')).toContainText('1breakfasts served');
  await press(page, page.locator('#next-day'), touch);
  await expect(page.locator('#summary')).not.toBeVisible();
  await expect(page.locator('#day-stats')).toContainText('DAY 02');
});

