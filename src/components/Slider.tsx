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

  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      className={className}
      style={{
        ...style,
        '--slider-progress': `${progress}%`,
      } as React.CSSProperties}
      {...props}
    />
  );
}
