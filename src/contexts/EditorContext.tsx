import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

interface EditorContextValue {
  editorScrollRef: React.MutableRefObject<HTMLElement | null>;
  previewScrollRef: React.MutableRefObject<HTMLElement | null>;
  syncScrollFromEditor: () => void;
  syncScrollFromPreview: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [scrollSyncEnabled, setScrollSyncEnabled] = useState(true);
  const editorScrollRef = useRef<HTMLElement | null>(null);
  const previewScrollRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

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
        syncScrollFromEditor,
        syncScrollFromPreview,
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
