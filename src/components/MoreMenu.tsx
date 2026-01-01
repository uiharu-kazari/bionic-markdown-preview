import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, X, Globe, Github, Heart, ExternalLink, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, languageNames, languageCodes } from '../i18n/translations';

const languages: Language[] = ['en', 'zh', 'fr', 'ja'];
const KOFI_URL = 'https://ko-fi.com/illyasviel1120';
const GITHUB_URL = 'https://github.com/uiharu-kazari/bionic-markdown-preview';

export function MoreMenu() {
  const { t, language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setLanguageExpanded(false);
    }, 150);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeMenu]);

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      setIsOpen(true);
    }
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setLanguageExpanded(false);
  };


  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isOpen
            ? 'bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
        title={t.moreMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative w-4 h-4">
          <Menu
            className={`w-4 h-4 absolute inset-0 transition-all duration-200 ${
              isOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
            }`}
          />
          <X
            className={`w-4 h-4 absolute inset-0 transition-all duration-200 ${
              isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-150 origin-top-right ${
            isClosing
              ? 'opacity-0 scale-95 translate-y-[-4px]'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
          style={{
            animation: isClosing ? 'none' : 'menuSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <style>{`
            @keyframes menuSlideIn {
              from {
                opacity: 0;
                transform: scale(0.95) translateY(-8px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes itemFadeIn {
              from {
                opacity: 0;
                transform: translateX(-8px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>

          {/* Language Section */}
          <div className="p-1">
            <button
              onClick={() => setLanguageExpanded(!languageExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              style={{ animation: 'itemFadeIn 0.2s ease-out 0.05s both' }}
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{t.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {languageCodes[language]}
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    languageExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Language Options */}
            <div
              className={`overflow-hidden transition-all duration-200 ease-out ${
                languageExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="ml-7 pl-3 border-l-2 border-slate-200 dark:border-slate-600 space-y-0.5 py-1">
                {languages.map((lang, index) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      lang === language
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                    style={{
                      animation: languageExpanded
                        ? `itemFadeIn 0.15s ease-out ${index * 0.03}s both`
                        : 'none',
                    }}
                  >
                    <span>{languageNames[lang]}</span>
                    {lang === language && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 mx-2" />

          {/* GitHub */}
          <div className="p-1">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => closeMenu()}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              style={{ animation: 'itemFadeIn 0.2s ease-out 0.1s both' }}
            >
              <div className="flex items-center gap-3">
                <Github className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                <span>{t.github}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </a>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 mx-2" />

          {/* Support */}
          <div className="p-1">
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => closeMenu()}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors group"
              style={{ animation: 'itemFadeIn 0.2s ease-out 0.15s both' }}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {t.support}
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
