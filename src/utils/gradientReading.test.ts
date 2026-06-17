import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  applyGradientReading,
  removeGradient,
  createGradientObserver,
} from './gradientReading';
import type { GradientOptions } from '../types';

const opts = (over: Partial<GradientOptions> = {}): GradientOptions => ({
  theme: 'ocean',
  applyToHeadings: false,
  applyToLinks: false,
  ...over,
});

// jsdom has no layout engine: getBoundingClientRect returns all-zero rects,
// which the gradient code filters out (it needs width/height > 0). Lay the
// measured spans out on a single horizontal line so grouping/colouring runs.
function mockLayout() {
  let cursor = 0;
  const rects = new WeakMap<Element, DOMRect>();
  return vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: Element) {
      let rect = rects.get(this);
      if (!rect) {
        const w = Math.max(1, (this.textContent || '').length) * 8;
        const left = cursor;
        cursor += w + 4;
        rect = {
          left,
          right: left + w,
          top: 10,
          bottom: 24,
          width: w,
          height: 14,
          x: left,
          y: 10,
          toJSON: () => ({}),
        } as DOMRect;
        rects.set(this, rect);
      }
      return rect;
    });
}

describe('applyGradientReading', () => {
  let layout: ReturnType<typeof mockLayout>;
  beforeEach(() => {
    layout = mockLayout();
  });
  afterEach(() => {
    layout.mockRestore();
  });

  function root(html: string): HTMLElement {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el;
  }

  it('colours emphasized words and wraps them in gradient spans', () => {
    const el = root('<p><b>alpha beta gamma</b></p>');
    applyGradientReading(el, opts(), false);

    const words = el.querySelectorAll('[data-gradient-word]');
    expect(words.length).toBe(3);
    // each word span carries an inline colour (jsdom normalises hsl() to rgb())
    words.forEach((w) => {
      expect((w as HTMLElement).style.color).toMatch(/^(rgb|hsl)\(/);
    });
    expect(el.getAttribute('data-gradient-applied')).toBe('true');
  });

  it('only colours emphasized text, leaving plain prose untouched', () => {
    const el = root('<p>plain <b>bold</b> text</p>');
    applyGradientReading(el, opts(), false);
    const words = [...el.querySelectorAll('[data-gradient-word]')].map(
      (w) => w.textContent
    );
    expect(words).toEqual(['bold']);
  });

  it('skips code/pre even when emphasized', () => {
    const el = root('<pre><b>code()</b></pre>');
    applyGradientReading(el, opts(), false);
    expect(el.querySelectorAll('[data-gradient-word]').length).toBe(0);
  });

  it('excludes headings when applyToHeadings is false', () => {
    const el = root('<h1><b>Heading</b></h1>');
    applyGradientReading(el, opts({ applyToHeadings: false }), false);
    expect(el.querySelectorAll('[data-gradient-word]').length).toBe(0);
  });

  it('includes headings when applyToHeadings is true', () => {
    const el = root('<h1><b>Heading word</b></h1>');
    applyGradientReading(el, opts({ applyToHeadings: true }), false);
    expect(el.querySelectorAll('[data-gradient-word]').length).toBeGreaterThan(0);
  });

  it('theme "none" removes any existing gradient and applies nothing', () => {
    const el = root('<p><b>alpha beta</b></p>');
    applyGradientReading(el, opts(), false);
    expect(el.querySelectorAll('[data-gradient-word]').length).toBe(2);

    applyGradientReading(el, opts({ theme: 'none' }), false);
    expect(el.querySelectorAll('[data-gradient-word]').length).toBe(0);
    expect(el.hasAttribute('data-gradient-applied')).toBe(false);
  });

  it('re-applying updates colours in place without duplicating spans', () => {
    const el = root('<p><b>alpha beta gamma</b></p>');
    applyGradientReading(el, opts({ theme: 'ocean' }), false);
    const before = el.querySelectorAll('[data-gradient-word]').length;

    applyGradientReading(el, opts({ theme: 'sunset' }), true);
    const after = el.querySelectorAll('[data-gradient-word]').length;
    expect(after).toBe(before); // spans reused, not recreated
  });
});

describe('removeGradient', () => {
  let layout: ReturnType<typeof mockLayout>;
  beforeEach(() => {
    layout = mockLayout();
  });
  afterEach(() => layout.mockRestore());

  it('restores the original text and clears the applied marker', () => {
    const el = document.createElement('div');
    el.innerHTML = '<p><b>alpha beta</b></p>';
    const originalText = el.textContent;

    applyGradientReading(el, opts(), false);
    expect(el.querySelectorAll('[data-gradient-word]').length).toBeGreaterThan(0);

    removeGradient(el);
    expect(el.querySelectorAll('[data-gradient-word]').length).toBe(0);
    expect(el.hasAttribute('data-gradient-applied')).toBe(false);
    expect(el.textContent).toBe(originalText); // no text lost or duplicated
  });

  it('is a no-op when no gradient was applied', () => {
    const el = document.createElement('div');
    el.innerHTML = '<p>hello</p>';
    expect(() => removeGradient(el)).not.toThrow();
    expect(el.innerHTML).toBe('<p>hello</p>');
  });
});

describe('createGradientObserver', () => {
  let originalRO: typeof ResizeObserver | undefined;
  beforeEach(() => {
    originalRO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  });
  afterEach(() => {
    globalThis.ResizeObserver = originalRO as typeof ResizeObserver;
  });

  it('returns a disconnect handle that cleans up without throwing', () => {
    const el = document.createElement('div');
    const observer = createGradientObserver(el, opts(), false, 50);
    expect(typeof observer.disconnect).toBe('function');
    expect(() => observer.disconnect()).not.toThrow();
  });
});
