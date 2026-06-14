import { test, expect, type Page } from '@playwright/test';

// End-to-end coverage for the interaction-heavy workflows that have
// repeatedly regressed: render, click-to-navigate (no drift), preview
// selection, scroll sync, panel swap, and slider hit area.

const PARAS = Array.from(
  { length: 28 },
  (_, i) =>
    `Paragraph ${i + 1} begins with a sentence. Then it continues with another sentence about topic ${i + 1}. Finally it ends with a closing thought number ${i + 1}.`
);

async function setMarkdown(page: Page, text: string) {
  await page.fill('textarea', text);
  await page.evaluate(() => (document.querySelector('textarea') as HTMLTextAreaElement).blur());
  await page.waitForTimeout(400); // debounce + render
}

const previewScrollTop = () =>
  `document.querySelector('article').parentElement.scrollTop`;
const editorCursor = () => `document.querySelector('textarea').selectionStart`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('renders markdown to bionic preview', async ({ page }) => {
  await setMarkdown(page, '# Title\n\nReading should be faster.');
  const article = page.locator('article');
  await expect(article.locator('h1')).toHaveText(/Title/);
  // bionic emphasis present
  await expect(article.locator('b').first()).toBeVisible();
});

test('clicking preview text navigates the editor without drifting the preview', async ({ page }) => {
  await setMarkdown(page, PARAS.join('\n\n'));
  const target = page.locator('article p', { hasText: 'topic 15' }).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const before = await page.evaluate(previewScrollTop());
  const box = (await target.boundingBox())!;
  await page.mouse.click(box.x + 120, box.y + 10);
  await page.waitForTimeout(1200);

  const after = await page.evaluate(previewScrollTop());
  const cursor = (await page.evaluate(editorCursor())) as number;

  expect(Math.abs(after - before)).toBeLessThanOrEqual(2); // no preview drift
  const expected = PARAS.join('\n\n').indexOf('Paragraph 15');
  expect(Math.abs(cursor - expected)).toBeLessThan(160); // editor jumped to clicked text
});

test('drag-selecting preview text reflects the selection back to the editor', async ({ page }) => {
  await setMarkdown(page, PARAS.join('\n\n'));
  const target = page.locator('article p', { hasText: 'topic 10' }).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const pv0 = (await page.evaluate(previewScrollTop())) as number;

  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 420, box.y + 10, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(700);

  const previewSelected = await page.evaluate(() => window.getSelection()!.toString());
  const editorSelected = await page.evaluate(() => {
    const ta = document.querySelector('textarea') as HTMLTextAreaElement;
    return ta.value.slice(ta.selectionStart, ta.selectionEnd);
  });

  // the editor now holds the same source text that was selected in the preview
  expect(editorSelected.length).toBeGreaterThan(2);
  expect(editorSelected).toContain('begins with a sentence');
  // (sanity) the preview selection mapped to the same words
  expect(previewSelected).toContain('begins with a sentence');
  // reflecting must not bounce the preview pane
  expect(Math.abs((await page.evaluate(previewScrollTop()) as number) - pv0)).toBeLessThanOrEqual(2);
});

test('preview auto-scroll during a drag-selection does not scroll the editor mid-drag', async ({ page }) => {
  await setMarkdown(page, PARAS.join('\n\n'));
  const target = page.locator('article p', { hasText: 'topic 3' }).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const editorScroll = () => `document.querySelector('textarea').scrollTop`;
  const eds0 = (await page.evaluate(editorScroll())) as number;

  // Start a selection, then drag below the preview viewport so it auto-scrolls.
  // The reflect-to-editor happens on mouseup; *during* the drag the editor must
  // stay put (the auto-scroll must not sync into the editor).
  const box = (await target.boundingBox())!;
  const viewport = page.viewportSize()!;
  await page.mouse.move(box.x + 10, box.y + 5);
  await page.mouse.down();
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(box.x + 200, viewport.height - 8, { steps: 4 });
    await page.waitForTimeout(120); // let auto-scroll tick
    expect(await page.evaluate(editorScroll())).toBe(eds0); // unchanged mid-drag
  }
  await page.mouse.up();
});

test('swapping panels exchanges the panels and their widths', async ({ page }) => {
  await setMarkdown(page, PARAS.slice(0, 6).join('\n\n'));

  // Measure panes by content (editor = pane with the textarea, preview = pane
  // with the article), so it's robust to which side each is on.
  const panes = () =>
    page.evaluate(() => {
      const container = document.querySelector('main > div')!;
      const kids = [...container.children] as HTMLElement[];
      const editor = kids.find((k) => k.querySelector('textarea'))!;
      const preview = kids.find((k) => k.querySelector('article'))!;
      return {
        editorW: Math.round(editor.getBoundingClientRect().width),
        previewW: Math.round(preview.getBoundingClientRect().width),
        previewIsLeft: kids.indexOf(preview) < kids.indexOf(editor),
      };
    });

  // make the split asymmetric by dragging the divider left (~30/70)
  const divider = page.locator('main .cursor-col-resize').first();
  const db = (await divider.boundingBox())!;
  await page.mouse.move(db.x + db.width / 2, db.y + 200);
  await page.mouse.down();
  await page.mouse.move(db.x - 250, db.y + 200, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const before = await panes();
  expect(Math.abs(before.editorW - before.previewW)).toBeGreaterThan(80); // genuinely asymmetric
  expect(before.previewIsLeft).toBe(false); // preview starts on the right

  await page.getByRole('button', { name: /swap/i }).click();
  await page.waitForTimeout(400);

  const after = await panes();
  // the panels swapped sides...
  expect(after.previewIsLeft).toBe(true);
  // ...and each panel kept its own width (exchanged the panels wholesale)
  expect(Math.abs(after.editorW - before.editorW)).toBeLessThanOrEqual(4);
  expect(Math.abs(after.previewW - before.previewW)).toBeLessThanOrEqual(4);
});

test('toolbar sliders respond across their full height (hit area)', async ({ page }) => {
  const slider = page.locator('input[type=range]').first();
  const box = (await slider.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(16); // comfortable hit target

  const value = () => page.evaluate(() => document.querySelectorAll('input[type=range]')[0].value);
  const before = await value();
  // click near the TOP edge of the control — the former dead zone
  await page.mouse.click(box.x + box.width - 4, box.y + 2);
  await page.waitForTimeout(200);
  expect(await value()).not.toBe(before);
});

test('editor scroll syncs the preview proportionally and smoothly', async ({ page }) => {
  await setMarkdown(
    page,
    Array.from({ length: 30 }, (_, i) => `Para ${i}: ` + 'lorem ipsum dolor sit amet. '.repeat(6)).join('\n\n')
  );
  await page.evaluate(() => {
    (document.querySelector('textarea') as HTMLTextAreaElement).scrollTop = 0;
    (document.querySelector('article')!.parentElement as HTMLElement).scrollTop = 0;
  });
  await page.waitForTimeout(300);

  const deltas: number[] = [];
  let prev = 0;
  for (let i = 1; i <= 8; i++) {
    await page.evaluate((top) => {
      const ta = document.querySelector('textarea') as HTMLTextAreaElement;
      ta.scrollTop = top;
      ta.dispatchEvent(new Event('scroll'));
    }, i * 250);
    await page.waitForTimeout(150);
    const pv = (await page.evaluate(previewScrollTop())) as number;
    deltas.push(pv - prev);
    prev = pv;
  }

  // preview advanced monotonically as the editor scrolled down
  expect(prev).toBeGreaterThan(0);
  for (const d of deltas.slice(1)) expect(d).toBeGreaterThanOrEqual(0);
});
