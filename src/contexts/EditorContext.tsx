import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { 
  scrollPreviewToChar, 
  getLineFromPosition,
  getCharAtEditorTop,
  getPreviewScrollForChar,
  getEditorScrollForChar,
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
  
  // Line heights for wrapped text (updated by MarkdownEditor)
  lineHeightsRef: React.MutableRefObject<number[]>;
  
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
  
  // Set selection in editor (for preview → editor sync)
  setEditorSelection: (start: number, end: number) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [scrollSyncEnabled] = useState(true);
  const editorScrollRef = useRef<HTMLElement | null>(null);
  const previewScrollRef = useRef<HTMLElement | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewArticleRef = useRef<HTMLElement | null>(null);
  const lineHeightsRef = useRef<number[]>([]);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // Highlight state for both panels (character-based)
  const [editorHighlight, setEditorHighlight] = useState<CharacterHighlight | null>(null);
  const [previewHighlight, setPreviewHighlight] = useState<CharacterHighlight | null>(null);
  
  // Real-time cursor position from editor
  const [editorCursorPosition, setEditorCursorPosition] = useState<number | null>(null);

  // Set selection in editor (for preview → editor sync)
  const setEditorSelection = useCallback((start: number, end: number) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const text = textarea.value;
    const clampedStart = Math.max(0, Math.min(start, text.length));
    const clampedEnd = Math.max(0, Math.min(end, text.length));

    // Calculate scroll position for the selection start
    const line = getLineFromPosition(text, clampedStart);
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 
                       parseFloat(getComputedStyle(textarea).fontSize) * 1.6;
    const scrollTop = (line - 1) * lineHeight - textarea.clientHeight / 3;

    textarea.scrollTo({
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    });

    // Focus and set selection
    textarea.focus();
    textarea.setSelectionRange(clampedStart, clampedEnd);

    // Re-apply selection after React update cycle to avoid controlled component reset
    const savedStart = clampedStart;
    const savedEnd = clampedEnd;
    setTimeout(() => {
      if (textarea === document.activeElement) {
        textarea.setSelectionRange(savedStart, savedEnd);
      }
      setEditorHighlight({ charStart: savedStart, charEnd: savedEnd });
      setTimeout(() => setEditorHighlight(null), 1500);
    }, 0);
  }, []);

  // Content-based scroll sync: sync by finding which content is at viewport top
  const syncScrollFromEditor = useCallback(() => {
    if (!scrollSyncEnabled || isScrollingRef.current) return;
    
    const textarea = editorTextareaRef.current;
    const article = previewArticleRef.current;
    const scrollContainer = previewScrollRef.current;
    
    if (!textarea || !article || !scrollContainer) return;

    // Find the character position at the top of the editor viewport
    const charPos = getCharAtEditorTop(textarea, lineHeightsRef.current);
    
    // Find the corresponding scroll position in preview
    const previewScrollTop = getPreviewScrollForChar(article, scrollContainer, charPos);
    
    if (previewScrollTop !== null) {
      isScrollingRef.current = true;
      scrollContainer.scrollTop = previewScrollTop;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    }
  }, [scrollSyncEnabled]);

  const syncScrollFromPreview = useCallback(() => {
    if (!scrollSyncEnabled || isScrollingRef.current) return;
    
    const textarea = editorTextareaRef.current;
    const article = previewArticleRef.current;
    const scrollContainer = previewScrollRef.current;
    
    if (!textarea || !article || !scrollContainer) return;

    // For preview-to-editor sync, find which element is at the top of preview viewport
    const containerRect = scrollContainer.getBoundingClientRect();
    const elements = Array.from(article.querySelectorAll('[data-source-start]'));
    
    let bestMatch: { rect: DOMRect; charStart: number; charEnd: number } | null = null;
    let minDistance = Infinity;
    
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const distanceFromTop = Math.abs(rect.top - containerRect.top);
      
      // Only consider elements that are at or near the top of viewport
      if (rect.top >= containerRect.top - 10 && distanceFromTop < minDistance) {
        minDistance = distanceFromTop;
        bestMatch = {
          rect,
          charStart: parseInt(el.getAttribute('data-source-start') || '0', 10),
          charEnd: parseInt(el.getAttribute('data-source-end') || '0', 10),
        };
      }
    }
    
    if (bestMatch !== null) {
      const { rect: topRect, charStart: topCharStart, charEnd: topCharEnd } = bestMatch;
      
      // Calculate ratio within the element
      const elementRatio = Math.max(0, (containerRect.top - topRect.top) / topRect.height);
      
      // Adjust character position based on ratio
      const adjustedCharPos = topCharStart + Math.floor(elementRatio * (topCharEnd - topCharStart));
      
      // Find editor scroll position for this character
      const editorScrollTop = getEditorScrollForChar(textarea, adjustedCharPos, lineHeightsRef.current);
      
      isScrollingRef.current = true;
      textarea.scrollTop = editorScrollTop;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    }
  }, [scrollSyncEnabled]);

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
        lineHeightsRef,
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
        setEditorSelection,
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
