import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Slider } from './Slider';

// Regression guard: sliders had a 6px (h-1.5) hit area vs a 16px thumb and
// felt unresponsive. The component must enforce a comfortable hit area
// regardless of the height utility a call site passes.
describe('Slider', () => {
  it('strips an incoming height utility and enforces a larger hit area', () => {
    const { container } = render(
      <Slider min={1} max={5} value={3} onChange={() => {}} className="w-20 h-1.5 rounded-lg" />
    );
    const input = container.querySelector('input[type=range]')!;
    expect(input.className).not.toMatch(/\bh-1\.5\b/);
    expect(input.className).toMatch(/\bh-5\b/);
    // width utility from the call site is preserved
    expect(input.className).toMatch(/\bw-20\b/);
  });

  it('renders a range input reflecting the value and bounds', () => {
    const { container } = render(
      <Slider min={0} max={100} value={62} onChange={() => {}} />
    );
    const input = container.querySelector('input[type=range]') as HTMLInputElement;
    expect(input.value).toBe('62');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
  });

  it('exposes progress as a CSS custom property', () => {
    const { container } = render(
      <Slider min={0} max={100} value={25} onChange={() => {}} />
    );
    const input = container.querySelector('input[type=range]') as HTMLInputElement;
    expect(input.style.getPropertyValue('--slider-progress')).toBe('25%');
  });

  it('fires onChange when the value changes', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Slider min={1} max={5} value={3} onChange={onChange} />
    );
    const input = container.querySelector('input[type=range]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '4' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
