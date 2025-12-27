import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ALL_FONTS, GOOGLE_FONTS, loadGoogleFont, getFontFamilyCSS, type FontOption } from '../utils/fonts';

interface FontSelectorProps {
  value: string;
  onChange: (fontFamily: string) => void;
}

const sansFonts = ALL_FONTS.filter(f => f.category === 'sans-serif');
const serifFonts = ALL_FONTS.filter(f => f.category === 'serif');
const monoFonts = ALL_FONTS.filter(f => f.category === 'monospace');

export function FontSelector({ value, onChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    GOOGLE_FONTS.forEach(font => loadGoogleFont(font.family));
    const timer = setTimeout(() => setFontsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFont = ALL_FONTS.find(f => value.includes(f.family));
  const currentFontName = currentFont?.name || 'Inter';

  const handleSelect = (font: FontOption) => {
    loadGoogleFont(font.family);
    onChange(getFontFamilyCSS(font.family, font.category));
    setIsOpen(false);
  };

  const renderFontOption = (font: FontOption) => {
    const isSelected = value.includes(font.family);
    const fontStyle = font.family.includes('system')
      ? { fontFamily: font.family }
      : { fontFamily: `"${font.family}", ${font.category}` };

    return (
      <button
        key={font.family}
        onClick={() => handleSelect(font)}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-left transition-colors
          ${isSelected
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
          }
        `}
        style={fontsLoaded ? fontStyle : undefined}
      >
        <span className="text-sm">{font.name}</span>
        {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
      </button>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors w-[140px]"
      >
        <span
          className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate text-left"
          style={fontsLoaded && currentFont ? { fontFamily: getFontFamilyCSS(currentFont.family, currentFont.category) } : undefined}
        >
          {currentFontName}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 max-h-80 overflow-y-auto">
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
              Sans-Serif
            </div>
            {sansFonts.map(renderFontOption)}

            <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 mt-1">
              Serif
            </div>
            {serifFonts.map(renderFontOption)}

            <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 mt-1">
              Monospace
            </div>
            {monoFonts.map(renderFontOption)}
          </div>
        </div>
      )}
    </div>
  );
}
