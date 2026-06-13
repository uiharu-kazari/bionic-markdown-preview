import { describe, it, expect } from 'vitest';
import {
  getLineFromPosition,
  getPositionForLine,
  getColumnFromPosition,
  getPreviewElementsForCharRange,
  createMarkdownItWithSourceMap,
  SOURCE_CHAR_START_ATTR,
  SOURCE_CHAR_END_ATTR,
  SOURCE_LINE_ATTR,
} from './sourceMapping';

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
