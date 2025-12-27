import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { 
  scrollPreviewToChar, 
  getPreviewElementsForCharRange,
  getLineFromPosition,
} from '../utils/sourceMapping';

interface CharacterHighlight {
  charStart: number;
  charEnd: number;
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
  
  // Character-precise navigation
  navigateToEditorChar: (charPos: number) => void;
  navigateToPreviewChar: (charPos: number) => void;
  
  // Legacy line navigation (calls char navigation internally)
  navigateToEditorLine: (line: number) => void;
  navigateToPreviewLine: (line: number) => void;
  
  // Highlight state (character-based)
  editorHighlight: CharacterHighlight | null;
  previewHighlight: CharacterHighlight | null;
  setEditorHighlight: (highlight: CharacterHighlight | null) => void;
  setPreviewHighlight: (highlight: CharacterHighlight | null) => void;
  
  // Real-time cursor position tracking (editor cursor → preview indicator)
  editorCursorPosition: number | null;
  setEditorCursorPosition: (pos: number | null) => void;
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
  
  // Highlight state for both panels (character-based)
  const [editorHighlight, setEditorHighlight] = useState<CharacterHighlight | null>(null);
  const [previewHighlight, setPreviewHighlight] = useState<CharacterHighlight | null>(null);
  
  // Real-time cursor position from editor
  const [editorCursorPosition, setEditorCursorPosition] = useState<number | null>(null);

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

  // Navigate to a specific character position in the editor
  const navigateToEditorChar = useCallback((charPos: number) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const text = textarea.value;
    const clampedPos = Math.max(0, Math.min(charPos, text.length));
    
    // Calculate line number for scroll position
    const line = getLineFromPosition(text, clampedPos);
    
    // Calculate scroll position
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 
                       parseFloat(getComputedStyle(textarea).fontSize) * 1.6;
    const scrollTop = (line - 1) * lineHeight - textarea.clientHeight / 3;

    textarea.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    });

    // Focus and set cursor position at exact character
    textarea.focus();
    textarea.setSelectionRange(clampedPos, clampedPos);

    // Find the line boundaries for highlighting
    const lines = text.split('\n');
    let lineStart = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      lineStart += lines[i].length + 1;
    }
    const lineEnd = lineStart + (lines[line - 1]?.length || 0);

    // Briefly highlight the line containing the character
    setEditorHighlight({ charStart: lineStart, charEnd: lineEnd });
    setTimeout(() => setEditorHighlight(null), 1500);
  }, []);

  // Navigate to a specific character position in the preview
  const navigateToPreviewChar = useCallback((charPos: number) => {
    const article = previewArticleRef.current;
    const scrollContainer = previewScrollRef.current;
    if (!article || !scrollContainer) return;

    const element = scrollPreviewToChar(article, scrollContainer, charPos);
    
    if (element) {
      // Get the character range of the element for highlighting
      const startAttr = element.getAttribute('data-source-start');
      const endAttr = element.getAttribute('data-source-end');
      
      if (startAttr && endAttr) {
        setPreviewHighlight({ 
          charStart: parseInt(startAttr, 10), 
          charEnd: parseInt(endAttr, 10) 
        });
      } else {
        // Fallback: highlight a small range around the position
        setPreviewHighlight({ charStart: charPos, charEnd: charPos + 50 });
      }
      setTimeout(() => setPreviewHighlight(null), 1500);
    }
  }, []);

  // Legacy line navigation - converts to character position
  const navigateToEditorLine = useCallback((line: number) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const text = textarea.value;
    const lines = text.split('\n');
    
    // Calculate character position for the start of the target line
    let charIndex = 0;
    for (let i = 0; i < line && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }

    navigateToEditorChar(charIndex);
  }, [navigateToEditorChar]);

  // Legacy preview line navigation
  const navigateToPreviewLine = useCallback((line: number) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const text = textarea.value;
    const lines = text.split('\n');
    
    // Calculate character position for the start of the target line
    let charIndex = 0;
    for (let i = 0; i < line && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }

    navigateToPreviewChar(charIndex);
  }, [navigateToPreviewChar]);

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
        navigateToEditorChar,
        navigateToPreviewChar,
        navigateToEditorLine,
        navigateToPreviewLine,
        editorHighlight,
        previewHighlight,
        setEditorHighlight,
        setPreviewHighlight,
        editorCursorPosition,
        setEditorCursorPosition,
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
