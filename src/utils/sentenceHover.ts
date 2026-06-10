/**
 * Sentence-level hover highlighting for the preview pane.
 *
 * Uses the CSS Custom Highlight API so highlighting never mutates the DOM
 * (DOM mutation under the pointer is what caused click-position drift), and
 * Intl.Segmenter for locale-aware sentence boundaries. Both are feature
 * detected; unsupported browsers simply get no hover highlight.
 */

// Name registered in CSS.highlights; styled via ::highlight(<name>)
export const SENTENCE_HOVER_HIGHLIGHT = 'preview-hover-sentence';

// Blocks whose text is segmented into sentences. Code blocks are excluded.
const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th, dt, dd';

interface TextNodeEntry {
  node: Text;
  start: number; // offset of this node's first char in the block's full text
  end: number;
}

interface SentenceSegmenter {
  segment(text: string): Iterable<{ segment: string; index: number }>;
}

function getSegmenter(): SentenceSegmenter | null {
  const IntlAny = Intl as unknown as {
    Segmenter?: new (locale?: string, options?: { granularity: string }) => SentenceSegmenter;
  };
  if (!IntlAny.Segmenter) return null;
  return new IntlAny.Segmenter(undefined, { granularity: 'sentence' });
}

function getHighlightRegistry(): HighlightRegistry | null {
  return typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight === 'function'
    ? CSS.highlights
    : null;
}

/** Resolve the text node + offset under a viewport point (cross-browser). */
function caretFromPoint(x: number, y: number): { node: Node; offset: number } | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };

  if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(x, y);
    return pos ? { node: pos.offsetNode, offset: pos.offset } : null;
  }
  if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(x, y);
    return range ? { node: range.startContainer, offset: range.startOffset } : null;
  }
  return null;
}

/** Collect the block's text nodes with their offsets in the concatenated text. */
function collectTextNodes(block: Element): { entries: TextNodeEntry[]; text: string } {
  const entries: TextNodeEntry[] = [];
  let text = '';
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.textContent?.length || 0;
    entries.push({ node, start: text.length, end: text.length + len });
    text += node.textContent || '';
  }

  return { entries, text };
}

/** Map a global offset in the block's text back to a (node, offset) pair. */
function resolvePoint(
  entries: TextNodeEntry[],
  offset: number,
  isEnd: boolean
): { node: Text; offset: number } | null {
  for (const entry of entries) {
    // For an end boundary, an offset equal to entry.end belongs to this node;
    // for a start boundary it belongs to the next one.
    if (offset < entry.end || (isEnd && offset === entry.end)) {
      return { node: entry.node, offset: offset - entry.start };
    }
  }
  const last = entries[entries.length - 1];
  return last ? { node: last.node, offset: last.end - last.start } : null;
}

export interface SentenceHoverController {
  /** rAF-throttled update from a mousemove event. */
  schedule(root: Element, target: Element, x: number, y: number): void;
  /** Remove the highlight and cancel any pending update. */
  clear(): void;
}

export function createSentenceHoverController(): SentenceHoverController {
  const segmenter = getSegmenter();
  const registry = getHighlightRegistry();
  const supported = !!(segmenter && registry);

  let rafId = 0;
  let pending: { root: Element; target: Element; x: number; y: number } | null = null;

  // Last applied highlight, to skip redundant work while the pointer stays
  // within one sentence. lastRange detects DOM replacement (re-render).
  let lastBlock: Element | null = null;
  let lastStart = -1;
  let lastRange: Range | null = null;

  function reset() {
    lastBlock = null;
    lastStart = -1;
    lastRange = null;
    registry?.delete(SENTENCE_HOVER_HIGHLIGHT);
  }

  function run() {
    rafId = 0;
    if (!pending || !segmenter || !registry) return;
    const { root, target, x, y } = pending;

    // Only highlight when the pointer is actually over a text block — the
    // caret APIs snap to the nearest text, which feels wrong from the gaps
    // between blocks (where the event target is the article itself).
    const block = target.closest(BLOCK_SELECTOR);
    if (!block || !root.contains(block) || block.closest('pre')) {
      reset();
      return;
    }

    const caret = caretFromPoint(x, y);
    if (!caret || caret.node.nodeType !== Node.TEXT_NODE || !block.contains(caret.node)) {
      reset();
      return;
    }

    const { entries, text } = collectTextNodes(block);
    const hit = entries.find((e) => e.node === caret.node);
    if (!hit || !text.trim()) {
      reset();
      return;
    }
    const globalOffset = hit.start + caret.offset;

    // Find the sentence containing the hovered character
    let sentStart = 0;
    let sentEnd = text.length;
    for (const seg of segmenter.segment(text)) {
      const end = seg.index + seg.segment.length;
      if (globalOffset < end || end === text.length) {
        sentStart = seg.index;
        sentEnd = end;
        break;
      }
    }

    // Trim whitespace so the highlight hugs the sentence
    while (sentStart < sentEnd && /\s/.test(text[sentStart])) sentStart++;
    while (sentEnd > sentStart && /\s/.test(text[sentEnd - 1])) sentEnd--;
    if (sentStart >= sentEnd) {
      reset();
      return;
    }

    // Same sentence as last frame and the DOM hasn't been replaced — done
    if (block === lastBlock && sentStart === lastStart && lastRange?.startContainer.isConnected) {
      return;
    }

    const startPoint = resolvePoint(entries, sentStart, false);
    const endPoint = resolvePoint(entries, sentEnd, true);
    if (!startPoint || !endPoint) {
      reset();
      return;
    }

    const range = document.createRange();
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset);
    registry.set(SENTENCE_HOVER_HIGHLIGHT, new Highlight(range));

    lastBlock = block;
    lastStart = sentStart;
    lastRange = range;
  }

  return {
    schedule(root, target, x, y) {
      if (!supported) return;
      pending = { root, target, x, y };
      if (!rafId) rafId = requestAnimationFrame(run);
    },
    clear() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      pending = null;
      reset();
    },
  };
}
