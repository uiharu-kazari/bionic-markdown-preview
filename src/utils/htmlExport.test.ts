import { describe, expect, it, vi, afterEach } from 'vitest';
import { createHtmlExport, exportArticle } from './htmlExport';
import type { EditorSettings } from '../types';
vi.mock('katex/dist/katex.min.css?inline', async () => {
  const fs = await import('node:fs');
  return { default: fs.readFileSync('node_modules/katex/dist/katex.min.css', 'utf8') };
});
const settings: EditorSettings = { fontSize: 20, lineHeight: 1.8, theme: 'dark', previewFontFamily: 'Georgia, serif', fontFamily: 'monospace', layout: 'horizontal', panelsSwapped: false };
afterEach(() => vi.unstubAllGlobals());
describe('rendered HTML export', () => {
  it('preserves gradient and dimming but removes cursor, source and selection markers', () => {
    const article = document.createElement('article');
    article.innerHTML = '<p data-source-start="0"><b style="color:rgb(1,2,3)" data-gradient-word="1">Read</b><span class="bionic-dim preview-selection-highlight">ing</span><span class="preview-cursor"></span></p>';
    const clone = exportArticle(article, settings, 62);
    expect(clone.textContent).toBe('Reading');
    expect(clone.querySelector('[data-source-start], [data-gradient-word], .preview-cursor, .preview-selection-highlight')).toBeNull();
    expect(clone.querySelector('b')?.style.color).toBe('rgb(1, 2, 3)');
    expect(clone.querySelector<HTMLElement>('.bionic-dim')?.style.opacity).toBe('0.62');
    expect(clone.style.fontSize).toBe('20px');
    expect(article.querySelector('.preview-cursor')).not.toBeNull();
  });
  it('creates a complete localized document with theme and literal text preserved', async () => {
    const article = document.createElement('article'); article.textContent = '<script>alert(1)</script>';
    const html = await createHtmlExport(article, settings, 62, 'ja');
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('background:#1e293b');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.body.textContent).toContain('<script>alert(1)</script>');
  });
  it('embeds math font resources for offline download', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([65, 66]).buffer }));
    vi.stubGlobal('fetch', fetcher);
    const article = document.createElement('article'); article.innerHTML = '<span class="katex">x</span>';
    const html = await createHtmlExport(article, settings, 62, 'en');
    expect(html).toContain('data:font/woff2;base64,');
    expect(html).not.toMatch(/url\(["']?[^)]*\.woff2/);
  });
});
