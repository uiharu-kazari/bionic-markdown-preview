import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createSentenceHoverController,
  SENTENCE_HOVER_HIGHLIGHT,
} from './sentenceHover';

const flushRaf = () => new Promise((r) => setTimeout(r, 20));

describe('createSentenceHoverController — unsupported environment', () => {
  // jsdom ships neither the CSS Custom Highlight API nor Highlight, so the
  // controller must degrade to a silent no-op (the documented fallback).
  it('exposes the highlight registry name', () => {
    expect(SENTENCE_HOVER_HIGHLIGHT).toBe('preview-hover-sentence');
  });

  it('returns a controller with schedule/clear that never throw', async () => {
    const ctrl = createSentenceHoverController();
    const root = document.createElement('div');
    root.innerHTML = '<p>Hello there. How are you?</p>';
    const p = root.querySelector('p')!;
    expect(() => ctrl.schedule(root, p, 5, 5)).not.toThrow();
    await flushRaf();
    expect(() => ctrl.clear()).not.toThrow();
  });
});

describe('createSentenceHoverController — supported environment', () => {
  let highlights: Map<string, unknown>;

  beforeEach(() => {
    highlights = new Map();
    // Minimal CSS Custom Highlight API polyfill
    (globalThis as unknown as { Highlight: unknown }).Highlight = class {
      ranges: Range[];
      constructor(...ranges: Range[]) {
        this.ranges = ranges;
      }
    };
    (globalThis as unknown as { CSS: unknown }).CSS = {
      highlights: {
        set: (k: string, v: unknown) => highlights.set(k, v),
        delete: (k: string) => highlights.delete(k),
        clear: () => highlights.clear(),
      },
    };
  });

  afterEach(() => {
    delete (globalThis as unknown as { Highlight?: unknown }).Highlight;
    delete (globalThis as unknown as { CSS?: unknown }).CSS;
    delete (document as unknown as { caretPositionFromPoint?: unknown })
      .caretPositionFromPoint;
  });

  function setupBlock() {
    const root = document.createElement('div');
    document.body.appendChild(root);
    root.innerHTML = '<p>First sentence here. Second sentence here.</p>';
    const p = root.querySelector('p')!;
    const textNode = p.firstChild as Text;
    return { root, p, textNode };
  }

  it('highlights the sentence under the caret', async () => {
    if (!('Segmenter' in Intl)) return; // skip if runtime lacks it
    const { root, p, textNode } = setupBlock();

    // Point the caret into the first sentence (offset within "First sentence here.")
    (document as unknown as {
      caretPositionFromPoint: (x: number, y: number) => unknown;
    }).caretPositionFromPoint = () => ({ offsetNode: textNode, offset: 3 });

    const ctrl = createSentenceHoverController();
    ctrl.schedule(root, p, 10, 10);
    await flushRaf();

    expect(highlights.has(SENTENCE_HOVER_HIGHLIGHT)).toBe(true);
    const hl = highlights.get(SENTENCE_HOVER_HIGHLIGHT) as { ranges: Range[] };
    expect(hl.ranges[0].toString()).toBe('First sentence here.');

    root.remove();
  });

  it('clear() removes the highlight', async () => {
    if (!('Segmenter' in Intl)) return;
    const { root, p, textNode } = setupBlock();
    (document as unknown as {
      caretPositionFromPoint: (x: number, y: number) => unknown;
    }).caretPositionFromPoint = () => ({ offsetNode: textNode, offset: 3 });

    const ctrl = createSentenceHoverController();
    ctrl.schedule(root, p, 10, 10);
    await flushRaf();
    expect(highlights.has(SENTENCE_HOVER_HIGHLIGHT)).toBe(true);

    ctrl.clear();
    expect(highlights.has(SENTENCE_HOVER_HIGHLIGHT)).toBe(false);
    root.remove();
  });

  it('does not highlight when the pointer is over a code block', async () => {
    if (!('Segmenter' in Intl)) return;
    const root = document.createElement('div');
    document.body.appendChild(root);
    root.innerHTML = '<pre><code>const x = 1; let y = 2;</code></pre>';
    const code = root.querySelector('code')!;
    const textNode = code.firstChild as Text;
    (document as unknown as {
      caretPositionFromPoint: (x: number, y: number) => unknown;
    }).caretPositionFromPoint = () => ({ offsetNode: textNode, offset: 3 });

    const ctrl = createSentenceHoverController();
    ctrl.schedule(root, code, 10, 10);
    await flushRaf();

    expect(highlights.has(SENTENCE_HOVER_HIGHLIGHT)).toBe(false);
    root.remove();
  });
});
