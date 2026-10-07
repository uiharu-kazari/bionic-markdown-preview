import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const sample = '# Reading laboratory\n\nChoose the emphasis that feels comfortable. **Markdown**, gradients, and mathematical notes stay readable.\n\nInline math $x^2 + y^2 = z^2$ stays intact.\n\n$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$\n\n| Surface | Status |\n| --- | --- |\n| Web | Live preview |\n| Chrome | Page reading |\n| VS Code | Document preview |\n\n```js\nconst literal = "<img src=x onerror=alert(1)>";\n```\n\nEscaped markup: &lt;img src=x onerror=alert(1)&gt;.\n';

test('complete reading export preserves math, gradients and literal text', async ({ page, browser }, info) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Markdown Editor' }).fill(sample);
  await expect(page.locator('article .katex')).toHaveCount(2);
  await expect(page.locator('article img')).toHaveCount(0);
  await expect(page.locator('article math')).toHaveCount(2);
  await expect(page.locator('article table tbody tr')).toHaveCount(3);
  await expect(page.locator('article [data-gradient-word]').first()).toHaveAttribute('style', /color:/);
  await page.getByRole('separator').focus();
  await page.screenshot({ path: info.outputPath('web-desktop-light.png') });
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(page.locator('article [data-gradient-word]').first()).toHaveAttribute('style', /color:/);
  await page.screenshot({ path: info.outputPath('web-desktop-dark.png') });
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download HTML', exact: true }).click();
  const download = await downloading;
  const path = info.outputPath('export.html'); await download.saveAs(path);
  const html = await readFile(path, 'utf8');
  expect(html).toContain('data:font/woff2;base64,');
  expect(html).not.toMatch(/data-source-|preview-cursor|url\((?!data:)[^)]*\.woff2/);
  const offline = await browser.newContext({ offline: true });
  const exportPage = await offline.newPage(); await exportPage.goto('file://' + path);
  await expect(exportPage.locator('math')).toHaveCount(2);
  await expect(exportPage.locator('table')).toBeVisible();
  await expect(exportPage.locator('img, script')).toHaveCount(0);
  const fontsLoaded = await exportPage.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px KaTeX_Main'); });
  expect(fontsLoaded).toBe(true);
  await exportPage.screenshot({ path: info.outputPath('web-export-offline.png') });
  await offline.close();
});

test('mobile settings trap focus, dismiss with Escape and keep content after reload', async ({ page }, info) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const settings = page.getByRole('button',{name:'Settings',exact:true});
  await settings.click();
  const close = page.getByRole('button',{name:'Settings: close',exact:true});
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('dialog').getByRole('link',{name:'Support',exact:true})).toBeFocused();
  await page.keyboard.press('Tab'); await expect(close).toBeFocused();
  await page.screenshot({path:info.outputPath('web-mobile-settings.png')});
  await page.keyboard.press('Escape'); await expect(settings).toBeFocused();
  const editor = page.getByRole('textbox',{name:'Markdown Editor'});
  await editor.fill(sample); await page.reload(); await expect(editor).toHaveValue(sample);
  await expect(page.locator('article math')).toHaveCount(2);
  await page.getByRole('button',{name:'Preview only',exact:true}).click();
  await expect(editor).toHaveCount(0);
  await page.screenshot({path:info.outputPath('web-mobile-reading.png')});
});

test('keyboard divider adjusts the panel without trapping the editor', async ({page}) => {
  await page.goto('/');
  const editor = page.getByRole('textbox',{name:'Markdown Editor'});
  await editor.focus(); await page.keyboard.press('Shift+Tab');
  await expect(editor).not.toBeFocused();
  const divider = page.getByRole('separator', { name: 'Resize editor and preview' }); await divider.focus();
  await page.keyboard.press('ArrowRight'); await expect(divider).toHaveAttribute('aria-valuenow','55');
  await page.keyboard.press('Home'); await expect(divider).toHaveAttribute('aria-valuenow','25');
  await page.keyboard.press('End'); await expect(divider).toHaveAttribute('aria-valuenow','75');
});

test('invalid session settings recover to a usable app', async ({page}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('enhanced-md-content','null');
    sessionStorage.setItem('enhanced-md-settings','{}');
    sessionStorage.setItem('enhanced-md-highlight','{"highlightTag":"script"}');
    sessionStorage.setItem('enhanced-md-gradient','{"theme":"unknown"}');
  });
  await page.goto('/');
  await expect(page.getByRole('textbox',{name:'Markdown Editor'})).toBeVisible();
  await expect(page.locator('article h1')).toBeVisible();
});
