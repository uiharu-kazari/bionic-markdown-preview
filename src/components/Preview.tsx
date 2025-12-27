import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';
import { processMarkdownToBionic } from '../utils/markdownProcessor';
import { applyGradientReading, removeGradient, createGradientObserver } from '../utils/gradientReading';
import { 
  getCharacterPositionFromClick, 
  getSelectionSourceRange,
  SOURCE_CHAR_START_ATTR,
  insertCursorAtPosition,
  removeCursor,
  applySelectionHighlight,
  removeSelectionHighlight,
  SELECTION_HIGHLIGHT_CLASS,
} from '../utils/sourceMapping';
import { useEditorContext } from '../contexts/EditorContext';
import { useDebounce } from '../hooks/useDebounce';
import type { BionicOptions, EditorSettings, GradientOptions } from '../types';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs font-medium text-white bg-slate-800 dark:bg-slate-600 rounded shadow-lg whitespace-nowrap z-50">
          {text}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800 dark:border-b-slate-600" />
        </div>
      )}
    </div>
  );
}

interface PreviewProps {
  markdown: string;
  bionicOptions: BionicOptions;
  gradientOptions: GradientOptions;
  settings: EditorSettings;
  onBionicToggle: () => void;
}

export function Preview({ markdown, bionicOptions, gradientOptions, settings, onBionicToggle }: PreviewProps) {
  const articleRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<{ disconnect: () => void } | null>(null);
  const { 
    previewScrollRef, 
    previewArticleRef,
    syncScrollFromPreview,
    navigateToEditorChar,
    previewHighlight,
    editorCursorPosition,
    setEditorSelection,
  } = useEditorContext();
  const [copySuccess, setCopySuccess] = useState(false);

  const processedHtml = useMemo(() => {
    return processMarkdownToBionic(markdown, bionicOptions);
  }, [markdown, bionicOptions]);

  const debouncedHtml = useDebounce(processedHtml, 150);

  const isDark = settings.theme === 'dark';

  const isGradientEnabled = gradientOptions.theme !== 'none';

  const applyGradient = useCallback(() => {
    if (!articleRef.current) return;

    if (isGradientEnabled) {
      applyGradientReading(articleRef.current, gradientOptions, isDark);
    } else {
      removeGradient(articleRef.current);
    }
  }, [gradientOptions, isDark, isGradientEnabled]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      applyGradient();
    });

    return () => cancelAnimationFrame(rafId);
  }, [debouncedHtml, applyGradient]);

  useEffect(() => {
    if (!articleRef.current) return;

    observerRef.current?.disconnect();

    if (isGradientEnabled) {
      observerRef.current = createGradientObserver(
        articleRef.current,
        gradientOptions,
        isDark,
        150
      );
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [gradientOptions, isDark, isGradientEnabled]);

  // Register refs with context
  useEffect(() => {
    if (scrollContainerRef.current) {
      previewScrollRef.current = scrollContainerRef.current;
    }
    if (articleRef.current) {
      previewArticleRef.current = articleRef.current;
    }
  }, [previewScrollRef, previewArticleRef]);

  const handleScroll = useCallback(() => {
    syncScrollFromPreview();
  }, [syncScrollFromPreview]);

  // Handle mouse interactions on preview
  // - Click (no selection) → navigate to cursor position in editor  
  // - Selection (mousedown + drag + mouseup) → sync selection to editor
  const handlePreviewMouseUp = useCallback((e: React.MouseEvent) => {
    if (!articleRef.current) return;
    
    const target = e.target as Element;
    
    // Don't handle clicks on links
    if (target.tagName === 'A' || target.closest('a')) return;
    
    // Check if there's a selection
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().length > 0) {
      // User made a selection - sync to editor
      const selectionRange = getSelectionSourceRange(articleRef.current);
      if (selectionRange && selectionRange.sourceStart !== selectionRange.sourceEnd) {
        setEditorSelection(selectionRange.sourceStart, selectionRange.sourceEnd);
        // Clear the preview selection after syncing
        selection.removeAllRanges();
      }
    } else {
      // Simple click - navigate to cursor position
      const charPos = getCharacterPositionFromClick(e.nativeEvent, articleRef.current);
      if (charPos) {
        navigateToEditorChar(charPos.sourceStart);
      }
    }
  }, [navigateToEditorChar, setEditorSelection]);

  // Apply character-level selection highlighting
  useEffect(() => {
    if (!articleRef.current) return;

    // Clear existing selection highlights
    removeSelectionHighlight(articleRef.current);

    // Apply new character-level highlights if any
    if (previewHighlight) {
      requestAnimationFrame(() => {
        if (articleRef.current) {
          applySelectionHighlight(
            articleRef.current,
            previewHighlight.charStart,
            previewHighlight.charEnd
          );
        }
      });
    }
  }, [previewHighlight, processedHtml]);

  // Show cursor at editor cursor position
  // Only shows inline cursor when position maps precisely to text content
  // Empty lines and block boundaries simply don't show a cursor (architectural limitation)
  useEffect(() => {
    if (!articleRef.current) return;

    // Remove existing cursor
    removeCursor(articleRef.current);

    // Insert cursor only if we have a position and no selection highlight
    if (editorCursorPosition !== null && !previewHighlight) {
      requestAnimationFrame(() => {
        if (articleRef.current) {
          // Try to insert inline cursor - if position doesn't map to text,
          // cursor simply won't appear (this is acceptable for empty lines)
          insertCursorAtPosition(articleRef.current, editorCursorPosition);
        }
      });
    }
    
    // Cleanup
    return () => {
      if (articleRef.current) {
        removeCursor(articleRef.current);
      }
    };
  }, [editorCursorPosition, previewHighlight, processedHtml]);

  const handleCopyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(processedHtml);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      console.error('Failed to copy HTML');
    }
  }, [processedHtml]);

  const handleDownloadHtml = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BionicMarkdown Export</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #1e293b;
    }
    h1, h2, h3, h4, h5, h6 { font-weight: bold; margin-top: 1.5em; }
    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    p { margin: 1em 0; }
    code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre { background: #0f172a; color: #e2e8f0; padding: 1em; border-radius: 8px; overflow-x: auto; }
    pre code { background: transparent; padding: 0; }
    blockquote { border-left: 4px solid #10b981; margin: 1em 0; padding-left: 1em; font-style: italic; color: #64748b; }
    a { color: #10b981; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 2em 0; }
    .br-emph { font-weight: 700; }
    .br-rest { font-weight: 400; }
  </style>
</head>
<body>
${processedHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bionic-markdown-export.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedHtml]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 relative">
      <style>{`
        .${SELECTION_HIGHLIGHT_CLASS},
        .${SELECTION_HIGHLIGHT_CLASS} * {
          background-color: rgba(16, 185, 129, 0.35) !important;
          border-radius: 2px;
          /* Normalize all text to look identical */
          color: rgb(30, 41, 59) !important;
          font-weight: 500 !important;
          font-style: normal !important;
          text-decoration: none !important;
          opacity: 1 !important;
          -webkit-text-fill-color: rgb(30, 41, 59) !important;
        }
        .${SELECTION_HIGHLIGHT_CLASS} {
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4);
          padding: 1px 0;
          margin: -1px 0;
        }
        .dark .${SELECTION_HIGHLIGHT_CLASS},
        .dark .${SELECTION_HIGHLIGHT_CLASS} * {
          background-color: rgba(16, 185, 129, 0.45) !important;
          color: rgb(226, 232, 240) !important;
          -webkit-text-fill-color: rgb(226, 232, 240) !important;
        }
        .dark .${SELECTION_HIGHLIGHT_CLASS} {
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.5);
        }
        .preview-cursor {
          display: inline-block;
          width: 2.5px;
          height: 1.15em;
          background-color: rgb(37, 99, 235);
          vertical-align: text-bottom;
          margin: 0 -1px;
          animation: cursorBlink 1s step-end infinite;
          border-radius: 1px;
          box-shadow: 0 0 2px rgba(37, 99, 235, 0.5);
        }
        .dark .preview-cursor {
          background-color: rgb(96, 165, 250);
          box-shadow: 0 0 2px rgba(96, 165, 250, 0.5);
        }
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        [data-source-line], [${SOURCE_CHAR_START_ATTR}] {
          cursor: pointer;
          transition: background-color 0.15s;
        }
        [data-source-line]:hover, [${SOURCE_CHAR_START_ATTR}]:hover {
          background-color: rgba(148, 163, 184, 0.1);
        }
      `}</style>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Preview
          </span>
          <Tooltip text={copySuccess ? 'Copied!' : 'Copy HTML'}>
            <button
              onClick={handleCopyHtml}
              className={`p-1.5 rounded transition-colors ${
                copySuccess
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip text="Download HTML">
            <button
              onClick={handleDownloadHtml}
              className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip text={bionicOptions.enabled ? 'Disable Bionic Markdown Preview' : 'Enable Bionic Markdown Preview'}>
            <button
              onClick={onBionicToggle}
              className={`p-1.5 rounded transition-all duration-200 ${
                bionicOptions.enabled
                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {bionicOptions.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-6 relative"
      >
        <article
          ref={articleRef}
          onMouseUp={handlePreviewMouseUp}
          className="prose prose-slate dark:prose-invert max-w-none prose-custom-line-height prose-headings:font-bold prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-blockquote:border-l-emerald-500 prose-blockquote:italic prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-strong:text-slate-900 dark:prose-strong:text-white relative"
          style={{
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.previewFontFamily,
            '--prose-line-height': settings.lineHeight,
          } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      </div>
    </div>
  );
}
