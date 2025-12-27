import type { GradientTheme } from '../types';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorPalette {
  colors: HSL[];
  name: string;
}

export interface GradientThemeConfig {
  id: GradientTheme;
  name: string;
  palette: ColorPalette | null;
  previewColors: string[];
}

const GRADIENT_THEMES: Record<GradientTheme, GradientThemeConfig> = {
  none: {
    id: 'none',
    name: 'None',
    palette: null,
    previewColors: [],
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    palette: {
      name: 'Ocean',
      colors: [
        { h: 195, s: 90, l: 40 },
        { h: 180, s: 85, l: 38 },
        { h: 210, s: 92, l: 42 },
        { h: 170, s: 80, l: 36 },
        { h: 200, s: 88, l: 44 },
      ],
    },
    previewColors: ['#0891b2', '#0d9488', '#0284c7', '#14b8a6', '#0ea5e9'],
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    palette: {
      name: 'Sunset',
      colors: [
        { h: 15, s: 95, l: 48 },
        { h: 35, s: 92, l: 45 },
        { h: 350, s: 88, l: 50 },
        { h: 25, s: 90, l: 46 },
        { h: 5, s: 85, l: 52 },
      ],
    },
    previewColors: ['#ea580c', '#d97706', '#e11d48', '#f59e0b', '#ef4444'],
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    palette: {
      name: 'Forest',
      colors: [
        { h: 142, s: 76, l: 36 },
        { h: 158, s: 64, l: 38 },
        { h: 120, s: 50, l: 40 },
        { h: 150, s: 70, l: 34 },
        { h: 130, s: 60, l: 42 },
      ],
    },
    previewColors: ['#16a34a', '#059669', '#4d7c0f', '#10b981', '#22c55e'],
  },
  berry: {
    id: 'berry',
    name: 'Berry',
    palette: {
      name: 'Berry',
      colors: [
        { h: 330, s: 85, l: 48 },
        { h: 280, s: 75, l: 50 },
        { h: 350, s: 80, l: 52 },
        { h: 300, s: 70, l: 46 },
        { h: 320, s: 82, l: 50 },
      ],
    },
    previewColors: ['#db2777', '#a855f7', '#f43f5e', '#c026d3', '#ec4899'],
  },
};

export const GRADIENT_THEME_LIST: GradientThemeConfig[] = Object.values(GRADIENT_THEMES);

export function getThemePalette(theme: GradientTheme): ColorPalette | null {
  return GRADIENT_THEMES[theme]?.palette || null;
}

export function getThemeConfig(theme: GradientTheme): GradientThemeConfig {
  return GRADIENT_THEMES[theme];
}

export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0, gPrime = 0, bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c; gPrime = x; bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x; gPrime = c; bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0; gPrime = c; bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0; gPrime = x; bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x; gPrime = 0; bPrime = c;
  } else {
    rPrime = c; gPrime = 0; bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  };
}

export function hslToString(hsl: HSL): string {
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
}

export function interpolateHsl(start: HSL, end: HSL, t: number): HSL {
  let hDiff = end.h - start.h;
  if (hDiff > 180) hDiff -= 360;
  if (hDiff < -180) hDiff += 360;

  return {
    h: (start.h + hDiff * t + 360) % 360,
    s: start.s + (end.s - start.s) * t,
    l: start.l + (end.l - start.l) * t,
  };
}

export function getLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

const MIN_CONTRAST_RATIO = 4.5;

export function ensureContrast(textColor: HSL, backgroundColor: RGB, isDark: boolean): HSL {
  const textRgb = hslToRgb(textColor);
  const ratio = getContrastRatio(textRgb, backgroundColor);

  if (ratio >= MIN_CONTRAST_RATIO) {
    return textColor;
  }

  const adjusted = { ...textColor };
  const step = isDark ? 5 : -5;
  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations) {
    adjusted.l = Math.max(0, Math.min(100, adjusted.l + step));
    const newRgb = hslToRgb(adjusted);
    const newRatio = getContrastRatio(newRgb, backgroundColor);

    if (newRatio >= MIN_CONTRAST_RATIO) {
      return adjusted;
    }
    iterations++;
  }

  return isDark ? { h: 0, s: 0, l: 90 } : { h: 0, s: 0, l: 15 };
}

export function adjustPaletteForTheme(palette: ColorPalette, isDark: boolean): HSL[] {
  const bgColor: RGB = isDark ? { r: 30, g: 41, b: 59 } : { r: 255, g: 255, b: 255 };

  return palette.colors.map((color) => {
    const adjusted = { ...color };
    if (isDark) {
      adjusted.l = Math.min(75, Math.max(50, color.l + 15));
      adjusted.s = Math.min(100, color.s + 10);
    } else {
      adjusted.l = Math.max(30, Math.min(50, color.l));
      adjusted.s = Math.min(100, color.s + 5);
    }
    return ensureContrast(adjusted, bgColor, isDark);
  });
}

