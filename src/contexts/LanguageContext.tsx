import { createContext, useContext, useEffect, ReactNode } from 'react';
import { Language, Translations, translations, detectLanguage } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

import { useSessionStorage } from '../hooks/useSessionStorage';

const isLanguage = (value: unknown): value is Language => typeof value === 'string' && ['en', 'zh', 'fr', 'ja'].includes(value);

const STORAGE_KEY = 'bionic-markdown-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useSessionStorage(STORAGE_KEY, detectLanguage(), isLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
