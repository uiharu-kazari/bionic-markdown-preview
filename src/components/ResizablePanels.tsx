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
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  direction = 'horizontal',
}: ResizablePanelsProps) {
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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
        onMouseDown={handleMouseDown}
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
