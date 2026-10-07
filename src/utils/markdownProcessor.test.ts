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

function parseResult(markdown: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = processMarkdownToBionic(markdown, bionic);
  return root;
}

describe('safe text and math rendering', () => {
  it.each([
    '<img src=x onerror="alert(1)">',
    '<svg onload="alert(1)"></svg>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    'a & b < c > d "quoted"',
    '&lt;img src=x onerror=alert(1)&gt;',
  ])('keeps decoded Markdown text inert and intact: %s', source => {
    const sanitized = document.createElement('div');
    sanitized.innerHTML = renderMarkdown(source);
    const root = parseResult(source);
    expect(root.textContent).toBe(sanitized.textContent);
    expect(root.querySelector('img, svg, iframe, script, [onerror], [onload]')).toBeNull();
  });

  it('creates a highlight class as a DOM attribute instead of parsing it', () => {
    const root = document.createElement('div');
    root.innerHTML = applyBionicReading('<p>reading</p>', {
      ...bionic, highlightClass: 'x" onmouseover="alert(1)',
    });
    expect(root.textContent).toBe('reading');
    expect(root.querySelector('[onmouseover]')).toBeNull();
  });

  it('renders inline and standalone display math without splitting a paragraph', () => {
    const root = parseResult('Before $x^2$ after.\n\n$$\na^2+b^2=c^2\n$$\n\nEnd.');
    expect(root.querySelector('.math-inline .katex')).not.toBeNull();
    expect(root.querySelector('.math-display .katex-display')).not.toBeNull();
    expect(root.querySelectorAll('p')).toHaveLength(2);
    expect(root.querySelector('.math-display')?.closest('p')).toBeNull();
    expect(root.textContent).not.toContain('BIONICMATH');
  });

  it.each([
    '````\n```\n$x$\n````',
    '~~~\n$x$\n~~~',
    '```\n$x$',
    '    $x$',
    'Use `` `$x$` `` here',
  ])('leaves code formulas literal: %s', source => {
    const root = parseResult(source);
    expect(root.querySelector('.katex')).toBeNull();
    expect(root.querySelector('code')?.textContent).toContain('$x$');
  });

  it('keeps math-looking URL destinations, titles, and image alt text intact', () => {
    const root = parseResult('[read](https://example.test/$x$ "$y$") ![$z$](https://example.test/$a$.png "$b$")');
    expect(root.querySelector('a')?.getAttribute('href')).toBe('https://example.test/$x$');
    expect(root.querySelector('a')?.getAttribute('title')).toBe('$y$');
    expect(root.querySelector('img')?.getAttribute('src')).toBe('https://example.test/$a$.png');
    expect(root.querySelector('img')?.getAttribute('alt')).toBe('$z$');
    expect(root.querySelector('img')?.getAttribute('title')).toBe('$b$');
    expect(root.querySelector('.katex')).toBeNull();
  });

  it.each([
    '$\\href{javascript:alert(1)}{go}$',
    '$\\href{https://example.test}{go}$',
    '$\\includegraphics{https://example.test/tracker.png}$',
    '$\\htmlClass{source-line-highlight}{x}$',
    '$\\htmlStyle{position:fixed}{x}$',
    '$\\htmlId{injected}{x}$',
  ])('disables trusted TeX commands: %s', source => {
    const root = parseResult(source);
    expect(root.querySelector('a, img, .source-line-highlight, #injected')).toBeNull();
    expect(root.querySelector('[style*="position"]')).toBeNull();
  });

  it('does not replace literal placeholder-looking text with a formula', () => {
    const source = '@MATHBLOCK0ENDMATH@ @BIONICMATH_0@ then $x$';
    const root = parseResult(source);
    expect(root.textContent).toContain('@MATHBLOCK0ENDMATH@ @BIONICMATH_0@');
    expect(root.querySelectorAll('.katex')).toHaveLength(1);
  });

  it('preserves original source offsets and lines before and after multiline math', () => {
    const source = 'Before $x^2$ after.\n\n$$\na+b\n$$\n\nRepeated after.';
    const root = parseResult(source);
    const spans = [...root.querySelectorAll('span[data-source-start][data-source-text]')];
    const after = spans.find(span => span.textContent === ' after.');
    const final = spans.find(span => span.textContent === 'Repeated after.');
    const math = spans.find(span => decodeURIComponent(span.getAttribute('data-source-text') ?? '') === '$x^2$');
    expect(after?.getAttribute('data-source-start')).toBe(String(source.indexOf(' after.')));
    expect(final?.getAttribute('data-source-start')).toBe(String(source.indexOf('Repeated')));
    expect(final?.closest('p')?.getAttribute('data-source-line')).toBe('6');
    expect(math?.getAttribute('data-source-start')).toBe(String(source.indexOf('$x^2$')));
    expect(math?.getAttribute('data-source-end')).toBe(String(source.indexOf('$x^2$') + 5));
    for (const span of spans) {
      const start = Number(span.getAttribute('data-source-start'));
      const end = Number(span.getAttribute('data-source-end'));
      expect(decodeURIComponent(span.getAttribute('data-source-text') ?? '')).toBe(source.slice(start, end));
    }
  });
});

describe('math accessibility and exact locations', () => {
  it('provides semantic MathML and the original TeX for assistive technology', () => {
    const root = parseResult('$\\frac{a}{b}$');
    expect(root.querySelector('math')).not.toBeNull();
    expect(root.querySelector('math mfrac')).not.toBeNull();
    expect(root.querySelector('annotation[encoding="application/x-tex"]')?.textContent).toBe('\\frac{a}{b}');
    expect(root.querySelector('.katex-html')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.katex b')).toBeNull();
  });

  it.each([
    'Code `$x$` then $x$ after.',
    '[read](https://example.test/$x$)$x$ after.',
    '```\n$x$\n```\n\n$x$ after.',
    '> Quote $x$ after.',
    '# Heading $x$ after.',
    '- List $x$ after.',
  ])('maps real math after repeated literal formulas: %s', source => {
    const root = parseResult(source);
    const math = root.querySelector('.math-inline')?.parentElement;
    const expected = source.lastIndexOf('$x$');
    expect(math?.getAttribute('data-source-start')).toBe(String(expected));
    expect(math?.getAttribute('data-source-end')).toBe(String(expected + 3));
    const after = [...root.querySelectorAll('span[data-source-text]')].find(span => span.textContent === ' after.');
    expect(after?.getAttribute('data-source-start')).toBe(String(source.lastIndexOf(' after.')));
  });
});

describe('math original-source newline conventions', () => {
  it('preserves CRLF offsets in inline and display formulas', () => {
    const source = 'Before $x$ after.\r\n\r\n$$\r\na+b\r\n$$\r\n\r\nEnd.';
    const root = parseResult(source);
    const inline = root.querySelector('.math-inline')?.parentElement;
    const display = root.querySelector('.math-display')?.parentElement;
    expect(inline?.getAttribute('data-source-start')).toBe(String(source.indexOf('$x$')));
    expect(display?.getAttribute('data-source-start')).toBe(String(source.indexOf('$$')));
    expect(decodeURIComponent(display?.getAttribute('data-source-text') ?? '')).toBe('$$\r\na+b\r\n$$');
    const end = [...root.querySelectorAll('span[data-source-text]')].find(span => span.textContent === 'End.');
    expect(end?.getAttribute('data-source-start')).toBe(String(source.indexOf('End.')));
  });
});

describe('Unicode bionic prefixes', () => {
  it('keeps astral letters intact when text-vide calculates a UTF-16 boundary', () => {
    const root = document.createElement('div');
    root.innerHTML = applyBionicReading('<p>𝒜bc</p>', { ...bionic, fixationPoint: 1 });
    expect(root.querySelector('b')?.textContent).toBe('𝒜');
    expect(root.textContent).toBe('𝒜bc');
  });
});

describe('math in surrounding prose', () => {
  it('keeps an inline display formula inside its original paragraph', () => {
    const root = parseResult('Before $$x^2$$ after.');
    expect(root.querySelectorAll('p')).toHaveLength(1);
    expect(root.querySelector('p')?.textContent).toContain('Before');
    expect(root.querySelector('p')?.textContent).toContain('after.');
    expect(root.querySelector('p .math-display .katex')).not.toBeNull();
    expect(root.querySelector('p div')).toBeNull();
  });

  it('does not confuse entity-encoded placeholder text with a generated placeholder', () => {
    const root = parseResult('&#64;BIONICMATH_0@ then $x$');
    expect(root.textContent).toContain('@BIONICMATH_0@');
    expect(root.querySelectorAll('.katex')).toHaveLength(1);
  });
});
