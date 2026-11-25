const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function prepared(page) {
  await page.goto('/');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.locator('.app-button').click();
  await expect(page.locator('#offline-summary')).toContainText('listos');
  await expect(page.locator('#update-banner')).toBeHidden();
}

test('mobile navigation, search, source viewer, favorites and back button', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Tu curso, a mano.');
  await page.locator('#menu').click();
  await expect(page.locator('#sidebar')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#sidebar')).toBeHidden();
  await page.locator('#search').fill('liquen clobetasol');
  await expect(page.locator('.result-card').first()).toBeVisible();
  await page.locator('[data-star]').first().click();
  await page.locator('.bottom-nav [data-view="saved"]').click();
  await expect(page.locator('.result-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.result-card')).toHaveCount(1);
  await page.locator('.source-link[data-source]').first().click();
  await expect(page.locator('#reader')).toBeVisible();
  await page.locator('#close-reader').click();
  await page.locator('.bottom-nav [data-view="home"]').click();
  await page.locator('.topic-card').first().click();
  await expect(page).toHaveURL(/#m01-t01$/);
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Tu curso, a mano.');
  expect(errors).toEqual([]);
});

test('responsive layouts, installation manifest and app guidance', async ({ page, context }) => {
  await prepared(page);
  await expect(page.locator('#install-description')).toContainText('pantalla de inicio');
  await page.locator('#close-app').click();
  for (const width of [320, 360, 390, 760, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width <= 760) await expect(page.locator('.bottom-nav')).toBeVisible();
    else await expect(page.locator('.bottom-nav')).toBeHidden();
  }
  await page.screenshot({ path: 'test-results/tgi-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/tgi-mobile.png' });
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  const installability = await cdp.send('Page.getInstallabilityErrors');
  // Playwright's isolated contexts are incognito; all actual app requirements must pass.
  expect(installability.installabilityErrors.filter(error => error.errorId !== 'in-incognito')).toEqual([]);
});

test('shell works offline before the optional image download', async ({ page, context }) => {
  await prepared(page);
  await page.locator('#close-app').click();
  await context.setOffline(true);
  await page.reload();
  await page.locator('#search').fill('Nugent');
  await expect(page.locator('.result-card').first()).toBeVisible();
  await page.locator('.bottom-nav [data-view="questions"]').click();
  await expect(page.locator('.question-card').first()).toBeVisible();
  const unavailable = await page.evaluate(async () => (await fetch(TGI_OFFLINE.assets[0])).status);
  expect(unavailable).toBe(503);
});

test('full library download can pause, resume and serve images and text offline', async ({ page, context }) => {
  await prepared(page);
  await page.locator('#download-library').click();
  await expect.poll(() => page.locator('#download-progress').evaluate(el => el.value)).toBeGreaterThan(5);
  await page.locator('#cancel-download').click();
  await expect(page.locator('#download-status')).toContainText('pausada');
  const before = await page.locator('#download-progress').evaluate(el => el.value);
  await page.reload();
  await page.locator('.app-button').click();
  await expect(page.locator('#download-library')).toHaveText('Continuar descarga');
  expect(await page.locator('#download-progress').evaluate(el => el.value)).toBeGreaterThanOrEqual(before);
  await page.locator('#download-library').click();
  await expect(page.locator('#download-library')).toHaveText('Biblioteca completa descargada', { timeout: 90000 });
  await expect(page.locator('#download-progress')).toHaveJSProperty('value', 1694);
  await context.setOffline(true);
  await page.reload();
  const checks = await page.evaluate(async () => {
    const files = [TGI_OFFLINE.assets[0], TGI_OFFLINE.assets[1628], TGI_OFFLINE.assets.at(-1)];
    return Promise.all(files.map(async file => {
      const response = await fetch(file);
      return { ok: response.ok, size: (await response.arrayBuffer()).byteLength };
    }));
  });
  expect(checks.every(check => check.ok && check.size > 100)).toBe(true);
  await page.locator('.bottom-nav [data-view="images"]').click();
  await page.locator('.image-card').first().click();
  await expect(page.locator('.source-image img')).toBeVisible();
  expect(await page.locator('.source-image img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/tgi-reader.png' });
});

test('portable index still works directly from a folder', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  await page.locator('#search').fill('HPV');
  await expect(page.locator('.result-card').first()).toBeVisible();
  await page.locator('.app-button').click();
  await expect(page.locator('#offline-summary')).toContainText('carpeta completa');
  expect(errors).toEqual([]);
});
