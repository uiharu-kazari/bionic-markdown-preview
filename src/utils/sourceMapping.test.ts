import { describe, it, expect } from 'vitest';
import {
  getLineFromPosition,
  getPositionForLine,
  getColumnFromPosition,
  getPreviewElementsForCharRange,
  createMarkdownItWithSourceMap,
  insertCursorAtPosition,
  removeCursor,
  applySelectionHighlight,
  removeSelectionHighlight,
  SELECTION_HIGHLIGHT_CLASS,
  SOURCE_CHAR_START_ATTR,
  SOURCE_CHAR_END_ATTR,
  SOURCE_LINE_ATTR,
} from './sourceMapping';
import { processMarkdownToBionic } from './markdownProcessor';

// These pure position helpers underpin click-to-navigate and scroll sync —
// the workflows that have repeatedly regressed. Lock the math down.
describe('source position math', () => {
  const text = 'first line\nsecond line\n\nfourth line';

  describe('getLineFromPosition', () => {
    it('returns 1-based line for a position', () => {
      expect(getLineFromPosition(text, 0)).toBe(1);
      expect(getLineFromPosition(text, 5)).toBe(1);
      expect(getLineFromPosition(text, 11)).toBe(2); // first char of "second"
      expect(getLineFromPosition(text, 23)).toBe(3); // the empty line
      expect(getLineFromPosition(text, 24)).toBe(4); // "fourth"
    });

    it('counts the newline as belonging to the line it ends', () => {
      // position 10 is the '\n' after "first line"
      expect(getLineFromPosition(text, 10)).toBe(1);
    });
  });

  describe('getPositionForLine', () => {
    it('returns the char offset of a line start (1-based line)', () => {
      expect(getPositionForLine(text, 1)).toBe(0);
      expect(getPositionForLine(text, 2)).toBe(11);
      expect(getPositionForLine(text, 4)).toBe(24);
    });

    it('round-trips with getLineFromPosition at line starts', () => {
      for (let line = 1; line <= 4; line++) {
        const pos = getPositionForLine(text, line);
        expect(getLineFromPosition(text, pos)).toBe(line);
      }
    });
  });

  describe('getColumnFromPosition', () => {
    it('returns 0-indexed column within the line', () => {
      expect(getColumnFromPosition(text, 0)).toBe(0);
      expect(getColumnFromPosition(text, 5)).toBe(5);
      expect(getColumnFromPosition(text, 11)).toBe(0); // start of line 2
      expect(getColumnFromPosition(text, 14)).toBe(3);
    });
  });
});

describe('createMarkdownItWithSourceMap', () => {
  const md = createMarkdownItWithSourceMap();

  it('annotates block elements with source line + char ranges', () => {
    const html = md.render('# Title\n\nA paragraph.');
    expect(html).toContain(SOURCE_LINE_ATTR);
    expect(html).toContain(SOURCE_CHAR_START_ATTR);
    // heading maps to source line 0
    expect(html).toMatch(/<h1[^>]*data-source-line="0"/);
  });

  it('gives inline text spans monotonically increasing char positions', () => {
    const html = md.render('alpha beta gamma');
    const starts = [...html.matchAll(/data-source-start="(\d+)"/g)].map((m) =>
      parseInt(m[1], 10)
    );
    expect(starts.length).toBeGreaterThan(0);
    const sorted = [...starts].sort((a, b) => a - b);
    expect(starts).toEqual(sorted);
  });

  it('does not throw on empty input', () => {
    expect(() => md.render('')).not.toThrow();
  });
});

describe('getPreviewElementsForCharRange', () => {
  it('selects only elements overlapping the range, most specific first', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <p ${SOURCE_CHAR_START_ATTR}="0" ${SOURCE_CHAR_END_ATTR}="100">
        <span ${SOURCE_CHAR_START_ATTR}="10" ${SOURCE_CHAR_END_ATTR}="20">x</span>
      </p>
      <p ${SOURCE_CHAR_START_ATTR}="200" ${SOURCE_CHAR_END_ATTR}="300">y</span>
    `;
    const hits = getPreviewElementsForCharRange(root, 12, 15);
    // the inner span (range 10) and the outer p (range 100) both overlap 12..15
    expect(hits.length).toBe(2);
    // sorted by specificity: smaller range first
    const first = hits[0];
    expect(first.getAttribute(SOURCE_CHAR_START_ATTR)).toBe('10');
    // the far-away paragraph is excluded
    expect(hits.some((el) => el.getAttribute(SOURCE_CHAR_START_ATTR) === '200')).toBe(false);
  });

  it('returns nothing for a range past all content', () => {
    const root = document.createElement('div');
    root.innerHTML = `<p ${SOURCE_CHAR_START_ATTR}="0" ${SOURCE_CHAR_END_ATTR}="50">z</p>`;
    expect(getPreviewElementsForCharRange(root, 999, 1000)).toEqual([]);
  });
});

// The cursor and selection highlight mutate the live preview DOM. The bug they
// caused was layout-affecting: the marker DOM lingered or text nodes were left
// split, so the preview visibly shifted. These lock the contract that every
// "selection effect" fully reverts the DOM (same text, no marker residue) — the
// data-integrity half of "selection effects must not affect layout". The pixel
// half (the caret no longer growing the line box) is covered in the e2e suite.
function bionicRoot(markdown: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = processMarkdownToBionic(markdown, {
    enabled: true,
    fixationPoint: 3,
    highlightTag: 'b',
    highlightClass: '',
  });
  return root;
}

describe('cursor insert/remove is layout-neutral', () => {
  it('inserts a single caret marker and removes it cleanly', () => {
    const root = bionicRoot('The quick brown fox jumps.');
    const before = root.textContent;

    const inserted = insertCursorAtPosition(root, 8); // inside "quick"
    expect(inserted).toBe(true);
    expect(root.querySelectorAll('.preview-cursor').length).toBe(1);
    // the caret is a content-less marker — it must not add visible characters
    expect(root.textContent).toBe(before);

    removeCursor(root);
    expect(root.querySelector('.preview-cursor')).toBeNull();
    expect(root.textContent).toBe(before);
  });

  it('removeCursor merges the text node it split (no fragmentation residue)', () => {
    const root = bionicRoot('information density');
    insertCursorAtPosition(root, 5);
    removeCursor(root);
    // round-trips back to the exact pre-cursor markup
    const fresh = bionicRoot('information density');
    expect(root.innerHTML).toBe(fresh.innerHTML);
  });

  it('removeCursor is a no-op when there is no cursor', () => {
    const root = bionicRoot('plain text');
    const html = root.innerHTML;
    expect(() => removeCursor(root)).not.toThrow();
    expect(root.innerHTML).toBe(html);
  });
});

describe('selection highlight apply/remove is layout-neutral', () => {
  it('wraps the selected range and fully unwraps it', () => {
    const root = bionicRoot('alpha beta gamma delta');
    const before = root.textContent;
    const beforeHtml = root.innerHTML;

    applySelectionHighlight(root, 6, 10); // "beta"
    expect(root.querySelectorAll(`.${SELECTION_HIGHLIGHT_CLASS}`).length).toBeGreaterThan(0);
    // highlighting only paints a background — the text content is unchanged
    expect(root.textContent).toBe(before);

    removeSelectionHighlight(root);
    expect(root.querySelectorAll(`.${SELECTION_HIGHLIGHT_CLASS}`).length).toBe(0);
    expect(root.textContent).toBe(before);
    // and the DOM is byte-for-byte what it was before the selection
    expect(root.innerHTML).toBe(beforeHtml);
  });

  it('does nothing for an empty/inverted range', () => {
    const root = bionicRoot('alpha beta');
    const html = root.innerHTML;
    applySelectionHighlight(root, 5, 5);
    expect(root.querySelectorAll(`.${SELECTION_HIGHLIGHT_CLASS}`).length).toBe(0);
    expect(root.innerHTML).toBe(html);
  });
});
