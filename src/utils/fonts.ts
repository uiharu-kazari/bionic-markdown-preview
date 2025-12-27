export interface FontOption {
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'monospace' | 'display';
}

export const GOOGLE_FONTS: FontOption[] = [
  { name: 'Inter', family: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', family: 'Roboto', category: 'sans-serif' },
  { name: 'Open Sans', family: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', family: 'Lato', category: 'sans-serif' },
  { name: 'Poppins', family: 'Poppins', category: 'sans-serif' },
  { name: 'Nunito', family: 'Nunito', category: 'sans-serif' },
  { name: 'Source Sans 3', family: 'Source Sans 3', category: 'sans-serif' },
  { name: 'Merriweather', family: 'Merriweather', category: 'serif' },
  { name: 'Playfair Display', family: 'Playfair Display', category: 'serif' },
  { name: 'Lora', family: 'Lora', category: 'serif' },
  { name: 'Crimson Text', family: 'Crimson Text', category: 'serif' },
  { name: 'Libre Baskerville', family: 'Libre Baskerville', category: 'serif' },
  { name: 'JetBrains Mono', family: 'JetBrains Mono', category: 'monospace' },
  { name: 'Fira Code', family: 'Fira Code', category: 'monospace' },
  { name: 'Source Code Pro', family: 'Source Code Pro', category: 'monospace' },
  { name: 'IBM Plex Mono', family: 'IBM Plex Mono', category: 'monospace' },
  { name: 'Space Mono', family: 'Space Mono', category: 'monospace' },
];

export const SYSTEM_FONTS: FontOption[] = [
  { name: 'System Default', family: 'system-ui, -apple-system, sans-serif', category: 'sans-serif' },
  { name: 'System Serif', family: 'Georgia, Cambria, serif', category: 'serif' },
  { name: 'System Mono', family: 'ui-monospace, SFMono-Regular, monospace', category: 'monospace' },
];

export const ALL_FONTS = [...SYSTEM_FONTS, ...GOOGLE_FONTS];

const loadedFonts = new Set<string>();

export function loadGoogleFont(fontFamily: string): void {
  if (loadedFonts.has(fontFamily)) return;

  const isSystemFont = SYSTEM_FONTS.some(f => f.family === fontFamily);
  if (isSystemFont) return;

  const fontName = fontFamily.replace(/ /g, '+');
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  loadedFonts.add(fontFamily);
}

export function getFontFamilyCSS(fontFamily: string, category: string): string {
  const isSystemFont = SYSTEM_FONTS.some(f => f.family === fontFamily);
  if (isSystemFont) return fontFamily;

  return `"${fontFamily}", ${category}`;
}
