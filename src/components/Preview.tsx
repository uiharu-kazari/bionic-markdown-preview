import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';
import { processMarkdownToBionic } from '../utils/markdownProcessor';
import { applyGradientReading, removeGradient, createGradientObserver } from '../utils/gradientReading';
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
  const { previewScrollRef, syncScrollFromPreview } = useEditorContext();
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

  useEffect(() => {
    if (scrollContainerRef.current) {
      previewScrollRef.current = scrollContainerRef.current;
    }
  }, [previewScrollRef]);

  const handleScroll = useCallback(() => {
    syncScrollFromPreview();
  }, [syncScrollFromPreview]);

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
