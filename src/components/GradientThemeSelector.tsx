import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Ban } from 'lucide-react';
import type { GradientTheme } from '../types';
import { GRADIENT_THEME_LIST, type GradientThemeConfig } from '../utils/colorUtils';
import { useLanguage } from '../contexts/LanguageContext';

interface GradientThemeSelectorProps {
  value: GradientTheme;
  onChange: (theme: GradientTheme) => void;
  compact?: boolean;
}

function ThemePreview({ theme, size = 'normal' }: { theme: GradientThemeConfig; size?: 'normal' | 'small' }) {
  const sizeClass = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  if (theme.id === 'none') {
    return (
      <div className={`${sizeClass} rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center`}>
        <Ban className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex`}>
      {theme.previewColors.slice(0, 4).map((color, idx) => (
        <div
          key={idx}
          className="flex-1 h-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function GradientThemeSelector({ value, onChange, compact = false }: GradientThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = GRADIENT_THEME_LIST.find(t => t.id === value) || GRADIENT_THEME_LIST[0];

  const getThemeName = (theme: GradientThemeConfig) => {
    const key = `gradient${theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}` as keyof typeof t;
    return t[key] || theme.name;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 rounded-lg transition-colors
          ${compact
            ? 'px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
            : 'px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 w-[130px]'
          }
        `}
      >
        <ThemePreview theme={currentTheme} size="small" />
        <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 truncate text-left">
          {getThemeName(currentTheme)}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <div className="py-1">
            {GRADIENT_THEME_LIST.map((theme) => {
              const isSelected = value === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onChange(theme.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                    }
                  `}
                >
                  <ThemePreview theme={theme} />
                  <span className="text-sm flex-1">{getThemeName(theme)}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
