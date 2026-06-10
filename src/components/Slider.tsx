interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  title?: string;
}

export function Slider({ min, max, value, onChange, step = 1, title }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      step={step}
      title={title}
      style={{
        '--slider-progress': `${percentage}%`,
      } as React.CSSProperties}
    />
  );
}
