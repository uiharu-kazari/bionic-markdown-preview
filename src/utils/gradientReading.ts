import type { GradientOptions } from '../types';
import {
  getThemePalette,
  adjustPaletteForTheme,
  interpolateHsl,
  hslToString,
  type HSL,
} from './colorUtils';

const EXCLUDED_TAGS = new Set(['PRE', 'CODE', 'KBD', 'SAMP', 'SCRIPT', 'STYLE']);
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const LINK_TAG = 'A';
const BIONIC_EMPHASIS_TAGS = new Set(['B', 'STRONG', 'MARK']);
const LINE_TOLERANCE = 3;
const GRADIENT_DATA_ATTR = 'data-gradient-word';

interface WordSpan {
  element: HTMLSpanElement;
  rect: DOMRect;
  text: string;
}

interface LineGroup {
  spans: WordSpan[];
  top: number;
  left: number;
  right: number;
}

function isExcludedElement(node: Node, options: GradientOptions): boolean {
  let current: Node | null = node;

  while (current && current.nodeType !== Node.DOCUMENT_NODE) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element;
      const tagName = element.tagName;

      if (EXCLUDED_TAGS.has(tagName)) return true;
      if (!options.applyToHeadings && HEADING_TAGS.has(tagName)) return true;
      if (!options.applyToLinks && tagName === LINK_TAG) return true;
    }
    current = current.parentNode;
  }

  return false;
}

function isInsideEmphasis(node: Node): boolean {
  let current: Node | null = node;

  while (current && current.nodeType !== Node.DOCUMENT_NODE) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element;
      const tagName = element.tagName;

      if (BIONIC_EMPHASIS_TAGS.has(tagName)) return true;
      if (element.classList.contains('bionic-bold')) return true;
      if (element.classList.contains('br-emph')) return true;
    }
    current = current.parentNode;
  }

  return false;
}

function wrapTextNodesInSpans(root: Element, options: GradientOptions): WordSpan[] {
  const spans: WordSpan[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      if (isExcludedElement(node, options)) return NodeFilter.FILTER_REJECT;
      if (!isInsideEmphasis(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const words = textNode.textContent?.split(/(\s+)/) || [];
    const fragment = document.createDocumentFragment();

    words.forEach((word) => {
      if (!word) return;

      if (/^\s+$/.test(word)) {
        fragment.appendChild(document.createTextNode(word));
        return;
      }

      const span = document.createElement('span');
      span.textContent = word;
      span.setAttribute(GRADIENT_DATA_ATTR, 'true');
      span.style.display = 'inline';
      fragment.appendChild(span);
    });

    textNode.parentNode?.replaceChild(fragment, textNode);
  });

  root.querySelectorAll(`[${GRADIENT_DATA_ATTR}]`).forEach((el) => {
    const span = el as HTMLSpanElement;
    const rect = span.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      spans.push({
        element: span,
        rect,
        text: span.textContent || '',
      });
    }
  });

  return spans;
}

function groupSpansByLine(spans: WordSpan[]): LineGroup[] {
  if (spans.length === 0) return [];

  const sortedSpans = [...spans].sort((a, b) => {
    const yDiff = a.rect.top - b.rect.top;
    if (Math.abs(yDiff) > LINE_TOLERANCE) return yDiff;
    return a.rect.left - b.rect.left;
  });

  const lines: LineGroup[] = [];
  let currentLine: LineGroup = {
    spans: [sortedSpans[0]],
    top: sortedSpans[0].rect.top,
    left: sortedSpans[0].rect.left,
    right: sortedSpans[0].rect.right,
  };

  for (let i = 1; i < sortedSpans.length; i++) {
    const span = sortedSpans[i];
    const yDiff = Math.abs(span.rect.top - currentLine.top);

    if (yDiff <= LINE_TOLERANCE) {
      currentLine.spans.push(span);
      currentLine.left = Math.min(currentLine.left, span.rect.left);
      currentLine.right = Math.max(currentLine.right, span.rect.right);
    } else {
      currentLine.spans.sort((a, b) => a.rect.left - b.rect.left);
      lines.push(currentLine);
      currentLine = {
        spans: [span],
        top: span.rect.top,
        left: span.rect.left,
        right: span.rect.right,
      };
    }
  }

  currentLine.spans.sort((a, b) => a.rect.left - b.rect.left);
  lines.push(currentLine);

  return lines;
}

function applyGradientToLine(
  line: LineGroup,
  startColor: HSL,
  endColor: HSL
): void {
  const lineWidth = line.right - line.left;
  if (lineWidth <= 0) return;

  line.spans.forEach((span) => {
    const spanCenter = (span.rect.left + span.rect.right) / 2;
    const t = (spanCenter - line.left) / lineWidth;
    const clampedT = Math.max(0, Math.min(1, t));

    const color = interpolateHsl(startColor, endColor, clampedT);
    span.element.style.color = hslToString(color);
  });
}

function getPalette(options: GradientOptions, isDark: boolean): HSL[] | null {
  const basePalette = getThemePalette(options.theme);
  if (!basePalette) return null;
  return adjustPaletteForTheme(basePalette, isDark);
}

export function applyGradientReading(
  previewRoot: Element,
  options: GradientOptions,
  isDark: boolean
): void {
  if (options.theme === 'none') {
    removeGradient(previewRoot);
    return;
  }

  const palette = getPalette(options, isDark);
  if (!palette) return;

  // Check if gradient spans already exist - if so, just update colors
  const existingSpans = previewRoot.querySelectorAll(`[${GRADIENT_DATA_ATTR}]`);
  if (existingSpans.length > 0) {
    // Update colors in place without removing/recreating spans
    updateGradientColors(previewRoot, palette);
    return;
  }

  // First time: create spans and apply colors
  removeGradient(previewRoot);

  const spans = wrapTextNodesInSpans(previewRoot, options);
  const lines = groupSpansByLine(spans);

  lines.forEach((line, index) => {
    const paletteLength = palette.length;
    const startColorIndex = index % paletteLength;
    const endColorIndex = (index + 1) % paletteLength;

    const startColor = palette[startColorIndex];
    const endColor = palette[endColorIndex];

    applyGradientToLine(line, startColor, endColor);
  });

  previewRoot.setAttribute('data-gradient-applied', 'true');
}

function updateGradientColors(previewRoot: Element, palette: HSL[]): void {
  const gradientSpans = previewRoot.querySelectorAll(`[${GRADIENT_DATA_ATTR}]`);
  if (gradientSpans.length === 0) return;

  // Collect spans with their current positions
  const spans: WordSpan[] = [];
  gradientSpans.forEach((el) => {
    const span = el as HTMLSpanElement;
    const rect = span.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      spans.push({
        element: span,
        rect,
        text: span.textContent || '',
      });
    }
  });

  // Group by line and reapply colors
  const lines = groupSpansByLine(spans);

  lines.forEach((line, index) => {
    const paletteLength = palette.length;
    const startColorIndex = index % paletteLength;
    const endColorIndex = (index + 1) % paletteLength;

    const startColor = palette[startColorIndex];
    const endColor = palette[endColorIndex];

    applyGradientToLine(line, startColor, endColor);
  });
}

export function removeGradient(previewRoot: Element): void {
  if (!previewRoot.hasAttribute('data-gradient-applied')) return;

  const gradientSpans = previewRoot.querySelectorAll(`[${GRADIENT_DATA_ATTR}]`);

  gradientSpans.forEach((span) => {
    const textNode = document.createTextNode(span.textContent || '');
    span.parentNode?.replaceChild(textNode, span);
  });

  previewRoot.normalize();
  previewRoot.removeAttribute('data-gradient-applied');
}

export function createGradientObserver(
  previewRoot: Element,
  options: GradientOptions,
  isDark: boolean,
  debounceMs: number = 150
): { disconnect: () => void } {
  let timeoutId: number | null = null;
  let rafId: number | null = null;

  const scheduleReapply = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (rafId) cancelAnimationFrame(rafId);

    timeoutId = window.setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        applyGradientReading(previewRoot, options, isDark);
      });
    }, debounceMs);
  };

  const resizeObserver = new ResizeObserver(() => {
    scheduleReapply();
  });

  resizeObserver.observe(previewRoot);

  const windowResizeHandler = () => scheduleReapply();
  window.addEventListener('resize', windowResizeHandler);

  return {
    disconnect: () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', windowResizeHandler);
    },
  };
}
