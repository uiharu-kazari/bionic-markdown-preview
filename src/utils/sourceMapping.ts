/**
 * Character-precise source mapping between Markdown source and rendered HTML.
 * Enables click-to-navigate and selection sync between editor and preview.
 */

import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

// Attribute names for source mapping
export const SOURCE_LINE_ATTR = 'data-source-line';
export const SOURCE_LINE_END_ATTR = 'data-source-line-end';
export const SOURCE_CHAR_START_ATTR = 'data-source-start';
export const SOURCE_CHAR_END_ATTR = 'data-source-end';

// CSS class for highlighted elements
export const HIGHLIGHT_CLASS = 'source-line-highlight';

/**
 * Character position mapping entry
 */
export interface CharacterMapping {
  sourceStart: number;
  sourceEnd: number;
  text: string;
}

/**
 * State for tracking character positions during rendering
 */
interface RenderState {
  source: string;
  lineOffsets: number[]; // Character offset for start of each line
  currentLineStart: number;
}

/**
 * Calculate line offsets (character position where each line starts)
 */
function calculateLineOffsets(source: string): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

/**
 * Find character offset in source for a given line and column
 */
function getCharOffset(lineOffsets: number[], line: number, col: number): number {
  if (line < 0 || line >= lineOffsets.length) return 0;
  return lineOffsets[line] + col;
}

/**
 * Creates a markdown-it instance with character-precise source mapping.
 */
export function createMarkdownItWithSourceMap(): MarkdownIt {
  const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
    typographer: true,
  });

  // Store render state in environment
  const originalRender = md.render.bind(md);
  
  md.render = function(src: string, env?: object): string {
    const renderEnv = {
      ...env,
      __sourceMapping: {
        source: src,
        lineOffsets: calculateLineOffsets(src),
        currentLineStart: 0,
      } as RenderState,
    };
    return originalRender(src, renderEnv);
  };

  // Override text rendering to include character positions
  const defaultTextRule = md.renderer.rules.text;
  md.renderer.rules.text = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const state = (env as { __sourceMapping?: RenderState }).__sourceMapping;
    
    if (state && token.content) {
      // Find position of this text in source
      const pos = findTextInSource(state, token.content, tokens, idx);
      if (pos) {
        const escaped = md.utils.escapeHtml(token.content);
        return `<span ${SOURCE_CHAR_START_ATTR}="${pos.start}" ${SOURCE_CHAR_END_ATTR}="${pos.end}">${escaped}</span>`;
      }
    }
    
    if (defaultTextRule) {
      return defaultTextRule(tokens, idx, options, env, self);
    }
    return md.utils.escapeHtml(token.content);
  };

  // Helper to inject line attributes on block elements
  function injectSourceLine(tokens: Token[], idx: number, env: object): string {
    const token = tokens[idx];
    const state = (env as { __sourceMapping?: RenderState }).__sourceMapping;
    
    let attrs = '';
    if (token.map) {
      attrs += ` ${SOURCE_LINE_ATTR}="${token.map[0]}" ${SOURCE_LINE_END_ATTR}="${token.map[1]}"`;
      
      if (state) {
        const startChar = state.lineOffsets[token.map[0]] || 0;
        const endChar = token.map[1] < state.lineOffsets.length 
          ? state.lineOffsets[token.map[1]] 
          : state.source.length;
        attrs += ` ${SOURCE_CHAR_START_ATTR}="${startChar}" ${SOURCE_CHAR_END_ATTR}="${endChar}"`;
        
        // Update current position for inline text tracking
        state.currentLineStart = startChar;
      }
    }
    return attrs;
  }

  // Block elements with source mapping
  const blockRules: Array<keyof MarkdownIt.Renderer.RenderRuleRecord> = [
    'paragraph_open', 'heading_open', 'blockquote_open',
    'bullet_list_open', 'ordered_list_open', 'list_item_open',
    'table_open',
  ];

  for (const rule of blockRules) {
    const defaultRule = md.renderer.rules[rule];
    md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
      const attrs = injectSourceLine(tokens, idx, env);
      const token = tokens[idx];
      
      if (attrs) {
        // Insert attributes into the opening tag
        const result = defaultRule 
          ? defaultRule(tokens, idx, options, env, self)
          : self.renderToken(tokens, idx, options);
        
        // Inject attributes before the closing >
        return result.replace(/>/, `${attrs}>`);
      }
      
      return defaultRule 
        ? defaultRule(tokens, idx, options, env, self)
        : self.renderToken(tokens, idx, options);
    };
  }

  // Code block with character positions
  md.renderer.rules.code_block = (tokens, idx, _options, env, _self) => {
    const token = tokens[idx];
    const state = (env as { __sourceMapping?: RenderState }).__sourceMapping;
    const content = md.utils.escapeHtml(token.content);
    
    let attrs = '';
    if (token.map) {
      attrs += ` ${SOURCE_LINE_ATTR}="${token.map[0]}" ${SOURCE_LINE_END_ATTR}="${token.map[1]}"`;
      if (state) {
        const startChar = state.lineOffsets[token.map[0]] || 0;
        const endChar = token.map[1] < state.lineOffsets.length 
          ? state.lineOffsets[token.map[1]] 
          : state.source.length;
        attrs += ` ${SOURCE_CHAR_START_ATTR}="${startChar}" ${SOURCE_CHAR_END_ATTR}="${endChar}"`;
      }
    }
    
    return `<pre${attrs}><code>${content}</code></pre>\n`;
  };

  // Fenced code block
  md.renderer.rules.fence = (tokens, idx, _options, env, _self) => {
    const token = tokens[idx];
    const state = (env as { __sourceMapping?: RenderState }).__sourceMapping;
    const content = md.utils.escapeHtml(token.content);
    const langClass = token.info ? ` class="language-${md.utils.escapeHtml(token.info)}"` : '';
    
    let attrs = '';
    if (token.map) {
      attrs += ` ${SOURCE_LINE_ATTR}="${token.map[0]}" ${SOURCE_LINE_END_ATTR}="${token.map[1]}"`;
      if (state) {
        const startChar = state.lineOffsets[token.map[0]] || 0;
        const endChar = token.map[1] < state.lineOffsets.length 
          ? state.lineOffsets[token.map[1]] 
          : state.source.length;
        attrs += ` ${SOURCE_CHAR_START_ATTR}="${startChar}" ${SOURCE_CHAR_END_ATTR}="${endChar}"`;
      }
    }
    
    return `<pre${attrs}><code${langClass}>${content}</code></pre>\n`;
  };

  // Horizontal rule
  md.renderer.rules.hr = (tokens, idx, _options, env, _self) => {
    const token = tokens[idx];
    const state = (env as { __sourceMapping?: RenderState }).__sourceMapping;
    
    let attrs = '';
    if (token.map) {
      attrs += ` ${SOURCE_LINE_ATTR}="${token.map[0]}" ${SOURCE_LINE_END_ATTR}="${token.map[1]}"`;
      if (state) {
        const startChar = state.lineOffsets[token.map[0]] || 0;
        const endChar = token.map[1] < state.lineOffsets.length 
          ? state.lineOffsets[token.map[1]] 
          : state.source.length;
        attrs += ` ${SOURCE_CHAR_START_ATTR}="${startChar}" ${SOURCE_CHAR_END_ATTR}="${endChar}"`;
      }
    }
    
    return `<hr${attrs}>\n`;
  };

  return md;
}

/**
 * Find the position of text content in the source markdown.
 * Handles markdown syntax stripping (**, *, etc.)
 */
function findTextInSource(
  state: RenderState,
  text: string,
  tokens: Token[],
  currentIdx: number
): { start: number; end: number } | null {
  // Find the parent block's line range
  let blockStart = 0;
  let blockEnd = state.source.length;
  
  // Walk backwards to find containing block
  for (let i = currentIdx - 1; i >= 0; i--) {
    if (tokens[i].map) {
      blockStart = state.lineOffsets[tokens[i].map[0]] || 0;
      blockEnd = tokens[i].map[1] < state.lineOffsets.length 
        ? state.lineOffsets[tokens[i].map[1]] 
        : state.source.length;
      break;
    }
  }

  // Search for the text in the block range
  const searchRange = state.source.substring(blockStart, blockEnd);
  
  // Try direct match first
  let idx = searchRange.indexOf(text);
  if (idx !== -1) {
    return {
      start: blockStart + idx,
      end: blockStart + idx + text.length,
    };
  }

  // Handle escaped/transformed text - search with markdown syntax stripped
  const strippedSource = stripMarkdownSyntax(searchRange);
  idx = strippedSource.text.indexOf(text);
  if (idx !== -1) {
    // Map back to original position using offset map
    const originalStart = strippedSource.offsetMap[idx] ?? idx;
    const originalEnd = strippedSource.offsetMap[idx + text.length - 1] ?? (idx + text.length - 1);
    return {
      start: blockStart + originalStart,
      end: blockStart + originalEnd + 1,
    };
  }

  // Fallback: use block range
  return {
    start: blockStart,
    end: Math.min(blockStart + text.length, blockEnd),
  };
}

/**
 * Strip markdown syntax and build offset map to original positions
 */
function stripMarkdownSyntax(text: string): { text: string; offsetMap: number[] } {
  const result: string[] = [];
  const offsetMap: number[] = [];
  
  let i = 0;
  while (i < text.length) {
    // Skip ** or __ (bold markers)
    if ((text[i] === '*' && text[i + 1] === '*') || 
        (text[i] === '_' && text[i + 1] === '_')) {
      i += 2;
      continue;
    }
    
    // Skip * or _ (italic markers) - but not in middle of word
    if ((text[i] === '*' || text[i] === '_') && 
        (i === 0 || /\s/.test(text[i - 1]) || i === text.length - 1 || /\s/.test(text[i + 1]))) {
      i++;
      continue;
    }
    
    // Skip ~~ (strikethrough)
    if (text[i] === '~' && text[i + 1] === '~') {
      i += 2;
      continue;
    }
    
    // Skip ` (inline code) - keep content
    if (text[i] === '`') {
      i++;
      continue;
    }
    
    // Skip [ ] ( ) for links - simplified
    if (text[i] === '[' || text[i] === ']' || 
        (text[i] === '(' && text[i - 1] === ']') ||
        (text[i] === ')' && result.length > 0)) {
      // For links [text](url), we want to keep 'text' but skip markers
      if (text[i] === '(' && text[i - 1] === ']') {
        // Skip until closing )
        const closeIdx = text.indexOf(')', i);
        if (closeIdx !== -1) {
          i = closeIdx + 1;
          continue;
        }
      }
      i++;
      continue;
    }
    
    // Skip # at start of line (heading markers)
    if (text[i] === '#' && (i === 0 || text[i - 1] === '\n')) {
      while (text[i] === '#' || text[i] === ' ') i++;
      continue;
    }
    
    // Skip > at start of line (blockquote)
    if (text[i] === '>' && (i === 0 || text[i - 1] === '\n')) {
      i++;
      if (text[i] === ' ') i++;
      continue;
    }
    
    // Skip - or * at start of line (list markers)
    if ((text[i] === '-' || text[i] === '*' || text[i] === '+') && 
        (i === 0 || text[i - 1] === '\n') && text[i + 1] === ' ') {
      i += 2;
      continue;
    }
    
    // Skip numbered list markers (1. 2. etc)
    if (/\d/.test(text[i]) && (i === 0 || text[i - 1] === '\n')) {
      let j = i;
      while (/\d/.test(text[j])) j++;
      if (text[j] === '.' && text[j + 1] === ' ') {
        i = j + 2;
        continue;
      }
    }
    
    // Keep this character
    offsetMap.push(i);
    result.push(text[i]);
    i++;
  }
  
  return { text: result.join(''), offsetMap };
}

/**
 * Get character position from a click event in the preview.
 * Uses caretPositionFromPoint/caretRangeFromPoint for character-precise positioning.
 */
export function getCharacterPositionFromClick(
  event: MouseEvent,
  previewRoot: Element
): { sourceStart: number; sourceEnd: number } | null {
  const x = event.clientX;
  const y = event.clientY;

  // Try to get caret position from click coordinates
  let range: Range | null = null;
  
  // Modern API (Firefox)
  if ('caretPositionFromPoint' in document) {
    const pos = (document as unknown as { caretPositionFromPoint: (x: number, y: number) => { offsetNode: Node; offset: number } | null }).caretPositionFromPoint(x, y);
    if (pos) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.setEnd(pos.offsetNode, pos.offset);
    }
  }
  // WebKit/Blink API
  else if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  }

  if (range) {
    // Find the nearest element with source position data
    let node: Node | null = range.startContainer;
    
    // If we clicked on a text node, check its parent for position data
    while (node && node !== previewRoot) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const startAttr = el.getAttribute(SOURCE_CHAR_START_ATTR);
        const endAttr = el.getAttribute(SOURCE_CHAR_END_ATTR);
        
        if (startAttr !== null && endAttr !== null) {
          const start = parseInt(startAttr, 10);
          const end = parseInt(endAttr, 10);
          
          // If we have a text node, calculate precise position within it
          if (range.startContainer.nodeType === Node.TEXT_NODE) {
            const textContent = range.startContainer.textContent || '';
            const clickOffset = range.startOffset;
            
            // Calculate proportional position in source
            const sourceLen = end - start;
            const textLen = textContent.length;
            if (textLen > 0) {
              const ratio = clickOffset / textLen;
              const precisePos = Math.round(start + (sourceLen * ratio));
              return { sourceStart: precisePos, sourceEnd: precisePos };
            }
          }
          
          return { sourceStart: start, sourceEnd: end };
        }
      }
      node = node.parentNode;
    }
  }

  // Fallback to line-based mapping
  const target = event.target as Element;
  const lineInfo = getSourceLineForElement(target);
  if (lineInfo) {
    return { sourceStart: lineInfo.charStart, sourceEnd: lineInfo.charEnd };
  }
  
  return null;
}

/**
 * Find the source line range and character range for a given preview element.
 */
export function getSourceLineForElement(element: Element): { 
  start: number; 
  end: number; 
  charStart: number;
  charEnd: number;
} | null {
  let current: Element | null = element;

  while (current) {
    const startLineAttr = current.getAttribute(SOURCE_LINE_ATTR);
    const endLineAttr = current.getAttribute(SOURCE_LINE_END_ATTR);
    const startCharAttr = current.getAttribute(SOURCE_CHAR_START_ATTR);
    const endCharAttr = current.getAttribute(SOURCE_CHAR_END_ATTR);

    if (startLineAttr !== null && endLineAttr !== null) {
      return {
        start: parseInt(startLineAttr, 10),
        end: parseInt(endLineAttr, 10),
        charStart: startCharAttr !== null ? parseInt(startCharAttr, 10) : 0,
        charEnd: endCharAttr !== null ? parseInt(endCharAttr, 10) : 0,
      };
    }

    // Also check for character-only mapping (inline spans)
    if (startCharAttr !== null && endCharAttr !== null) {
      return {
        start: 0,
        end: 0,
        charStart: parseInt(startCharAttr, 10),
        charEnd: parseInt(endCharAttr, 10),
      };
    }

    current = current.parentElement;
  }

  return null;
}

/**
 * Get the line number from a character position in text.
 */
export function getLineFromPosition(text: string, position: number): number {
  const textBefore = text.substring(0, position);
  return textBefore.split('\n').length;
}

/**
 * Get character position for the start of a line.
 */
export function getPositionForLine(text: string, lineNumber: number): number {
  const lines = text.split('\n');
  let position = 0;
  
  for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
    position += lines[i].length + 1;
  }
  
  return position;
}

/**
 * Get column number (0-indexed) within a line from character position.
 */
export function getColumnFromPosition(text: string, position: number): number {
  const textBefore = text.substring(0, position);
  const lastNewline = textBefore.lastIndexOf('\n');
  return lastNewline === -1 ? position : position - lastNewline - 1;
}

/**
 * Find preview elements that contain the given source character range.
 */
export function getPreviewElementsForCharRange(
  previewRoot: Element,
  charStart: number,
  charEnd: number
): Element[] {
  const elements = previewRoot.querySelectorAll(`[${SOURCE_CHAR_START_ATTR}]`);
  const result: Element[] = [];

  elements.forEach((el) => {
    const elStart = parseInt(el.getAttribute(SOURCE_CHAR_START_ATTR) || '-1', 10);
    const elEnd = parseInt(el.getAttribute(SOURCE_CHAR_END_ATTR) || '-1', 10);

    // Check if ranges overlap
    if (elEnd > charStart && elStart < charEnd) {
      result.push(el);
    }
  });

  // Sort by specificity (smaller range = more specific)
  result.sort((a, b) => {
    const aStart = parseInt(a.getAttribute(SOURCE_CHAR_START_ATTR) || '0', 10);
    const aEnd = parseInt(a.getAttribute(SOURCE_CHAR_END_ATTR) || '999999', 10);
    const bStart = parseInt(b.getAttribute(SOURCE_CHAR_START_ATTR) || '0', 10);
    const bEnd = parseInt(b.getAttribute(SOURCE_CHAR_END_ATTR) || '999999', 10);
    return (aEnd - aStart) - (bEnd - bStart);
  });

  return result;
}

/**
 * Scroll preview to show content at a specific character position.
 */
export function scrollPreviewToChar(
  previewRoot: Element,
  scrollContainer: Element,
  charPos: number
): Element | null {
  const elements = getPreviewElementsForCharRange(previewRoot, charPos, charPos + 1);
  
  if (elements.length > 0) {
    const element = elements[0];
    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    const scrollTop = scrollContainer.scrollTop + 
      (elementRect.top - containerRect.top) - 
      (containerRect.height / 3);
    
    scrollContainer.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    });

    return element;
  }

  return null;
}

/**
 * Add highlight to preview elements for given source character range.
 */
export function highlightPreviewCharRange(
  previewRoot: Element,
  charStart: number,
  charEnd: number
): void {
  clearPreviewHighlights(previewRoot);

  const elements = previewRoot.querySelectorAll(`[${SOURCE_CHAR_START_ATTR}]`);
  
  elements.forEach((el) => {
    const elStart = parseInt(el.getAttribute(SOURCE_CHAR_START_ATTR) || '-1', 10);
    const elEnd = parseInt(el.getAttribute(SOURCE_CHAR_END_ATTR) || '-1', 10);

    // Check if ranges overlap
    if (elEnd > charStart && elStart < charEnd) {
      el.classList.add(HIGHLIGHT_CLASS);
    }
  });
}

/**
 * Clear all preview highlights.
 */
export function clearPreviewHighlights(previewRoot: Element): void {
  previewRoot.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
}

// Legacy line-based functions for compatibility
export function getPreviewElementsForLine(
  previewRoot: Element,
  sourceLine: number
): Element[] {
  const elements = previewRoot.querySelectorAll(`[${SOURCE_LINE_ATTR}]`);
  const result: Element[] = [];

  elements.forEach((el) => {
    const startLine = parseInt(el.getAttribute(SOURCE_LINE_ATTR) || '-1', 10);
    const endLine = parseInt(el.getAttribute(SOURCE_LINE_END_ATTR) || '-1', 10);

    if (sourceLine >= startLine && sourceLine < endLine) {
      result.push(el);
    }
  });

  return result;
}
