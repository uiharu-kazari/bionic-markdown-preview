import { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';
import type { LayoutDirection } from '../types';

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  direction?: LayoutDirection;
  /** Toggling this mirrors the split so each panel keeps its own size. */
  swapped?: boolean;
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  direction = 'horizontal',
  swapped = false,
}: ResizablePanelsProps) {
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // When the panels swap sides, mirror the split ratio too — swapping should
  // exchange the panels wholesale, width included, not pour the contents
  // into the other side's width.
  const prevSwappedRef = useRef(swapped);
  useEffect(() => {
    if (prevSwappedRef.current !== swapped) {
      prevSwappedRef.current = swapped;
      setSize((s) => 100 - s);
    }
  }, [swapped]);

  const handleMouseDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    let newSize: number;

    if (direction === 'horizontal') {
      newSize = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    } else {
      newSize = ((e.clientY - containerRect.top) / containerRect.height) * 100;
    }

    const clampedSize = Math.min(Math.max(newSize, minSize), maxSize);
    setSize(clampedSize);
  }, [isDragging, minSize, maxSize, direction]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handleMouseMove);
      document.addEventListener('pointerup', handleMouseUp);
      document.addEventListener('pointercancel', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('pointermove', handleMouseMove);
      document.removeEventListener('pointerup', handleMouseUp);
      document.removeEventListener('pointercancel', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`h-full ${isHorizontal ? 'flex' : 'flex flex-col'}`}
    >
      <div
        className="overflow-auto"
        style={isHorizontal ? { width: `${size}%` } : { height: `${size}%` }}
      >
        {leftPanel}
      </div>

      <div
        className={`
          relative z-10 flex items-center justify-center
          ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
          bg-slate-200 dark:bg-slate-600 hover:bg-emerald-500 dark:hover:bg-emerald-500
          transition-colors group
          ${isDragging ? 'bg-emerald-500 dark:bg-emerald-500' : ''}
        `}
        role="separator"
        tabIndex={0}
        aria-label="Resize editor and preview"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        aria-valuenow={Math.round(size)}
        style={{ touchAction: 'none' }}
        onPointerDown={handleMouseDown}
        onKeyDown={(e) => {
          const decrease = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
          const increase = isHorizontal ? 'ArrowRight' : 'ArrowDown';
          if (![decrease, increase, 'Home', 'End'].includes(e.key)) return;
          e.preventDefault();
          setSize(current => e.key === 'Home' ? minSize : e.key === 'End' ? maxSize : Math.min(maxSize, Math.max(minSize, current + (e.key === increase ? 5 : -5))));
        }}
      >
        <div className={`
          absolute z-10 p-1 rounded bg-slate-300 dark:bg-slate-500 group-hover:bg-emerald-500
          ${isDragging ? 'bg-emerald-500' : ''}
        `}>
          {isHorizontal ? (
            <GripVertical className="w-3 h-3 text-white" />
          ) : (
            <GripHorizontal className="w-3 h-3 text-white" />
          )}
        </div>
      </div>

      <div
        className="flex-1 overflow-auto"
        style={isHorizontal ? { width: `${100 - size}%` } : { height: `${100 - size}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
}
