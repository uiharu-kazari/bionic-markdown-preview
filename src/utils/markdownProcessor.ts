import DOMPurify from 'dompurify';
import { textVide } from 'text-vide';
import type { BionicOptions } from '../types';
import { 
  createMarkdownItWithSourceMap, 
  SOURCE_LINE_ATTR, 
  SOURCE_LINE_END_ATTR,
  SOURCE_CHAR_START_ATTR,
  SOURCE_CHAR_END_ATTR,
  SOURCE_TEXT_ATTR,
} from './sourceMapping';

const md = createMarkdownItWithSourceMap();

export function renderMarkdown(content: string): string {
  const rawHtml = md.render(content);
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'strong', 'em', 'del', 's',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      SOURCE_LINE_ATTR, SOURCE_LINE_END_ATTR,
      SOURCE_CHAR_START_ATTR, SOURCE_CHAR_END_ATTR, SOURCE_TEXT_ATTR,
    ],
  });
}

export function applyBionicReading(
  html: string,
  options: BionicOptions
): string {
  if (!options.enabled) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const skipTags = new Set(['CODE', 'PRE', 'A', 'SCRIPT', 'STYLE']);
  const highlightTag = options.highlightTag.toUpperCase();
  const dimOpacity = options.dimOpacity / 100;

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const parent = node.parentElement;
      if (parent && skipTags.has(parent.tagName)) {
        return;
      }

      const text = node.textContent;
      if (text.trim()) {
        const bionicText = textVide(text, {
          sep: [`<${options.highlightTag}${options.highlightClass ? ` class="${options.highlightClass}"` : ''}>`, `</${options.highlightTag}>`],
          fixationPoint: 6 - options.fixationPoint,
        });

        const wrapper = document.createElement('span');
        wrapper.innerHTML = bionicText;

        // Preserve source mapping attributes from parent span
        if (parent?.tagName === 'SPAN') {
          const startAttr = parent.getAttribute(SOURCE_CHAR_START_ATTR);
          const endAttr = parent.getAttribute(SOURCE_CHAR_END_ATTR);
          const sourceTextAttr = parent.getAttribute(SOURCE_TEXT_ATTR);
          if (startAttr !== null) wrapper.setAttribute(SOURCE_CHAR_START_ATTR, startAttr);
          if (endAttr !== null) wrapper.setAttribute(SOURCE_CHAR_END_ATTR, endAttr);
          if (sourceTextAttr !== null) wrapper.setAttribute(SOURCE_TEXT_ATTR, sourceTextAttr);
        }

        if (dimOpacity < 1) {
          applyDimming(wrapper, highlightTag, dimOpacity);
        }

        if (node.parentNode) {
          node.parentNode.replaceChild(wrapper, node);
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (!skipTags.has(element.tagName)) {
        Array.from(node.childNodes).forEach(processNode);
      }
    }
  }

  Array.from(doc.body.childNodes).forEach(processNode);

  return doc.body.innerHTML;
}

function applyDimming(container: HTMLElement, highlightTag: string, opacity: number): void {
  Array.from(container.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
      const dimSpan = document.createElement('span');
      dimSpan.style.opacity = String(opacity);
      dimSpan.textContent = node.textContent;
      node.parentNode?.replaceChild(dimSpan, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName !== highlightTag) {
        element.style.opacity = String(opacity);
      }
    }
  });
}

export function processMarkdownToBionic(
  markdown: string,
  bionicOptions: BionicOptions
): string {
  const html = renderMarkdown(markdown);
  return applyBionicReading(html, bionicOptions);
}
