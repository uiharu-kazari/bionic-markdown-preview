import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

interface LineHighlight {
  startLine: number;
  endLine: number;
}

interface EditorContextValue {
  // Scroll refs
  editorScrollRef: React.MutableRefObject<HTMLElement | null>;
  previewScrollRef: React.MutableRefObject<HTMLElement | null>;
  
  // Element refs for source mapping
  editorTextareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  previewArticleRef: React.MutableRefObject<HTMLElement | null>;
  
  // Scroll sync
  syncScrollFromEditor: () => void;
  syncScrollFromPreview: () => void;
  
  // Line navigation
  navigateToEditorLine: (line: number) => void;
  navigateToPreviewLine: (line: number) => void;
  
  // Highlight state
  editorHighlight: LineHighlight | null;
  previewHighlight: LineHighlight | null;
  setEditorHighlight: (highlight: LineHighlight | null) => void;
  setPreviewHighlight: (highlight: LineHighlight | null) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [scrollSyncEnabled] = useState(true);
  const editorScrollRef = useRef<HTMLElement | null>(null);
  const previewScrollRef = useRef<HTMLElement | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewArticleRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // Highlight state for both panels
  const [editorHighlight, setEditorHighlight] = useState<LineHighlight | null>(null);
  const [previewHighlight, setPreviewHighlight] = useState<LineHighlight | null>(null);

  const syncScroll = useCallback((source: HTMLElement | null, target: HTMLElement | null) => {
    if (!scrollSyncEnabled || isScrollingRef.current || !source || !target) return;

    const sourceScrollHeight = source.scrollHeight - source.clientHeight;
    const targetScrollHeight = target.scrollHeight - target.clientHeight;

    if (sourceScrollHeight <= 0 || targetScrollHeight <= 0) return;

    const scrollRatio = source.scrollTop / sourceScrollHeight;
    const targetScrollTop = scrollRatio * targetScrollHeight;

    isScrollingRef.current = true;
    target.scrollTop = targetScrollTop;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 50);
  }, [scrollSyncEnabled]);

  const syncScrollFromEditor = useCallback(() => {
    syncScroll(editorScrollRef.current, previewScrollRef.current);
  }, [syncScroll]);

  const syncScrollFromPreview = useCallback(() => {
    syncScroll(previewScrollRef.current, editorScrollRef.current);
  }, [syncScroll]);

  // Navigate to a specific line in the editor
  const navigateToEditorLine = useCallback((line: number) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const text = textarea.value;
    const lines = text.split('\n');
    
    // Calculate character position for the start of the target line
    let charIndex = 0;
    for (let i = 0; i < line && i < lines.length; i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }

    // Calculate scroll position
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 
                       parseFloat(getComputedStyle(textarea).fontSize) * 1.6;
    const scrollTop = line * lineHeight - textarea.clientHeight / 3;

    textarea.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    });

    // Focus and set cursor position
    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex);

    // Briefly highlight the line
    setEditorHighlight({ startLine: line, endLine: line + 1 });
    setTimeout(() => setEditorHighlight(null), 1500);
  }, []);

  // Navigate to a specific line in the preview
  const navigateToPreviewLine = useCallback((line: number) => {
    const article = previewArticleRef.current;
    const scrollContainer = previewScrollRef.current;
    if (!article || !scrollContainer) return;

    // Import dynamically to avoid circular deps - find element with matching line
    const elements = article.querySelectorAll('[data-source-line]');
    let targetElement: Element | null = null;
    let bestMatch = Infinity;

    elements.forEach((el) => {
      const startLine = parseInt(el.getAttribute('data-source-line') || '-1', 10);
      const endLine = parseInt(el.getAttribute('data-source-line-end') || '-1', 10);

      if (line >= startLine && line < endLine) {
        const range = endLine - startLine;
        if (range < bestMatch) {
          bestMatch = range;
          targetElement = el;
        }
      }
    });

    if (targetElement) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = targetElement.getBoundingClientRect();

      const scrollTop = scrollContainer.scrollTop +
        (elementRect.top - containerRect.top) -
        (containerRect.height / 3);

      scrollContainer.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      });

      // Briefly highlight the element
      setPreviewHighlight({ startLine: line, endLine: line + 1 });
      setTimeout(() => setPreviewHighlight(null), 1500);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <EditorContext.Provider
      value={{
        editorScrollRef,
        previewScrollRef,
        editorTextareaRef,
        previewArticleRef,
        syncScrollFromEditor,
        syncScrollFromPreview,
        navigateToEditorLine,
        navigateToPreviewLine,
        editorHighlight,
        previewHighlight,
        setEditorHighlight,
        setPreviewHighlight,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
}
