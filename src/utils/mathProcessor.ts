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

  // Fenced code blocks (backtick and tilde)
  processed = processed.replace(/(?:```|~~~)[\s\S]*?(?:```|~~~)/g, (match) => {
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

  const addMath = (math: string, display: boolean): string => {
    const id = `MATHBLOCK${mathBlocks.length}ENDMATH`;
    mathBlocks.push({ id, math: math.trim(), display });
    return id;
  };

  // Display math: \[...\]
  processed = processed.replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => addMath(math, true));

  // Display math: \begin{...}...\end{...}
  processed = processed.replace(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/g, (match) => addMath(match, true));

  // Display math: $$...$$ (must come before inline math)
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => addMath(math, true));

  // Inline math: \(...\)
  processed = processed.replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => addMath(math, false));

  // Inline math: $...$ (no newlines, no leading/trailing spaces, must contain a letter)
  processed = processed.replace(/(?<![\\$])\$(?!\s)([^$\n]*[a-zA-Z\\][^$\n]*?)(?<!\s)\$(?!\$)/g, (_, math) => addMath(math, false));

  // Restore code blocks (use function replacement to avoid $ special patterns)
  for (const { placeholder, original } of codeProtections) {
    processed = processed.replace(placeholder, () => original);
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
      trust: true,
      strict: false,
      macros: {
        '\\R': '\\mathbb{R}',
        '\\N': '\\mathbb{N}',
        '\\Z': '\\mathbb{Z}',
        '\\Q': '\\mathbb{Q}',
        '\\C': '\\mathbb{C}',
      },
    });

    const wrapper = block.display
      ? `<div class="math-display">${rendered}</div>`
      : `<span class="math-inline">${rendered}</span>`;

    // The placeholder may be wrapped in <p> tags by markdown parser
    if (block.display) {
      result = result.replace(
        new RegExp(`<p>${block.id}</p>`),
        () => wrapper
      );
    }
    // Fallback: replace the placeholder directly
    result = result.replace(block.id, () => wrapper);
  }

  return result;
}
