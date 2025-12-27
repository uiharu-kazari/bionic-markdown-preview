/**
 * Source line mapping between Markdown source and rendered HTML.
 * Enables click-to-navigate and selection sync between editor and preview.
 */

import MarkdownIt from 'markdown-it';

// Attribute name for source line mapping
export const SOURCE_LINE_ATTR = 'data-source-line';
export const SOURCE_LINE_END_ATTR = 'data-source-line-end';

/**
 * Creates a markdown-it instance with source line injection enabled.
 * Block-level elements will have data-source-line and data-source-line-end attributes.
 */
export function createMarkdownItWithSourceMap(): MarkdownIt {
  const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
    typographer: true,
  });

  // Inject source line attributes into block-level tokens
  const defaultRender = md.renderer.rules.paragraph_open || defaultRenderer;
  const defaultHeadingOpen = md.renderer.rules.heading_open || defaultRenderer;
  const defaultBlockquoteOpen = md.renderer.rules.blockquote_open || defaultRenderer;
  const defaultBulletListOpen = md.renderer.rules.bullet_list_open || defaultRenderer;
  const defaultOrderedListOpen = md.renderer.rules.ordered_list_open || defaultRenderer;
  const defaultListItemOpen = md.renderer.rules.list_item_open || defaultRenderer;
  const defaultCodeBlock = md.renderer.rules.code_block || defaultCodeRenderer;
  const defaultFence = md.renderer.rules.fence || defaultCodeRenderer;
  const defaultHr = md.renderer.rules.hr || defaultRenderer;
  const defaultTableOpen = md.renderer.rules.table_open || defaultRenderer;

  function defaultRenderer(tokens: MarkdownIt.Token[], idx: number, options: MarkdownIt.Options, _env: unknown, self: MarkdownIt.Renderer): string {
    return self.renderToken(tokens, idx, options);
  }

  function defaultCodeRenderer(tokens: MarkdownIt.Token[], idx: number, options: MarkdownIt.Options, _env: unknown, self: MarkdownIt.Renderer): string {
    return self.renderToken(tokens, idx, options);
  }

  function injectSourceLine(tokens: MarkdownIt.Token[], idx: number): void {
    const token = tokens[idx];
    if (token.map) {
      token.attrSet(SOURCE_LINE_ATTR, String(token.map[0]));
      token.attrSet(SOURCE_LINE_END_ATTR, String(token.map[1]));
    }
  }

  // Paragraph
  md.renderer.rules.paragraph_open = (tokens, idx, options, env, self) => {
    injectSourceLine(tokens, idx);
    return defaultRender(tokens, idx, options, env, self);
  };

  // Headings
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    injectSourceLine(tokens, idx);
    return defaultHeadingOpen(tokens, idx, options, env, self);
  };

  // Blockquote
  md.renderer.rules.blockquote_open = (tokens, idx, options, env, self) => {
    injectSourceLine(tokens, idx);
    return defaultBlockquoteOpen(tokens, idx, options, env, self);
  };

  // Bullet list
  md.renderer.rules.bullet_list_open = (tokens, idx, options, env, self) => {
    injectSourceLine(tokens, idx);
    return defaultBulletListOpen(tokens, idx, options, env, self);
  };

  // Ordered list
  md.renderer.rules.ordered_list_open = (tokens, idx, options, env, self) => {
    injectSourceLine(tokens, idx);
    return defaultOrderedListOpen(tokens, idx, options, env, self);
  };

  // List item
  md.renderer.rules.list_item_open = (tokens, idx, options, env, self) => {
    injectSourceLine(tokens, idx);
    return defaultListItemOpen(tokens, idx, options, env, self);
  };

  // Code block
  md.renderer.rules.code_block = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.map) {
      const lineAttr = ` ${SOURCE_LINE_ATTR}="${token.map[0]}" ${SOURCE_LINE_END_ATTR}="${token.map[1]}"`;
      const content = md.utils.escapeHtml(token.content);
      return `<pre${lineAttr}><code>${content}</code></pre>\n`;
    }
    return defaultCodeBlock(tokens, idx, options, env, self);
  };

  // Fenced code block
  md.renderer.rules.fence = (tokens, idx, _options, _env, _self) => {
    const token = tokens[idx];
    const content = md.utils.escapeHtml(token.content);
    const langClass = token.info ? ` class="language-${md.utils.escapeHtml(token.info)}"` : '';
    const lineAttr = token.map ? ` ${SOURCE_LINE_ATTR}="${token.map[0]}" ${SOURCE_LINE_END_ATTR}="${token.map[1]}"` : '';
    return `<pre${lineAttr}><code${langClass}>${content}</code></pre>\n`;
  };

  // Horizontal rule
  md.renderer.rules.hr = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.map) {
      return `<hr ${SOURCE_LINE_ATTR}="${token.map[0]}" ${SOURCE_LINE_END_ATTR}="${token.map[1]}">\n`;
    }
    return defaultHr(tokens, idx, options, env, self);
  };

  // Table
  md.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    injectSourceLine(tokens, idx);
    return defaultTableOpen(tokens, idx, options, env, self);
  };

  return md;
}

/**
 * Find all preview elements that correspond to a given source line.
 */
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

/**
 * Find the source line range for a given preview element.
 */
export function getSourceLineForElement(element: Element): { start: number; end: number } | null {
  // Walk up the tree to find an element with source line info
  let current: Element | null = element;

  while (current) {
    const startAttr = current.getAttribute(SOURCE_LINE_ATTR);
    const endAttr = current.getAttribute(SOURCE_LINE_END_ATTR);

    if (startAttr !== null && endAttr !== null) {
      return {
        start: parseInt(startAttr, 10),
        end: parseInt(endAttr, 10),
      };
    }

    current = current.parentElement;
  }

  return null;
}

/**
 * Get the first preview element for a source line (for scrolling).
 */
export function getFirstPreviewElementForLine(
  previewRoot: Element,
  sourceLine: number
): Element | null {
  const elements = getPreviewElementsForLine(previewRoot, sourceLine);
  
  // Return the most specific (deepest nested) element
  if (elements.length === 0) return null;
  
  // Sort by specificity: elements with closest line range first
  elements.sort((a, b) => {
    const aStart = parseInt(a.getAttribute(SOURCE_LINE_ATTR) || '0', 10);
    const aEnd = parseInt(a.getAttribute(SOURCE_LINE_END_ATTR) || '999999', 10);
    const bStart = parseInt(b.getAttribute(SOURCE_LINE_ATTR) || '0', 10);
    const bEnd = parseInt(b.getAttribute(SOURCE_LINE_END_ATTR) || '999999', 10);
    
    const aRange = aEnd - aStart;
    const bRange = bEnd - bStart;
    
    // Prefer smaller ranges (more specific)
    if (aRange !== bRange) return aRange - bRange;
    
    // If same range, prefer closer start line
    return Math.abs(aStart - sourceLine) - Math.abs(bStart - sourceLine);
  });

  return elements[0];
}

/**
 * Scroll preview to show a specific source line.
 */
export function scrollPreviewToLine(
  previewRoot: Element,
  scrollContainer: Element,
  sourceLine: number
): void {
  const element = getFirstPreviewElementForLine(previewRoot, sourceLine);
  
  if (element) {
    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // Calculate scroll position to center the element
    const scrollTop = scrollContainer.scrollTop + 
      (elementRect.top - containerRect.top) - 
      (containerRect.height / 3);
    
    scrollContainer.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    });
  }
}

/**
 * Scroll editor textarea to show a specific line.
 */
export function scrollEditorToLine(
  textarea: HTMLTextAreaElement,
  lineNumber: number,
  lineHeight: number
): void {
  const scrollTop = (lineNumber - 1) * lineHeight * parseFloat(getComputedStyle(textarea).fontSize);
  
  textarea.scrollTo({
    top: Math.max(0, scrollTop - textarea.clientHeight / 3),
    behavior: 'smooth',
  });

  // Also set cursor position
  const lines = textarea.value.split('\n');
  let charIndex = 0;
  for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
    charIndex += lines[i].length + 1; // +1 for newline
  }
  
  textarea.focus();
  textarea.setSelectionRange(charIndex, charIndex);
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
    position += lines[i].length + 1; // +1 for newline
  }
  
  return position;
}

// CSS class for highlighted elements
export const HIGHLIGHT_CLASS = 'source-line-highlight';

/**
 * Add highlight to preview elements for given source lines.
 */
export function highlightPreviewLines(
  previewRoot: Element,
  startLine: number,
  endLine: number
): void {
  // Remove existing highlights
  clearPreviewHighlights(previewRoot);

  // Add highlights to matching elements
  const elements = previewRoot.querySelectorAll(`[${SOURCE_LINE_ATTR}]`);
  
  elements.forEach((el) => {
    const elStart = parseInt(el.getAttribute(SOURCE_LINE_ATTR) || '-1', 10);
    const elEnd = parseInt(el.getAttribute(SOURCE_LINE_END_ATTR) || '-1', 10);

    // Check if this element overlaps with the selection
    if (elEnd > startLine && elStart < endLine) {
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
