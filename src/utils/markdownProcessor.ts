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
import { installMathParsing, restoreMath, type MathBlock } from './mathProcessor';

const md = createMarkdownItWithSourceMap();
installMathParsing(md);

export function renderMarkdown(content: string): string {
  // Parse the original source so math cannot shift navigation offsets or
  // rewrite Markdown destinations, titles, and code before parsing.
  const mathBlocks: MathBlock[] = [];
  const rawHtml = md.render(content, { mathBlocks });
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
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

  // Restore math expressions with KaTeX-rendered HTML
  return restoreMath(sanitizedHtml, mathBlocks);
}

export function applyBionicReading(
  html: string,
  options: Omit<BionicOptions, 'dimOpacity'>
): string {
  if (!options.enabled) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const skipTags = new Set(['CODE', 'PRE', 'A', 'SCRIPT', 'STYLE']);
  const skipClasses = ['katex', 'math-inline', 'math-display'];
  const tag = ['b', 'strong', 'mark', 'span'].includes(options.highlightTag)
    ? options.highlightTag : 'b';
  const highlightTag = tag.toUpperCase();

  function processNode(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const parent = node.parentElement;
      if (parent && skipTags.has(parent.tagName)) {
        return;
      }

      const text = node.textContent;
      if (text.trim()) {
        // textVide still chooses the emphasized prefixes, but its result is
        // plain text with private markers. Never parse decoded text as HTML.
        let marker = '\u0000BIONIC';
        while (text.includes(marker)) marker += '_';
        const open = `${marker}OPEN\u0000`;
        const close = `${marker}CLOSE\u0000`;
        const bionicText = textVide(text, {
          sep: [open, close],
          fixationPoint: 6 - options.fixationPoint,
          ignoreHtmlTag: false,
          ignoreHtmlEntity: false,
        });

        const wrapper = document.createElement('span');
        let position = 0;
        while (position < bionicText.length) {
          const next = bionicText.indexOf(open, position);
          if (next === -1) {
            wrapper.append(document.createTextNode(bionicText.slice(position)));
            break;
          }
          wrapper.append(document.createTextNode(bionicText.slice(position, next)));
          const end = bionicText.indexOf(close, next + open.length);
          const emphasis = document.createElement(tag);
          if (options.highlightClass) emphasis.className = options.highlightClass;
          let emphasized = bionicText.slice(next + open.length, end);
          position = end + close.length;
          // text-vide counts UTF-16 units. Keep an astral letter together if
          // its calculated prefix ends between the surrogate pair.
          const last = emphasized.charCodeAt(emphasized.length - 1);
          const following = bionicText.charCodeAt(position);
          if (last >= 0xD800 && last <= 0xDBFF && following >= 0xDC00 && following <= 0xDFFF) {
            emphasized += bionicText[position++];
          }
          emphasis.textContent = emphasized;
          wrapper.append(emphasis);
        }

        // Preserve source mapping attributes from parent span
        if (parent?.tagName === 'SPAN') {
          const startAttr = parent.getAttribute(SOURCE_CHAR_START_ATTR);
          const endAttr = parent.getAttribute(SOURCE_CHAR_END_ATTR);
          const sourceTextAttr = parent.getAttribute(SOURCE_TEXT_ATTR);
          if (startAttr !== null) wrapper.setAttribute(SOURCE_CHAR_START_ATTR, startAttr);
          if (endAttr !== null) wrapper.setAttribute(SOURCE_CHAR_END_ATTR, endAttr);
          if (sourceTextAttr !== null) wrapper.setAttribute(SOURCE_TEXT_ATTR, sourceTextAttr);
        }

        // Apply dimming class to non-emphasized text (opacity controlled via CSS variable)
        applyDimming(wrapper, highlightTag);

        if (node.parentNode) {
          node.parentNode.replaceChild(wrapper, node);
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (!skipTags.has(element.tagName) &&
          !skipClasses.some(cls => element.classList.contains(cls))) {
        Array.from(node.childNodes).forEach(processNode);
      }
    }
  }

  Array.from(doc.body.childNodes).forEach(processNode);

  return doc.body.innerHTML;
}

function applyDimming(container: HTMLElement, highlightTag: string): void {
  Array.from(container.childNodes).forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
      const dimSpan = document.createElement('span');
      dimSpan.className = 'bionic-dim';
      dimSpan.textContent = node.textContent;
      node.parentNode?.replaceChild(dimSpan, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName !== highlightTag) {
        element.classList.add('bionic-dim');
      }
    }
  });
}

export function processMarkdownToBionic(
  markdown: string,
  bionicOptions: Omit<BionicOptions, 'dimOpacity'>
): string {
  const html = renderMarkdown(markdown);
  return applyBionicReading(html, bionicOptions);
}
