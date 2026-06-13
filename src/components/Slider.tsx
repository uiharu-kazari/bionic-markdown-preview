import { InputHTMLAttributes, useMemo } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  min: number;
  max: number;
  value: number;
}

export function Slider({ min, max, value, className = '', style, ...props }: SliderProps) {
  const progress = useMemo(() => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  // The visible track is a thin line (styled in index.css), but the input box
  // is the actual click/drag hit area. Call sites used h-1.5/h-2 (6–8px),
  // which is far smaller than the 16px thumb and easy to miss — making the
  // slider feel unresponsive. Strip any incoming height utility and enforce a
  // comfortable hit area; the track stays thin and centered.
  const widthOnly = className.replace(/\bh-[\d.]+\b/g, '').trim();

  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      className={`h-5 ${widthOnly}`}
      style={{
        ...style,
        '--slider-progress': `${progress}%`,
      } as React.CSSProperties}
      {...props}
    />
  );
}
