import { SELECTION_HIGHLIGHT_CLASS } from './sourceMapping';
import mathCss from 'katex/dist/katex.min.css?inline';
import type { EditorSettings } from '../types';

/** Copy the rendered article, including gradient colors, but no editor state. */
export function exportArticle(article: HTMLElement, settings: EditorSettings, dimOpacity: number): HTMLElement {
  const clone = article.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.preview-cursor').forEach(node => node.remove());
  for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.startsWith('data-source-') || attribute.name.startsWith('data-gradient-')) element.removeAttribute(attribute.name);
    }
    element.classList.remove(SELECTION_HIGHLIGHT_CLASS);
  }
  clone.removeAttribute('class');
  clone.style.fontSize = `${settings.fontSize}px`;
  clone.style.fontFamily = settings.previewFontFamily;
  clone.style.lineHeight = String(settings.lineHeight);
  clone.querySelectorAll<HTMLElement>('.bionic-dim').forEach(node => { node.style.opacity = String(dimOpacity / 100); });
  return clone;
}

// Embed only modern WOFF2 fonts, on demand, so exported math works offline.
async function offlineMathCss(): Promise<string> {
  let css = mathCss.replace(/src:([^;]+);/g, (rule, sources: string) => {
    const woff2 = sources.match(/url\([^)]*\.woff2[^)]*\)\s*format\(["']?woff2["']?\)/);
    return woff2 ? `src:${woff2[0]};` : rule;
  });
  const urls = [...new Set(Array.from(css.matchAll(/url\(["']?([^)'" ]+)["']?\)/g), match => match[1]))];
  await Promise.all(urls.map(async url => {
    if (url.startsWith('data:')) return;
    const response = await fetch(new URL(url, window.location.href));
    if (!response.ok) throw new Error('Math font could not be included in the export.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    css = css.split(url).join(`data:font/woff2;base64,${btoa(binary)}`);
  }));
  return css;
}

export async function createHtmlExport(article: HTMLElement, settings: EditorSettings, dimOpacity: number, language: string): Promise<string> {
  const clone = exportArticle(article, settings, dimOpacity);
  const mathStyles = clone.querySelector('.katex') ? await offlineMathCss() : '';
  const page = document.implementation.createHTMLDocument('Bionic Markdown Export');
  page.documentElement.lang = language;
  const charset = page.createElement('meta'); charset.setAttribute('charset', 'UTF-8'); page.head.prepend(charset);
  const viewport = page.createElement('meta'); viewport.name = 'viewport'; viewport.content = 'width=device-width, initial-scale=1'; page.head.append(viewport);
  const style = page.createElement('style');
  style.textContent = `body{max-width:800px;margin:auto;padding:2rem;background:${settings.theme === 'dark' ? '#1e293b' : '#fff'};color:${settings.theme === 'dark' ? '#e2e8f0' : '#1e293b'}}h1,h2,h3,h4,h5,h6{line-height:1.25}pre{overflow:auto;padding:1rem;background:#0f172a;color:#e2e8f0}code{font-family:monospace}blockquote{border-left:4px solid #10b981;margin-left:0;padding-left:1rem}a{color:${settings.theme === 'dark' ? '#6ee7b7' : '#047857'}}img{max-width:100%}table{border-collapse:collapse;width:100%}th,td{border:1px solid #64748b;padding:.5rem}.math-display{overflow-x:auto} ${mathStyles}`;
  page.head.append(style); page.body.append(clone);
  return '<!DOCTYPE html>\n' + page.documentElement.outerHTML;
}
