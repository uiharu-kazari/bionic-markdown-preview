/**
 * Math formula preprocessing and rendering using KaTeX.
 * Extracts $...$ (inline) and $$...$$ (display) math from markdown,
 * replaces them with safe placeholders, and restores them with
 * KaTeX-rendered HTML after markdown parsing.
 */

import katex from 'katex';

interface MathBlock {
  id: string;
  math: string;
  display: boolean;
}

interface ExtractResult {
  processed: string;
  mathBlocks: MathBlock[];
}

/**
 * Extract math expressions from markdown text and replace with placeholders.
 * Code blocks and inline code are protected from math extraction.
 */
export function extractMath(text: string): ExtractResult {
  const mathBlocks: MathBlock[] = [];
  let processed = text;

  // Protect code blocks and inline code from math extraction
  const codeProtections: Array<{ placeholder: string; original: string }> = [];

  // Fenced code blocks
  processed = processed.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `\x00CODEPROTECT${codeProtections.length}\x00`;
    codeProtections.push({ placeholder, original: match });
    return placeholder;
  });

  // Inline code
  processed = processed.replace(/`[^`]+`/g, (match) => {
    const placeholder = `\x00CODEPROTECT${codeProtections.length}\x00`;
    codeProtections.push({ placeholder, original: match });
    return placeholder;
  });

  // Display math: $$...$$ (must come before inline math)
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => {
    const id = `MATHBLOCK${mathBlocks.length}ENDMATH`;
    mathBlocks.push({ id, math: math.trim(), display: true });
    return id;
  });

  // Inline math: $...$ (no newlines, no leading/trailing spaces)
  processed = processed.replace(/(?<![\\$])\$(?!\s)([^\$\n]+?)(?<!\s)\$(?!\$)/g, (_match, math) => {
    const id = `MATHBLOCK${mathBlocks.length}ENDMATH`;
    mathBlocks.push({ id, math: math.trim(), display: false });
    return id;
  });

  // Restore code blocks
  for (const { placeholder, original } of codeProtections) {
    processed = processed.replace(placeholder, original);
  }

  return { processed, mathBlocks };
}

/**
 * Replace math placeholders in HTML with KaTeX-rendered HTML.
 */
export function restoreMath(html: string, mathBlocks: MathBlock[]): string {
  let result = html;

  for (const block of mathBlocks) {
    const rendered = katex.renderToString(block.math, {
      displayMode: block.display,
      throwOnError: false,
      output: 'html',
    });

    const wrapper = block.display
      ? `<div class="math-display">${rendered}</div>`
      : `<span class="math-inline">${rendered}</span>`;

    // The placeholder may be wrapped in <p> tags by markdown parser
    if (block.display) {
      result = result.replace(
        new RegExp(`<p>${block.id}</p>`),
        wrapper
      );
    }
    // Fallback: replace the placeholder directly
    result = result.replace(block.id, wrapper);
  }

  return result;
}
