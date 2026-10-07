/**
 * Markdown-aware math parsing and KaTeX rendering. Generated placeholders
 * survive Markdown sanitization and are restored only in text nodes.
 */

import katex from 'katex';
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import {
  SOURCE_CHAR_START_ATTR, SOURCE_CHAR_END_ATTR, SOURCE_TEXT_ATTR,
  SOURCE_LINE_ATTR, SOURCE_LINE_END_ATTR, createMarkdownItWithSourceMap,
} from './sourceMapping';

export interface MathBlock {
  id: string;
  math: string;
  display: boolean;
  start?: number;
  end?: number;
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
  const md = createMarkdownItWithSourceMap();
  installMathParsing(md);
  const mathBlocks: MathBlock[] = [];
  md.render(text, { mathBlocks });
  let processed = text;
  for (const block of [...mathBlocks].reverse()) {
    if (block.start !== undefined && block.end !== undefined) {
      processed = processed.slice(0, block.start) + block.id + processed.slice(block.end);
    }
  }
  return { processed, mathBlocks };
}

interface MathMatch {
  raw: string;
  math: string;
  display: boolean;
  inlinePosition?: number;
  start?: number;
  end?: number;
}

function matchMath(source: string): MathMatch | null {
  const delimiters = [
    { open: '$$', close: '$$', display: true },
    { open: '\\[', close: '\\]', display: true },
    { open: '\\(', close: '\\)', display: false },
    { open: '$', close: '$', display: false },
  ];
  for (const { open, close, display } of delimiters) {
    if (!source.startsWith(open)) continue;
    if (open === '$' && (source.startsWith('$$') || /\s/.test(source[1] ?? ''))) return null;
    let end = source.indexOf(close, open.length);
    while (end !== -1) {
      let slashes = 0;
      for (let i = end - 1; source[i] === '\\'; i--) slashes++;
      if (slashes % 2 === 0) break;
      end = source.indexOf(close, end + close.length);
    }
    if (end === -1) return null;
    const math = source.slice(open.length, end);
    if (!math.trim()) return null;
    if (open === '$' && (/\n/.test(math) || /\s$/.test(math) ||
        !/[a-zA-Z\\]/.test(math) || source[end + 1] === '$')) return null;
    return { raw: source.slice(0, end + close.length), math: math.trim(), display };
  }
  const environment = source.match(/^\\begin\{([^}]+)\}[\s\S]*?\\end\{\1\}/);
  return environment ? { raw: environment[0], math: environment[0], display: true } : null;
}

/** Parse math where Markdown permits content, leaving URLs, titles and code alone. */
export function installMathParsing(md: MarkdownIt): void {
  md.inline.ruler.before('escape', 'math', (state, silent) => {
    if (state.src[state.pos] !== '$' && state.src[state.pos] !== '\\') return false;
    const match = matchMath(state.src.slice(state.pos, state.posMax));
    if (!match) return false;
    if (!silent) {
      const token = state.push('math_inline', '', 0);
      token.content = match.math;
      token.meta = { ...match, inlinePosition: state.pos };
    }
    state.pos += match.raw.length;
    return true;
  });

  md.block.ruler.before('paragraph', 'math', (state, startLine, endLine, silent) => {
    if (state.sCount[startLine] - state.blkIndent >= 4) return false;
    const first = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine]);
    if (!first.startsWith('$$') && !first.startsWith('\\[') && !first.startsWith('\\begin{')) return false;
    const content = state.getLines(startLine, endLine, state.blkIndent, false);
    const leading = content.match(/^ */)?.[0].length ?? 0;
    const match = matchMath(content.slice(leading));
    if (!match?.display) return false;
    const tail = content.slice(leading + match.raw.length);
    if (tail.split('\n')[0].trim()) return false;
    if (silent) return true;
    const lines = match.raw.split('\n').length;
    const token = state.push('math_block', '', 0);
    token.content = match.math;
    token.meta = match;
    token.map = [startLine, startLine + lines];
    state.line = startLine + lines;
    return true;
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });

  // Record original positions from the containing inline token rather than
  // searching globally: the same formula can occur earlier in code or a URL.
  md.core.ruler.after('inline', 'math_positions', state => {
    const source = state.env.__sourceMapping?.source ?? state.src;
    const lineOffsets = [0];
    for (let i = 0; i < source.length; i++) {
      if (source[i] === '\n') lineOffsets.push(i + 1);
    }
    for (const token of state.tokens) {
      if (!['inline', 'math_block'].includes(token.type) || !token.map) continue;
      if (token.type === 'inline' && !token.children?.some(child => child.type === 'math_inline')) continue;
      const offsets: number[] = [];
      const content = token.type === 'math_block' ? (token.meta as MathMatch).raw : token.content;
      const lines = content.split('\n');
      for (let line = 0; line < lines.length; line++) {
        const start = lineOffsets[token.map[0] + line];
        if (start === undefined) break;
        const end = lineOffsets[token.map[0] + line + 1] ?? source.length;
        const original = source.slice(start, end);
        const column = original.indexOf(lines[line]);
        if (column === -1) break;
        for (let char = 0; char < lines[line].length; char++) {
          offsets.push(start + column + char);
        }
        if (line < lines.length - 1) offsets.push(end - 1);
      }
      const children = token.type === 'math_block' ? [token] : token.children ?? [];
      for (const child of children) {
        if (!['math_inline', 'math_block'].includes(child.type)) continue;
        const match = child.meta as MathMatch;
        const position = match.inlinePosition ?? 0;
        match.start = offsets[position];
        const last = offsets[position + match.raw.length - 1];
        if (last !== undefined) match.end = last + 1;
      }
    }
  });

  const renderMath = (tokens: Token[], index: number, _options: unknown, env: {
    mathBlocks?: MathBlock[];
    __sourceMapping?: { source: string; searchPosition: number; lineOffsets: number[] };
  }): string => {
    const token = tokens[index];
    const match = token.meta as MathMatch;
    const blocks = env.mathBlocks ?? (env.mathBlocks = []);
    const state = env.__sourceMapping;
    let prefix = '@BIONICMATH_';
    while (state && md.utils.unescapeAll(state.source).includes(prefix)) prefix += '_';
    const id = `${prefix}${blocks.length}@`;
    const block: MathBlock = { id, math: match.math, display: match.display };
    blocks.push(block);
    let attrs = '';
    if (state) {
      const start = match.start ?? state.source.indexOf(match.raw, state.searchPosition);
      if (start !== -1) {
        const end = match.end ?? start + match.raw.length;
        state.searchPosition = end;
        block.start = start;
        block.end = end;
        attrs = ` ${SOURCE_CHAR_START_ATTR}="${start}" ${SOURCE_CHAR_END_ATTR}="${end}" ${SOURCE_TEXT_ATTR}="${encodeURIComponent(state.source.slice(start, end))}"`;
      }
    }
    if (token.map) {
      attrs += ` ${SOURCE_LINE_ATTR}="${token.map[0]}" ${SOURCE_LINE_END_ATTR}="${token.map[1]}"`;
    }
    const tag = token.type === 'math_block' ? 'div' : 'span';
    return `<${tag}${attrs}>${id}</${tag}>`;
  };
  md.renderer.rules.math_inline = renderMath;
  md.renderer.rules.math_block = renderMath;

  // Image alt text is serialized as text by Markdown, never as math HTML.
  const renderAlt = md.renderer.renderInlineAsText.bind(md.renderer);
  md.renderer.renderInlineAsText = (tokens, options, env) => renderAlt(tokens.map(token => {
    if (token.type !== 'math_inline') return token;
    const plain = Object.assign(Object.create(Object.getPrototypeOf(token)), token) as Token;
    plain.type = 'text';
    plain.content = (token.meta as MathMatch).raw;
    return plain;
  }), options, env);
}

/** Restore generated placeholders only in text nodes, never in HTML attributes. */
export function restoreMath(html: string, mathBlocks: MathBlock[]): string {
  if (!mathBlocks.length) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks = new Map(mathBlocks.map(block => [block.id, block]));
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const text of textNodes) {
    if (text.parentElement?.closest('code, pre, script, style')) continue;
    let remaining = text.data;
    const fragment = doc.createDocumentFragment();
    let changed = false;
    while (remaining) {
      let next = -1;
      let block: MathBlock | undefined;
      for (const [id, candidate] of blocks) {
        const position = remaining.indexOf(id);
        if (position !== -1 && (next === -1 || position < next)) {
          next = position;
          block = candidate;
        }
      }
      if (!block) { fragment.append(doc.createTextNode(remaining)); break; }
      changed = true;
      fragment.append(doc.createTextNode(remaining.slice(0, next)));
      const parent = text.parentElement;
      const standalone = parent?.tagName === 'DIV' || parent?.tagName === 'BODY' ||
        (parent?.tagName === 'P' && parent.childNodes.length === 1);
      const wrapper = doc.createElement(block.display && standalone ? 'div' : 'span');
      wrapper.className = block.display ? 'math-display' : 'math-inline';
      // Only KaTeX's generated markup enters this sink. Untrusted TeX commands
      // cannot create links, images, classes, ids, or styles.
      wrapper.innerHTML = katex.renderToString(block.math, {
        displayMode: block.display,
        throwOnError: false,
        output: 'htmlAndMathml',
        trust: false,
        strict: false,
        maxExpand: 1000,
        macros: {
          '\\R': '\\mathbb{R}', '\\N': '\\mathbb{N}',
          '\\Z': '\\mathbb{Z}', '\\Q': '\\mathbb{Q}', '\\C': '\\mathbb{C}',
        },
      });
      fragment.append(wrapper);
      remaining = remaining.slice(next + block.id.length);
    }
    if (changed) {
      // Compatibility for callers supplying a bare display placeholder in a paragraph.
      const paragraph = text.parentElement;
      if (paragraph?.tagName === 'P' && paragraph.childNodes.length === 1 &&
          mathBlocks.some(block => block.display && block.id === text.data)) {
        paragraph.replaceWith(fragment);
      } else {
        text.replaceWith(fragment);
      }
    }
  }
  return doc.body.innerHTML;
}
