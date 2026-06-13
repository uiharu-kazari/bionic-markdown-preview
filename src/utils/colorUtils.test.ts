import { describe, it, expect } from 'vitest';
import {
  interpolateHsl,
  hslToString,
  hslToRgb,
  getContrastRatio,
  getThemePalette,
  adjustPaletteForTheme,
} from './colorUtils';

// Gradient reading interpolates colors per word along each line. Bad
// interpolation = the "overlapping/wrong color" class of bugs.
describe('interpolateHsl', () => {
  it('returns the endpoints at t=0 and t=1', () => {
    const a = { h: 200, s: 80, l: 50 };
    const b = { h: 260, s: 40, l: 60 };
    expect(interpolateHsl(a, b, 0)).toEqual(a);
    const end = interpolateHsl(a, b, 1);
    expect(end.h).toBeCloseTo(260);
    expect(end.s).toBeCloseTo(40);
    expect(end.l).toBeCloseTo(60);
  });

  it('interpolates the midpoint linearly for s and l', () => {
    const mid = interpolateHsl({ h: 0, s: 0, l: 0 }, { h: 0, s: 100, l: 100 }, 0.5);
    expect(mid.s).toBeCloseTo(50);
    expect(mid.l).toBeCloseTo(50);
  });

  it('takes the short way around the hue circle', () => {
    // 350 -> 10 should pass through 0/360, not sweep down through 180
    const mid = interpolateHsl({ h: 350, s: 50, l: 50 }, { h: 10, s: 50, l: 50 }, 0.5);
    expect(mid.h % 360).toBeCloseTo(0, 0);
  });
});

describe('hslToString', () => {
  it('rounds and formats as a CSS hsl() string', () => {
    expect(hslToString({ h: 200.4, s: 79.6, l: 50.1 })).toBe('hsl(200, 80%, 50%)');
  });
});

describe('hslToRgb', () => {
  it('converts known colors', () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('getContrastRatio', () => {
  it('is ~21 for black on white and 1 for identical colors', () => {
    expect(getContrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 0);
    expect(getContrastRatio({ r: 120, g: 120, b: 120 }, { r: 120, g: 120, b: 120 })).toBeCloseTo(1, 5);
  });
});

describe('theme palettes', () => {
  it('returns a non-empty palette for a real theme and null for none', () => {
    const ocean = getThemePalette('ocean');
    expect(ocean?.colors.length).toBeGreaterThan(0);
    expect(getThemePalette('none')).toBeNull();
  });

  it('adjustPaletteForTheme yields one HSL per palette color', () => {
    const ocean = getThemePalette('ocean')!;
    const adjusted = adjustPaletteForTheme(ocean, true);
    expect(adjusted).toHaveLength(ocean.colors.length);
    for (const c of adjusted) {
      expect(c).toHaveProperty('h');
      expect(c).toHaveProperty('s');
      expect(c).toHaveProperty('l');
    }
  });
});
