import { X, ALargeSmall, AlignJustify, Globe, MessageSquare, Heart, ExternalLink } from 'lucide-react';
import type { BionicOptions, EditorSettings, GradientOptions, GradientTheme } from '../types';
import { ALL_FONTS, loadGoogleFont, getFontFamilyCSS } from '../utils/fonts';
import { GRADIENT_THEME_LIST } from '../utils/colorUtils';
import { Slider } from './Slider';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, languageNames } from '../i18n/translations';

const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe7mHo47nveeSDXLTPIba4BBI_qcIORTk4ObJMY-Slf8xrrOQ/viewform?usp=dialog';

interface SettingsPanelProps {
  isOpen: boolean;
  bionicOptions: BionicOptions;
  gradientOptions: GradientOptions;
  editorSettings: EditorSettings;
  onClose: () => void;
  onBionicOptionsChange: (options: Partial<BionicOptions>) => void;
  onGradientOptionsChange: (options: Partial<GradientOptions>) => void;
  onEditorSettingsChange: (settings: Partial<EditorSettings>) => void;
}

const sansFonts = ALL_FONTS.filter(f => f.category === 'sans-serif');
const serifFonts = ALL_FONTS.filter(f => f.category === 'serif');
const monoFonts = ALL_FONTS.filter(f => f.category === 'monospace');

export function SettingsPanel({
  isOpen,
  bionicOptions,
  gradientOptions,
  editorSettings,
  onClose,
  onBionicOptionsChange,
  onGradientOptionsChange,
  onEditorSettingsChange,
}: SettingsPanelProps) {
  const { t, language, setLanguage } = useLanguage();
  const languages: Language[] = ['en', 'zh', 'fr', 'ja'];

  if (!isOpen) return null;

  const handlePreviewFontChange = (fontFamily: string) => {
    const font = ALL_FONTS.find(f => f.family === fontFamily);
    if (font) {
      loadGoogleFont(font.family);
      onEditorSettingsChange({ previewFontFamily: getFontFamilyCSS(font.family, font.category) });
    }
  };

  const getCurrentPreviewFont = () => {
    const font = ALL_FONTS.find(f => editorSettings.previewFontFamily.includes(f.family));
    return font?.family || 'Inter';
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-800 shadow-xl z-50 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t.settings}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide">
              {t.bionicReading}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {t.leading}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {bionicOptions.fixationPoint}
                  </span>
                </label>
                <Slider
                  min={1}
                  max={5}
                  value={bionicOptions.fixationPoint}
                  onChange={(e) => onBionicOptionsChange({ fixationPoint: Number(e.target.value) })}
                  className="w-full h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{t.less}</span>
                  <span>{t.more}</span>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {t.opacity}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {bionicOptions.dimOpacity}%
                  </span>
                </label>
                <Slider
                  min={0}
                  max={100}
                  value={bionicOptions.dimOpacity}
                  onChange={(e) => onBionicOptionsChange({ dimOpacity: Number(e.target.value) })}
                  className="w-full h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{t.hidden}</span>
                  <span>{t.full}</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-700" />

          <section>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide">
              {t.gradientReading}
            </h3>

            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-300 mb-2">
                {t.gradient}
              </label>
              <select
                value={gradientOptions.theme}
                onChange={(e) => onGradientOptionsChange({ theme: e.target.value as GradientTheme })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {GRADIENT_THEME_LIST.map((theme) => {
                  const themeName = t[`gradient${theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}` as keyof typeof t] || theme.name;
                  return (
                    <option key={theme.id} value={theme.id}>
                      {themeName}
                    </option>
                  );
                })}
              </select>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-700" />

          <section>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide">
              {t.typography}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-2">
                  {t.font}
                </label>
                <select
                  value={getCurrentPreviewFont()}
                  onChange={(e) => handlePreviewFontChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <optgroup label={t.sansSerif}>
                    {sansFonts.map(font => (
                      <option key={font.family} value={font.family}>{font.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label={t.serif}>
                    {serifFonts.map(font => (
                      <option key={font.family} value={font.family}>{font.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label={t.monospace}>
                    {monoFonts.map(font => (
                      <option key={font.family} value={font.family}>{font.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <ALargeSmall className="w-4 h-4" />
                    {t.size}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {editorSettings.fontSize}px
                  </span>
                </label>
                <Slider
                  min={12}
                  max={24}
                  value={editorSettings.fontSize}
                  onChange={(e) => onEditorSettingsChange({ fontSize: Number(e.target.value) })}
                  className="w-full h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <AlignJustify className="w-4 h-4" />
                    {t.lineHeight}
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {editorSettings.lineHeight}
                  </span>
                </label>
                <Slider
                  min={1.2}
                  max={2}
                  step={0.1}
                  value={editorSettings.lineHeight}
                  onChange={(e) => onEditorSettingsChange({ lineHeight: Number(e.target.value) })}
                  className="w-full h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-700" />

          <section>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 uppercase tracking-wide flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t.language}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => {
                const isSelected = language === lang;

                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                      ${isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {languageNames[lang]}
                  </button>
                );
              })}
            </div>

            <hr className="border-slate-200 dark:border-slate-700 mt-4" />

            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-4 flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{t.feedback}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0" />
            </a>

            <a
              href="https://ko-fi.com/illyasviel1120"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-2 flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {t.support}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors flex-shrink-0" />
            </a>
          </section>
        </div>
      </aside>
    </>
  );
}
