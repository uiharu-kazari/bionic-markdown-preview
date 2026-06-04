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
export const SOURCE_TEXT_ATTR = 'data-source-text'; // Store source text for precise mapping

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
  searchPosition: number; // Track position to find next occurrence, not first
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
function _getCharOffset(lineOffsets: number[], line: number, col: number): number {
  if (line < 0 || line >= lineOffsets.length) return 0;
  return lineOffsets[line] + col;
}
// Exported for potential future use
export { _getCharOffset as getCharOffset };

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
        searchPosition: 0, // Track position for sequential text matching
      } as RenderState,
    };
    return originalRender(src, renderEnv);
  };

  // Override text rendering to include character positions and source text
  const defaultTextRule = md.renderer.rules.text;
  md.renderer.rules.text = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const state = (env as { __sourceMapping?: RenderState }).__sourceMapping;
    
    if (state && token.content) {
      // Find position of this text in source
      const pos = findTextInSource(state, token.content, tokens, idx);
      if (pos) {
        const escaped = md.utils.escapeHtml(token.content);
        // Store the actual source text for precise character mapping
        const sourceText = state.source.substring(pos.start, pos.end);
        const encodedSourceText = encodeURIComponent(sourceText);
        return `<span ${SOURCE_CHAR_START_ATTR}="${pos.start}" ${SOURCE_CHAR_END_ATTR}="${pos.end}" ${SOURCE_TEXT_ATTR}="${encodedSourceText}">${escaped}</span>`;
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
  const blockRules = [
    'paragraph_open', 'heading_open', 'blockquote_open',
    'bullet_list_open', 'ordered_list_open', 'list_item_open',
    'table_open',
  ] as const;

  for (const rule of blockRules) {
    const defaultRule = md.renderer.rules[rule];
    md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
      const attrs = injectSourceLine(tokens, idx, env);
      
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
 * Uses sequential search position to correctly match repeated text.
 */
function findTextInSource(
  state: RenderState,
  text: string,
  _tokens: Token[],
  _currentIdx: number
): { start: number; end: number } | null {
  // Search from the current position (to handle repeated text correctly)
  const searchStart = state.searchPosition;
  const searchRange = state.source.substring(searchStart);
  
  // Try direct match first (from current position)
  let idx = searchRange.indexOf(text);
  if (idx !== -1) {
    const absoluteStart = searchStart + idx;
    const absoluteEnd = absoluteStart + text.length;
    // Advance search position past this match
    state.searchPosition = absoluteEnd;
    return {
      start: absoluteStart,
      end: absoluteEnd,
    };
  }

  // Handle escaped/transformed text - search with markdown syntax stripped
  const strippedSource = stripMarkdownSyntax(searchRange);
  idx = strippedSource.text.indexOf(text);
  if (idx !== -1) {
    // Map back to original position using offset map
    const originalStart = strippedSource.offsetMap[idx] ?? idx;
    const originalEnd = strippedSource.offsetMap[idx + text.length - 1] ?? (idx + text.length - 1);
    const absoluteStart = searchStart + originalStart;
    const absoluteEnd = searchStart + originalEnd + 1;
    // Advance search position past this match
    state.searchPosition = absoluteEnd;
    return {
      start: absoluteStart,
      end: absoluteEnd,
    };
  }

  // Fallback: use current position
  return {
    start: searchStart,
    end: Math.min(searchStart + text.length, state.source.length),
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
 * Get the source character range from the browser's current selection within the preview.
 * Returns null if selection is not within the preview or no source mapping found.
 */
export function getSelectionSourceRange(
  previewRoot: Element
): { sourceStart: number; sourceEnd: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  
  // Check if selection is within the preview
  if (!previewRoot.contains(range.commonAncestorContainer)) {
    return null;
  }

  // Find source positions for start and end of selection
  const startPos = getSourcePositionFromNode(range.startContainer, range.startOffset, previewRoot, false);
  const endPos = getSourcePositionFromNode(range.endContainer, range.endOffset, previewRoot, true);

  if (startPos === null || endPos === null) {
    return null;
  }

  // Ensure start < end
  const sourceStart = Math.min(startPos, endPos);
  const sourceEnd = Math.max(startPos, endPos);

  return { sourceStart, sourceEnd };
}

/**
 * Get source character position from a DOM node and offset within the preview.
 * Handles both text nodes and element-level selections (from bionic processing).
 * @param isEndPosition - If true, we want the end position (for selection end)
 */
function getSourcePositionFromNode(
  node: Node,
  offset: number,
  previewRoot: Element,
  isEndPosition = false
): number | null {
  // For text nodes, we have precise character offset
  if (node.nodeType === Node.TEXT_NODE) {
    return getPositionFromTextNode(node as Text, offset, previewRoot);
  }
  
  // For element nodes, offset refers to child index
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const children = el.childNodes;
    
    // Offset beyond last child - get end position of last text
    if (offset >= children.length) {
      // Find the last text node within this element
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      let lastTextNode: Text | null = null;
      while (walker.nextNode()) {
        lastTextNode = walker.currentNode as Text;
      }
      if (lastTextNode) {
        return getPositionFromTextNode(lastTextNode, lastTextNode.length, previewRoot);
      }
      // Fallback to element's end position
      const endAttr = findSourceAttribute(el, previewRoot, SOURCE_CHAR_END_ATTR);
      return endAttr !== null ? parseInt(endAttr, 10) : null;
    }
    
    // Get the child at this offset
    const targetChild = children[offset];
    if (!targetChild) return null;
    
    // For start position: find first text node within target
    // For end position: find last text node within target
    if (targetChild.nodeType === Node.TEXT_NODE) {
      const textOffset = isEndPosition ? (targetChild.textContent?.length || 0) : 0;
      return getPositionFromTextNode(targetChild as Text, textOffset, previewRoot);
    }
    
    // Target is an element - find first/last text node inside
    const walker = document.createTreeWalker(targetChild, NodeFilter.SHOW_TEXT, null);
    let textNode: Text | null = null;
    
    if (isEndPosition) {
      // Get last text node
      while (walker.nextNode()) {
        textNode = walker.currentNode as Text;
      }
      if (textNode) {
        return getPositionFromTextNode(textNode, textNode.length, previewRoot);
      }
    } else {
      // Get first text node
      if (walker.nextNode()) {
        textNode = walker.currentNode as Text;
        return getPositionFromTextNode(textNode, 0, previewRoot);
      }
    }
    
    // No text found - fall back to element's source position
    const attr = isEndPosition ? SOURCE_CHAR_END_ATTR : SOURCE_CHAR_START_ATTR;
    const pos = findSourceAttribute(targetChild as Element, previewRoot, attr);
    return pos !== null ? parseInt(pos, 10) : null;
  }
  
  return null;
}

/**
 * Find source attribute by walking up the DOM tree
 */
function findSourceAttribute(el: Element, previewRoot: Element, attr: string): string | null {
  let current: Element | null = el;
  while (current && current !== previewRoot) {
    const value = current.getAttribute(attr);
    if (value !== null) return value;
    current = current.parentElement;
  }
  return null;
}

/**
 * Get source position from a text node and character offset.
 * Handles bionic-processed text where the original text is split into multiple nodes.
 */
function getPositionFromTextNode(
  textNode: Text,
  charOffset: number,
  previewRoot: Element
): number | null {
  // Find nearest element with source position data
  let sourceElement: Element | null = null;
  let current: Node | null = textNode;
  
  while (current && current !== previewRoot) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as Element;
      const startAttr = el.getAttribute(SOURCE_CHAR_START_ATTR);
      
      if (startAttr !== null) {
        sourceElement = el;
        break;
      }
    }
    current = current.parentNode;
  }
  
  if (!sourceElement) return null;
  
  const startAttr = sourceElement.getAttribute(SOURCE_CHAR_START_ATTR);
  const endAttr = sourceElement.getAttribute(SOURCE_CHAR_END_ATTR);
  const sourceTextAttr = sourceElement.getAttribute(SOURCE_TEXT_ATTR);
  
  if (startAttr === null || endAttr === null) return null;
  
  const start = parseInt(startAttr, 10);
  const end = parseInt(endAttr, 10);
  
  // Calculate cumulative offset: how many characters come before this text node
  // within the source-mapped element
  let cumulativeOffset = 0;
  const walker = document.createTreeWalker(sourceElement, NodeFilter.SHOW_TEXT, null);
  
  while (walker.nextNode()) {
    if (walker.currentNode === textNode) {
      // Found our text node - add the character offset within it
      cumulativeOffset += charOffset;
      break;
    }
    // Add length of preceding text nodes
    cumulativeOffset += walker.currentNode.textContent?.length || 0;
  }
  
  // Now map the cumulative display offset to source offset
  if (sourceTextAttr) {
    const sourceText = decodeURIComponent(sourceTextAttr);
    // Get full display text by concatenating all text nodes
    const fullDisplayText = sourceElement.textContent || '';
    const displayToSourceMap = buildDisplayToSourceMap(sourceText, fullDisplayText);
    const sourceOffset = displayToSourceMap[Math.min(cumulativeOffset, displayToSourceMap.length - 1)] ?? cumulativeOffset;
    return start + sourceOffset;
  }
  
  // Fallback to proportional calculation using cumulative offset
  const fullDisplayLen = sourceElement.textContent?.length || 0;
  const sourceLen = end - start;
  
  if (fullDisplayLen > 0) {
    const ratio = cumulativeOffset / fullDisplayLen;
    return Math.round(start + (sourceLen * ratio));
  }
  
  return cumulativeOffset === 0 ? start : end;
}

/**
 * Build a mapping from display text positions to source text positions.
 * This accounts for markdown syntax that gets stripped during rendering.
 */
function buildDisplayToSourceMap(sourceText: string, displayText: string): number[] {
  const map: number[] = [];
  
  let sourceIdx = 0;
  let displayIdx = 0;
  
  while (displayIdx < displayText.length && sourceIdx < sourceText.length) {
    // Skip markdown syntax in source
    // Bold markers: ** or __
    if ((sourceText[sourceIdx] === '*' && sourceText[sourceIdx + 1] === '*') ||
        (sourceText[sourceIdx] === '_' && sourceText[sourceIdx + 1] === '_')) {
      sourceIdx += 2;
      continue;
    }
    
    // Italic markers: * or _ (at word boundaries)
    if ((sourceText[sourceIdx] === '*' || sourceText[sourceIdx] === '_') &&
        (sourceIdx === 0 || /[\s\n]/.test(sourceText[sourceIdx - 1]) || 
         sourceIdx === sourceText.length - 1 || /[\s\n]/.test(sourceText[sourceIdx + 1]) ||
         sourceText[sourceIdx - 1] === '*' || sourceText[sourceIdx - 1] === '_')) {
      sourceIdx++;
      continue;
    }
    
    // Strikethrough: ~~
    if (sourceText[sourceIdx] === '~' && sourceText[sourceIdx + 1] === '~') {
      sourceIdx += 2;
      continue;
    }
    
    // Inline code backticks
    if (sourceText[sourceIdx] === '`') {
      sourceIdx++;
      continue;
    }
    
    // If characters match, record the mapping
    if (sourceText[sourceIdx] === displayText[displayIdx]) {
      map[displayIdx] = sourceIdx;
      sourceIdx++;
      displayIdx++;
    } else {
      // Characters don't match - skip source character (likely markdown syntax)
      sourceIdx++;
    }
  }
  
  // Fill remaining with last known position
  const lastSourcePos = sourceIdx > 0 ? sourceIdx : 0;
  while (map.length < displayText.length) {
    map.push(lastSourcePos);
  }
  // Add one more for "after last character" position
  map.push(Math.min(lastSourcePos + 1, sourceText.length));
  
  return map;
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
  else if ('caretRangeFromPoint' in document) {
    const caretRange = (document as unknown as { caretRangeFromPoint: (x: number, y: number) => Range | null }).caretRangeFromPoint(x, y);
    if (caretRange) {
      range = caretRange;
    }
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
        const sourceTextAttr = el.getAttribute(SOURCE_TEXT_ATTR);
        
        if (startAttr !== null && endAttr !== null) {
          const start = parseInt(startAttr, 10);
          const end = parseInt(endAttr, 10);
          
          // If we have a text node, calculate precise position within it
          if (range.startContainer.nodeType === Node.TEXT_NODE) {
            const displayText = range.startContainer.textContent || '';
            const clickOffset = range.startOffset;
            
            // Use precise mapping if source text is available
            if (sourceTextAttr) {
              const sourceText = decodeURIComponent(sourceTextAttr);
              const displayToSourceMap = buildDisplayToSourceMap(sourceText, displayText);
              
              // Get the exact source position for this click offset
              const sourceOffset = displayToSourceMap[Math.min(clickOffset, displayToSourceMap.length - 1)] ?? clickOffset;
              const precisePos = start + sourceOffset;
              return { sourceStart: precisePos, sourceEnd: precisePos };
            }
            
            // Fallback to proportional calculation if no source text stored
            // Calculate proportional position in source
            const sourceLen = end - start;
            const textLen = displayText.length;
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

/**
 * Find the preview element and its Y offset for a given source character position.
 * Returns the element and how far into the element the position is (as a ratio 0-1).
 */
export function findPreviewElementForChar(
  previewRoot: Element,
  charPos: number
): { element: Element; ratio: number } | null {
  const elements = previewRoot.querySelectorAll(`[${SOURCE_CHAR_START_ATTR}]`);
  let bestElement: Element | null = null;
  let bestRatio = 0;
  let bestRange = Infinity;

  elements.forEach((el) => {
    const elStart = parseInt(el.getAttribute(SOURCE_CHAR_START_ATTR) || '-1', 10);
    const elEnd = parseInt(el.getAttribute(SOURCE_CHAR_END_ATTR) || '-1', 10);

    if (elStart === -1 || elEnd === -1) return;
    if (charPos < elStart || charPos > elEnd) return;

    const range = elEnd - elStart;
    
    // Prefer elements that contain the position and have smaller ranges (more specific)
    if (range < bestRange) {
      bestRange = range;
      bestElement = el;
      // Calculate how far into this element the position is (0-1)
      bestRatio = range > 0 ? (charPos - elStart) / range : 0;
    }
  });

  if (!bestElement) {
    // Try to find the closest block-level element
    const blockElements = previewRoot.querySelectorAll(`[${SOURCE_LINE_ATTR}]`);
    blockElements.forEach((el) => {
      const elStart = parseInt(el.getAttribute(SOURCE_CHAR_START_ATTR) || '-1', 10);
      const elEnd = parseInt(el.getAttribute(SOURCE_CHAR_END_ATTR) || '-1', 10);

      if (elStart === -1 || elEnd === -1) return;
      if (charPos < elStart || charPos > elEnd) return;

      const range = elEnd - elStart;
      if (range < bestRange) {
        bestRange = range;
        bestElement = el;
        bestRatio = range > 0 ? (charPos - elStart) / range : 0;
      }
    });
  }

  return bestElement ? { element: bestElement, ratio: bestRatio } : null;
}

/**
 * Calculate the Y position in the preview for a given source character position.
 * Returns the scroll position that would place that content at the top of viewport.
 */
export function getPreviewScrollForChar(
  previewRoot: Element,
  scrollContainer: Element,
  charPos: number
): number | null {
  const result = findPreviewElementForChar(previewRoot, charPos);
  if (!result) return null;

  const { element, ratio } = result;
  const containerRect = scrollContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  // Calculate offset within the element based on ratio
  const elementOffset = ratio * elementRect.height;

  // Calculate the scroll position to align this point with the top of the viewport
  const scrollTop = scrollContainer.scrollTop + 
    (elementRect.top - containerRect.top) + 
    elementOffset;

  return Math.max(0, scrollTop);
}

/**
 * Calculate the character position that corresponds to the top of the visible editor area.
 * Takes into account text wrapping.
 */
export function getCharAtEditorTop(
  textarea: HTMLTextAreaElement,
  lineHeights: number[]
): number {
  const text = textarea.value;
  const lines = text.split('\n');
  const scrollTop = textarea.scrollTop;
  
  // If we have calculated line heights, use them for accurate positioning
  if (lineHeights.length > 0) {
    let accumulatedHeight = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const lineHeight = lineHeights[i] || 0;
      
      if (accumulatedHeight + lineHeight > scrollTop) {
        // This line is at the top of the viewport
        // Calculate character position for start of this line
        let charPos = 0;
        for (let j = 0; j < i; j++) {
          charPos += lines[j].length + 1; // +1 for newline
        }
        
        // Add partial line offset if scrolled partway through the line
        const lineProgress = (scrollTop - accumulatedHeight) / lineHeight;
        const lineCharOffset = Math.floor(lineProgress * lines[i].length);
        
        return charPos + lineCharOffset;
      }
      
      accumulatedHeight += lineHeight;
    }
    
    // Scrolled past all content
    return text.length;
  }
  
  // Fallback: use simple line height calculation
  const computedStyle = getComputedStyle(textarea);
  const lineHeight = parseFloat(computedStyle.lineHeight) || 
                     parseFloat(computedStyle.fontSize) * 1.6;
  
  const lineIndex = Math.floor(scrollTop / lineHeight);
  
  // Calculate character position for this line
  let charPos = 0;
  for (let i = 0; i < lineIndex && i < lines.length; i++) {
    charPos += lines[i].length + 1;
  }
  
  return charPos;
}

/**
 * Calculate the editor scroll position for a given character position.
 * Takes into account text wrapping.
 */
export function getEditorScrollForChar(
  textarea: HTMLTextAreaElement,
  charPos: number,
  lineHeights: number[]
): number {
  const text = textarea.value;
  const lines = text.split('\n');
  
  // Find which line this character is on
  let currentPos = 0;
  let targetLineIndex = 0;
  let charOffsetInLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1; // +1 for newline
    if (currentPos + lineLength > charPos) {
      targetLineIndex = i;
      charOffsetInLine = charPos - currentPos;
      break;
    }
    currentPos += lineLength;
    targetLineIndex = i;
  }
  
  // Calculate scroll position
  if (lineHeights.length > 0) {
    let scrollTop = 0;
    
    for (let i = 0; i < targetLineIndex; i++) {
      scrollTop += lineHeights[i] || 0;
    }
    
    // Add partial line offset
    const lineHeight = lineHeights[targetLineIndex] || 0;
    const lineLength = lines[targetLineIndex]?.length || 1;
    const lineProgress = charOffsetInLine / lineLength;
    scrollTop += lineProgress * lineHeight;
    
    return Math.max(0, scrollTop);
  }
  
  // Fallback: simple line height calculation
  const computedStyle = getComputedStyle(textarea);
  const lineHeight = parseFloat(computedStyle.lineHeight) || 
                     parseFloat(computedStyle.fontSize) * 1.6;
  
  return Math.max(0, targetLineIndex * lineHeight);
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

// Cursor element ID for cleanup
export const CURSOR_ELEMENT_ID = 'preview-cursor-marker';

/**
 * Insert a blinking cursor element at the precise character position in the preview.
 * Returns true if cursor was successfully inserted.
 * 
 * Note: Only shows cursor when position is INSIDE actual text content.
 * Empty lines and positions between blocks won't show a cursor (architectural limitation).
 */
export function insertCursorAtPosition(
  previewRoot: Element,
  sourceCharPos: number
): boolean {
  // Remove any existing cursor
  removeCursor(previewRoot);

  // Find ONLY inline text spans (not block elements) containing this position
  // Block elements have ranges that include structural whitespace, causing misplacement
  const textSpans = previewRoot.querySelectorAll(`span[${SOURCE_CHAR_START_ATTR}]`);
  let targetElement: Element | null = null;
  let targetStart = 0;
  let targetEnd = 0;

  // Find text span where cursor is STRICTLY INSIDE (not at boundaries)
  let bestScore = -Infinity;
  
  textSpans.forEach((el) => {
    const elStart = parseInt(el.getAttribute(SOURCE_CHAR_START_ATTR) || '-1', 10);
    const elEnd = parseInt(el.getAttribute(SOURCE_CHAR_END_ATTR) || '-1', 10);
    
    if (elStart === -1 || elEnd === -1) return;
    if (elEnd <= elStart) return; // Skip empty spans

    // Check if cursor is INSIDE this text span (not just at boundary)
    if (sourceCharPos >= elStart && sourceCharPos <= elEnd) {
      const range = elEnd - elStart;
      
      // Calculate score: prefer smaller (more specific) spans
      let score = 1000 / Math.max(1, range);
      
      // Strong preference for cursor being inside, not at exact boundaries
      if (sourceCharPos > elStart && sourceCharPos < elEnd) {
        score += 200; // Strictly inside - best case
      } else if (sourceCharPos === elEnd && range > 0) {
        score += 50; // At end - acceptable
      } else if (sourceCharPos === elStart) {
        // At very start - only use if nothing better
        score -= 100;
      }
      
      if (score > bestScore) {
        bestScore = score;
        targetElement = el;
        targetStart = elStart;
        targetEnd = elEnd;
      }
    }
  });

  // If no text span found, cursor is at unmapped position (empty line, between blocks)
  // Don't show cursor - this is an architectural limitation
  if (!targetElement) return false;

  // Now we know targetElement is definitely Element (not null)
  const element = targetElement as Element;

  // Calculate the offset within this element's text
  const sourceOffset = sourceCharPos - targetStart;
  const sourceLength = targetEnd - targetStart;
  
  // Special case: cursor at end of element - place after last text
  const cursorAtEnd = sourceCharPos === targetEnd;
  
  // Walk through text nodes to find where to insert cursor
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentOffset = 0;
  let textNode: Text | null = null;
  let lastTextNode: Text | null = null;
  let insertOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLength = node.textContent?.length || 0;
    lastTextNode = node;
    
    // Calculate proportional position
    const nodeStartRatio = currentOffset / Math.max(1, sourceLength);
    const nodeEndRatio = (currentOffset + nodeLength) / Math.max(1, sourceLength);
    const targetRatio = sourceOffset / Math.max(1, sourceLength);

    if (targetRatio >= nodeStartRatio && targetRatio <= nodeEndRatio) {
      textNode = node;
      // Calculate offset within this text node
      const relativeRatio = (targetRatio - nodeStartRatio) / Math.max(0.001, nodeEndRatio - nodeStartRatio);
      insertOffset = Math.round(relativeRatio * nodeLength);
      break;
    }
    
    currentOffset += nodeLength;
  }

  // If cursor is at end and no text node matched, use last text node at its end
  if (!textNode && cursorAtEnd && lastTextNode) {
    textNode = lastTextNode;
    insertOffset = lastTextNode.textContent?.length || 0;
  }

  // If no text node found, try to append to the element
  if (!textNode) {
    const firstTextNode = element.firstChild;
    if (firstTextNode && firstTextNode.nodeType === Node.TEXT_NODE) {
      textNode = firstTextNode as Text;
      insertOffset = cursorAtEnd ? (firstTextNode.textContent?.length || 0) : 0;
    } else {
      // Create cursor at the start/end of the element
      const cursor = createCursorElement();
      if (cursorAtEnd) {
        element.appendChild(cursor);
      } else {
        element.insertBefore(cursor, element.firstChild);
      }
      return true;
    }
  }

  // Split text node and insert cursor
  if (textNode && textNode.parentNode) {
    const cursor = createCursorElement();
    
    if (insertOffset === 0) {
      textNode.parentNode.insertBefore(cursor, textNode);
    } else if (insertOffset >= (textNode.textContent?.length || 0)) {
      textNode.parentNode.insertBefore(cursor, textNode.nextSibling);
    } else {
      // Split the text node
      const afterText = textNode.splitText(insertOffset);
      textNode.parentNode.insertBefore(cursor, afterText);
    }
    
    return true;
  }

  return false;
}

/**
 * Create the cursor element
 */
function createCursorElement(): HTMLElement {
  const cursor = document.createElement('span');
  cursor.id = CURSOR_ELEMENT_ID;
  cursor.className = 'preview-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  return cursor;
}

/**
 * Remove the cursor element from preview
 */
export function removeCursor(previewRoot: Element): void {
  const existing = previewRoot.querySelector(`#${CURSOR_ELEMENT_ID}`);
  if (existing) {
    // If cursor split a text node, merge them back
    const prev = existing.previousSibling;
    const next = existing.nextSibling;
    
    existing.remove();
    
    // Merge adjacent text nodes
    if (prev && next && 
        prev.nodeType === Node.TEXT_NODE && 
        next.nodeType === Node.TEXT_NODE) {
      (prev as Text).textContent += (next as Text).textContent || '';
      next.parentNode?.removeChild(next);
    }
  }
}

// Selection highlight class
export const SELECTION_HIGHLIGHT_CLASS = 'preview-selection-highlight';

/**
 * Apply character-level selection highlighting to the preview.
 * Wraps the selected characters in highlight spans.
 */
export function applySelectionHighlight(
  previewRoot: Element,
  sourceStart: number,
  sourceEnd: number
): void {
  // First, remove any existing selection highlights
  removeSelectionHighlight(previewRoot);
  
  if (sourceStart >= sourceEnd) return;

  // Find all spans with source mapping that overlap the selection
  const elements = previewRoot.querySelectorAll(`[${SOURCE_CHAR_START_ATTR}]`);
  
  elements.forEach((el) => {
    const elStart = parseInt(el.getAttribute(SOURCE_CHAR_START_ATTR) || '-1', 10);
    const elEnd = parseInt(el.getAttribute(SOURCE_CHAR_END_ATTR) || '-1', 10);
    
    if (elStart === -1 || elEnd === -1) return;
    
    // Check if this element overlaps with the selection
    if (elEnd <= sourceStart || elStart >= sourceEnd) return;
    
    // Calculate the overlap
    const overlapStart = Math.max(sourceStart, elStart);
    const overlapEnd = Math.min(sourceEnd, elEnd);
    
    // Calculate proportional positions within this element
    const elLength = elEnd - elStart;
    const startRatio = (overlapStart - elStart) / elLength;
    const endRatio = (overlapEnd - elStart) / elLength;
    
    // Apply highlighting to this element's text nodes
    highlightTextNodesInElement(el, startRatio, endRatio);
  });
}

/**
 * Highlight text nodes within an element based on proportional positions
 */
function highlightTextNodesInElement(
  element: Element,
  startRatio: number,
  endRatio: number
): void {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  let totalLength = 0;
  
  // Collect all text nodes and total length
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    textNodes.push(node);
    totalLength += node.textContent?.length || 0;
  }
  
  if (totalLength === 0) return;
  
  // Calculate character positions
  const startChar = Math.floor(startRatio * totalLength);
  const endChar = Math.ceil(endRatio * totalLength);
  
  let currentPos = 0;
  
  for (const textNode of textNodes) {
    const nodeLength = textNode.textContent?.length || 0;
    const nodeStart = currentPos;
    const nodeEnd = currentPos + nodeLength;
    
    // Check if this text node overlaps with selection
    if (nodeEnd <= startChar || nodeStart >= endChar) {
      currentPos = nodeEnd;
      continue;
    }
    
    // Calculate overlap within this text node
    const highlightStart = Math.max(0, startChar - nodeStart);
    const highlightEnd = Math.min(nodeLength, endChar - nodeStart);
    
    // Wrap the highlighted portion
    wrapTextRange(textNode, highlightStart, highlightEnd);
    
    currentPos = nodeEnd;
  }
}

/**
 * Wrap a range of text in a highlight span
 */
function wrapTextRange(textNode: Text, start: number, end: number): void {
  const text = textNode.textContent || '';
  const parent = textNode.parentNode;
  
  if (!parent || start >= end || start < 0 || end > text.length) return;
  
  // Don't re-highlight already highlighted text
  if (parent instanceof Element && parent.classList.contains(SELECTION_HIGHLIGHT_CLASS)) {
    return;
  }
  
  const beforeText = text.substring(0, start);
  const highlightText = text.substring(start, end);
  const afterText = text.substring(end);
  
  const fragment = document.createDocumentFragment();
  
  if (beforeText) {
    fragment.appendChild(document.createTextNode(beforeText));
  }
  
  const highlightSpan = document.createElement('span');
  highlightSpan.className = SELECTION_HIGHLIGHT_CLASS;
  highlightSpan.textContent = highlightText;
  fragment.appendChild(highlightSpan);
  
  if (afterText) {
    fragment.appendChild(document.createTextNode(afterText));
  }
  
  parent.replaceChild(fragment, textNode);
}

/**
 * Remove all selection highlighting from preview
 */
export function removeSelectionHighlight(previewRoot: Element): void {
  const highlights = previewRoot.querySelectorAll(`.${SELECTION_HIGHLIGHT_CLASS}`);
  
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (!parent) return;
    
    // Replace highlight span with its text content
    const textNode = document.createTextNode(highlight.textContent || '');
    parent.replaceChild(textNode, highlight);
    
    // Normalize to merge adjacent text nodes
    parent.normalize();
  });
}
