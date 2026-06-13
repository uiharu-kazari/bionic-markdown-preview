import { describe, it, expect } from 'vitest';
import {
  renderMarkdown,
  applyBionicReading,
  processMarkdownToBionic,
} from './markdownProcessor';
import type { BionicOptions } from '../types';

const bionic: Omit<BionicOptions, 'dimOpacity'> = {
  enabled: true,
  fixationPoint: 3,
  highlightTag: 'b',
  highlightClass: '',
};

// The render → bionic pipeline is the core of the app. These lock the
// critical contract: valid markdown in, sanitized bionic HTML out.
describe('renderMarkdown', () => {
  // Text nodes are wrapped in source-mapping <span>s, so assert structure via
  // the parsed DOM rather than brittle raw-string matching.
  const parse = (html: string) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el;
  };

  it('renders basic markdown to HTML', () => {
    const root = parse(renderMarkdown('# Hello\n\nWorld **bold**'));
    expect(root.querySelector('h1')?.textContent).toContain('Hello');
    expect(root.querySelector('strong')?.textContent).toContain('bold');
  });

  it('sanitizes dangerous markup so nothing executable survives', () => {
    const root = parse(
      renderMarkdown('<img src=x onerror="alert(1)">\n\n[x](javascript:alert(1))')
    );
    // raw HTML is escaped to inert text — no real <img> element exists
    expect(root.querySelector('img')).toBeNull();
    // no element carries an onerror handler
    expect(root.querySelector('[onerror]')).toBeNull();
    // no anchor points at a javascript: URL
    const jsLink = [...root.querySelectorAll('a')].some((a) =>
      (a.getAttribute('href') ?? '').toLowerCase().startsWith('javascript:')
    );
    expect(jsLink).toBe(false);
  });

  it('renders fenced code without injecting bionic markup', () => {
    const html = renderMarkdown('```\nconst x = 1;\n```');
    expect(html).toContain('<pre');
    expect(html).toContain('const x = 1;');
  });
});

describe('applyBionicReading', () => {
  it('wraps word prefixes in the highlight tag when enabled', () => {
    const out = applyBionicReading('<p>reading</p>', bionic);
    expect(out).toMatch(/<b>/);
    // dimmed remainder carries the bionic-dim class
    expect(out).toContain('bionic-dim');
  });

  it('is a no-op when disabled', () => {
    const input = '<p>reading text</p>';
    expect(applyBionicReading(input, { ...bionic, enabled: false })).toBe(input);
  });

  it('does not bionic-process code or links', () => {
    const out = applyBionicReading('<pre><code>foobar</code></pre>', bionic);
    expect(out).not.toContain('<b>');
    const link = applyBionicReading('<a href="#">clickme</a>', bionic);
    expect(link).not.toContain('<b>');
  });

  it('respects a custom highlight tag', () => {
    const out = applyBionicReading('<p>reading</p>', { ...bionic, highlightTag: 'strong' });
    expect(out).toMatch(/<strong>/);
  });
});

describe('processMarkdownToBionic (end-to-end pipeline)', () => {
  it('produces bionic HTML that preserves source-mapping attributes', () => {
    const html = processMarkdownToBionic('A short sentence.', bionic);
    expect(html).toContain('data-source-start');
    expect(html).toContain('<b>');
  });

  it('handles empty input without throwing', () => {
    expect(() => processMarkdownToBionic('', bionic)).not.toThrow();
  });

  it('higher fixationPoint bolds more characters', () => {
    const low = processMarkdownToBionic('information', { ...bionic, fixationPoint: 1 });
    const high = processMarkdownToBionic('information', { ...bionic, fixationPoint: 5 });
    const boldLen = (s: string) => (s.match(/<b>(.*?)<\/b>/)?.[1] ?? '').length;
    expect(boldLen(high)).toBeGreaterThanOrEqual(boldLen(low));
  });
});
