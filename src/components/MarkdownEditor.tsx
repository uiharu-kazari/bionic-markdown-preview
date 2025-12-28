import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { useEditorContext } from '../contexts/EditorContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getPositionForLine } from '../utils/sourceMapping';
import type { EditorSettings } from '../types';

/**
 * Calculate the visual height of each line when text wraps.
 * Returns an array of heights (in pixels) for each logical line.
 */
function useLineHeights(
  value: string,
  containerRef: React.RefObject<HTMLDivElement>,
  settings: EditorSettings
): number[] {
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create a hidden measuring element
    const measureDiv = document.createElement('div');
    measureDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: ${settings.fontSize}px;
      font-family: ${settings.fontFamily};
      line-height: ${settings.lineHeight};
      padding: 0;
      margin: 0;
      border: none;
    `;
    container.appendChild(measureDiv);
    measureRef.current = measureDiv;

    const calculateHeights = () => {
      if (!measureRef.current) return;
      
      // Get the width of the textarea (excluding padding)
      const textarea = container.querySelector('textarea');
      if (!textarea) return;
      
      const computedStyle = getComputedStyle(textarea);
      const paddingLeft = parseFloat(computedStyle.paddingLeft);
      const paddingRight = parseFloat(computedStyle.paddingRight);
      const width = textarea.clientWidth - paddingLeft - paddingRight;
      
      measureRef.current.style.width = `${width}px`;
      
      const lines = value.split('\n');
      const heights: number[] = [];
      
      for (const line of lines) {
        // Empty lines still take up one line height
        measureRef.current.textContent = line || '\u00A0';
        heights.push(measureRef.current.offsetHeight);
      }
      
      setLineHeights(heights);
    };

    // Calculate initially
    calculateHeights();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(() => {
      calculateHeights();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      measureDiv.remove();
      measureRef.current = null;
    };
  }, [value, settings.fontSize, settings.fontFamily, settings.lineHeight, containerRef]);

  return lineHeights;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  settings: EditorSettings;
}

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

export function MarkdownEditor({ value, onChange, settings }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { 
    editorScrollRef, 
    editorTextareaRef,
    syncScrollFromEditor, 
    navigateToPreviewChar,
    editorHighlight,
    setPreviewHighlight,
    setEditorCursorPosition,
  } = useEditorContext();
  const { t } = useLanguage();
  
  // Calculate line heights for wrapped text
  const lineHeights = useLineHeights(value, editorContainerRef, settings);

  const handleReset = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    textarea.select();
    document.execCommand('insertText', false, '');
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  }, [value, onChange]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
    syncScrollFromEditor();
  }, [syncScrollFromEditor]);

  const handleCopyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      console.error('Failed to copy markdown');
    }
  }, [value]);

  // Handle click on line number to navigate to preview (character-precise)
  const handleLineNumberClick = useCallback((lineNumber: number) => {
    // Get character position for the start of the line
    const charPos = getPositionForLine(value, lineNumber);
    navigateToPreviewChar(charPos);
  }, [value, navigateToPreviewChar]);

  // Handle selection/cursor change to update preview highlight and cursor indicator
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || document.activeElement !== textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    
    // Always update cursor position for the preview indicator
    setEditorCursorPosition(selectionStart);
    
    if (selectionStart === selectionEnd) {
      // No selection (just cursor), clear highlight but keep cursor indicator
      setPreviewHighlight(null);
      return;
    }

    // Set character-based highlight for selection
    setPreviewHighlight({
      charStart: selectionStart,
      charEnd: selectionEnd,
    });
  }, [setPreviewHighlight, setEditorCursorPosition]);

  // Register refs with context
  useEffect(() => {
    if (textareaRef.current) {
      editorScrollRef.current = textareaRef.current;
      editorTextareaRef.current = textareaRef.current;
    }
  }, [editorScrollRef, editorTextareaRef]);

  // Listen for selection changes, keyup, and clicks for better cursor tracking
  useEffect(() => {
    const handleSelect = () => handleSelectionChange();
    const textarea = textareaRef.current;
    
    document.addEventListener('selectionchange', handleSelect);
    textarea?.addEventListener('keyup', handleSelect);
    textarea?.addEventListener('click', handleSelect);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelect);
      textarea?.removeEventListener('keyup', handleSelect);
      textarea?.removeEventListener('click', handleSelect);
    };
  }, [handleSelectionChange]);

  // Clear preview highlight and cursor when focus leaves editor
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleBlur = () => {
      setPreviewHighlight(null);
      setEditorCursorPosition(null);
    };

    textarea.addEventListener('blur', handleBlur);
    return () => textarea.removeEventListener('blur', handleBlur);
  }, [setPreviewHighlight, setEditorCursorPosition]);

  const lineCount = value.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Check if a line is highlighted (based on character range)
  const isLineHighlighted = (lineNum: number) => {
    if (!editorHighlight) return false;
    
    // Calculate character range for this line
    const lineStart = getPositionForLine(value, lineNum);
    const lines = value.split('\n');
    const lineEnd = lineStart + (lines[lineNum - 1]?.length || 0);
    
    // Check if line overlaps with highlight range
    return editorHighlight.charEnd > lineStart && editorHighlight.charStart < lineEnd;
  };

  // Get base line height for fallback
  const baseLineHeight = useMemo(() => {
    return settings.fontSize * settings.lineHeight;
  }, [settings.fontSize, settings.lineHeight]);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t.markdownEditor}
          </span>
          <Tooltip text={copySuccess ? t.copied : t.copyMarkdown}>
            <button
              onClick={handleCopyMarkdown}
              className={`p-1.5 rounded transition-colors ${
                copySuccess
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip text={t.resetEditor}>
            <button
              onClick={handleReset}
              className="p-1.5 rounded text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {lineCount} {t.lines} | {value.length} {t.chars}
        </span>
      </div>
      <div ref={editorContainerRef} className="flex-1 flex overflow-hidden relative">
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 overflow-hidden select-none bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
          style={{
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.fontFamily,
          }}
        >
          <div className="pt-4 pb-[50vh] px-3 text-right">
            {lineNumbers.map((num) => {
              // Use calculated height or fallback to base line height
              const height = lineHeights[num - 1] || baseLineHeight;
              
              return (
                <div
                  key={num}
                  onClick={() => handleLineNumberClick(num)}
                  className={`flex items-start justify-end cursor-pointer transition-colors ${
                    isLineHighlighted(num)
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 -mx-3 px-3'
                      : 'text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                  style={{ 
                    height: `${height}px`,
                    lineHeight: settings.lineHeight,
                  }}
                  title={`Go to line ${num} in preview`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="# Start writing your markdown here...

Type your content and see it highlighted in the preview panel.

- Create lists
- Like this one

> Add blockquotes for quotes

```
code blocks work too
```"
          spellCheck={false}
          className="flex-1 w-full pt-4 pb-[50vh] px-4 resize-none bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          style={{
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.fontFamily,
            lineHeight: settings.lineHeight,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            overflowX: 'hidden',
          }}
        />
      </div>
    </div>
  );
}
