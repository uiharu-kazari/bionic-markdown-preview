import { describe, it, expect, beforeEach } from 'vitest';
import {
  ALL_FONTS,
  SYSTEM_FONTS,
  GOOGLE_FONTS,
  loadGoogleFont,
  getFontFamilyCSS,
} from './fonts';

describe('font catalogues', () => {
  it('ALL_FONTS is system fonts followed by google fonts', () => {
    expect(ALL_FONTS).toEqual([...SYSTEM_FONTS, ...GOOGLE_FONTS]);
  });

  it('every font declares a known category', () => {
    const categories = new Set(['serif', 'sans-serif', 'monospace', 'display']);
    for (const f of ALL_FONTS) {
      expect(categories.has(f.category)).toBe(true);
      expect(f.name).toBeTruthy();
      expect(f.family).toBeTruthy();
    }
  });
});

describe('getFontFamilyCSS', () => {
  it('returns a system font family verbatim (already a full stack)', () => {
    const sys = SYSTEM_FONTS[0];
    expect(getFontFamilyCSS(sys.family, sys.category)).toBe(sys.family);
  });

  it('quotes a Google font and appends the category fallback', () => {
    expect(getFontFamilyCSS('Inter', 'sans-serif')).toBe('"Inter", sans-serif');
  });
});

describe('loadGoogleFont', () => {
  beforeEach(() => {
    document.head.querySelectorAll('link').forEach((l) => l.remove());
  });

  it('injects a stylesheet <link> for a Google font', () => {
    loadGoogleFont('Roboto');
    const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
    expect(link).not.toBeNull();
    expect(link.href).toContain('fonts.googleapis.com');
    expect(link.href).toContain('Roboto');
  });

  it('encodes spaces in multi-word family names', () => {
    loadGoogleFont('Open Sans');
    const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
    expect(link.href).toContain('Open+Sans');
  });

  it('does not inject a link for system fonts', () => {
    loadGoogleFont(SYSTEM_FONTS[0].family);
    expect(document.head.querySelector('link[rel="stylesheet"]')).toBeNull();
  });

  it('loads a given family only once (caches across calls)', () => {
    // 'Lato' may have been cached by an earlier test run in this module; use a
    // family touched only here to assert the de-dupe behaviour deterministically.
    loadGoogleFont('Poppins');
    loadGoogleFont('Poppins');
    const links = document.head.querySelectorAll('link[rel="stylesheet"]');
    const poppins = [...links].filter((l) =>
      (l as HTMLLinkElement).href.includes('Poppins')
    );
    expect(poppins).toHaveLength(1);
  });
});
