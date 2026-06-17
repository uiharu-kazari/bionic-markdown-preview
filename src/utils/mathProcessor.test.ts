import { describe, it, expect } from 'vitest';
import { extractMath, restoreMath } from './mathProcessor';

// extractMath/restoreMath bracket the markdown pipeline: math is pulled out
// before markdown-it sees it (so `$`/`\` don't get mangled) and re-injected as
// KaTeX HTML afterwards. These lock that round-trip and its escape hatches.
describe('extractMath', () => {
  it('extracts inline $...$ math and leaves a placeholder, not the raw source', () => {
    const { processed, mathBlocks } = extractMath('value is $x + 1$ here');
    expect(mathBlocks).toHaveLength(1);
    expect(mathBlocks[0]).toMatchObject({ math: 'x + 1', display: false });
    expect(processed).not.toContain('$');
    expect(processed).toContain(mathBlocks[0].id);
  });

  it('extracts display $$...$$ math as display mode', () => {
    const { mathBlocks } = extractMath('$$\n\\int_0^1 x\\,dx\n$$');
    expect(mathBlocks).toHaveLength(1);
    expect(mathBlocks[0].display).toBe(true);
    expect(mathBlocks[0].math).toContain('\\int');
  });

  it('extracts \\[...\\] and \\(...\\) delimiters', () => {
    const display = extractMath('\\[a^2\\]');
    expect(display.mathBlocks[0]).toMatchObject({ math: 'a^2', display: true });

    const inline = extractMath('text \\(b_n\\) text');
    expect(inline.mathBlocks[0]).toMatchObject({ math: 'b_n', display: false });
  });

  it('extracts \\begin{}...\\end{} environments as display math', () => {
    const { mathBlocks } = extractMath('\\begin{matrix}a & b\\end{matrix}');
    expect(mathBlocks).toHaveLength(1);
    expect(mathBlocks[0].display).toBe(true);
    expect(mathBlocks[0].math).toContain('\\begin{matrix}');
  });

  it('does NOT treat bare $ amounts (no letters/backslash) as inline math', () => {
    const { mathBlocks, processed } = extractMath('it costs $5 and $10 total');
    expect(mathBlocks).toHaveLength(0);
    expect(processed).toBe('it costs $5 and $10 total');
  });

  it('protects fenced code blocks from math extraction', () => {
    const { mathBlocks, processed } = extractMath('```\nlet a = $x$;\n```');
    expect(mathBlocks).toHaveLength(0);
    expect(processed).toContain('$x$'); // restored verbatim inside the fence
  });

  it('protects inline code spans from math extraction', () => {
    const { mathBlocks, processed } = extractMath('use `$y$` in code');
    expect(mathBlocks).toHaveLength(0);
    expect(processed).toContain('`$y$`');
  });

  it('handles multiple math blocks with distinct ids', () => {
    const { mathBlocks } = extractMath('$a+b$ and $$c+d$$ and \\(e\\)');
    expect(mathBlocks).toHaveLength(3);
    const ids = new Set(mathBlocks.map((b) => b.id));
    expect(ids.size).toBe(3);
  });

  it('returns input unchanged when there is no math', () => {
    const { mathBlocks, processed } = extractMath('plain text only');
    expect(mathBlocks).toHaveLength(0);
    expect(processed).toBe('plain text only');
  });
});

describe('restoreMath', () => {
  it('replaces an inline placeholder with KaTeX-rendered span', () => {
    const { processed, mathBlocks } = extractMath('x is $a^2$.');
    // markdown would wrap the paragraph; simulate the placeholder surviving in HTML
    const html = restoreMath(`<p>x is ${mathBlocks[0].id}.</p>`, mathBlocks);
    expect(html).toContain('math-inline');
    expect(html).toContain('katex');
    expect(html).not.toContain(mathBlocks[0].id);
    // processed (returned for the markdown step) must not leak into restore output
    expect(processed).toContain(mathBlocks[0].id);
  });

  it('unwraps a display placeholder from its surrounding <p>', () => {
    const { mathBlocks } = extractMath('$$x^2$$');
    const html = restoreMath(`<p>${mathBlocks[0].id}</p>`, mathBlocks);
    expect(html).toContain('math-display');
    // the wrapping <p> around a display block is removed
    expect(html).not.toMatch(/<p>\s*<div class="math-display"/);
  });

  it('renders invalid LaTeX without throwing (throwOnError: false)', () => {
    const { mathBlocks } = extractMath('$\\frac{1}{$');
    expect(() => restoreMath(mathBlocks[0].id, mathBlocks)).not.toThrow();
  });

  it('is a no-op when there are no math blocks', () => {
    expect(restoreMath('<p>hello</p>', [])).toBe('<p>hello</p>');
  });

  it('full round-trip: every placeholder is resolved', () => {
    const src = 'Inline $a$ then display $$b$$.';
    const { processed, mathBlocks } = extractMath(src);
    const html = restoreMath(`<p>${processed}</p>`, mathBlocks);
    for (const block of mathBlocks) {
      expect(html).not.toContain(block.id);
    }
  });
});
