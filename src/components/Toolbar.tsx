import {
  Settings,
  Moon,
  Sun,
  Type,
  Palette,
  Columns,
  Rows,
  ALargeSmall,
  AlignJustify,
  Fullscreen,
  Minimize2,
} from 'lucide-react';
import type { BionicOptions, EditorSettings, GradientOptions } from '../types';
import { FontSelector } from './FontSelector';
import { GradientThemeSelector } from './GradientThemeSelector';
import { Slider } from './Slider';
import { MoreMenu } from './MoreMenu';
import { useLanguage } from '../contexts/LanguageContext';

interface ToolbarProps {
  bionicOptions: BionicOptions;
  gradientOptions: GradientOptions;
  editorSettings: EditorSettings;
  previewOnly: boolean;
  onBionicOptionsChange: (options: Partial<BionicOptions>) => void;
  onGradientOptionsChange: (options: Partial<GradientOptions>) => void;
  onEditorSettingsChange: (settings: Partial<EditorSettings>) => void;
  onSettingsToggle: () => void;
  onThemeToggle: () => void;
  onLayoutToggle: () => void;
  onPreviewOnlyToggle: () => void;
}

export function Toolbar({
  bionicOptions,
  gradientOptions,
  editorSettings,
  previewOnly,
  onBionicOptionsChange,
  onGradientOptionsChange,
  onEditorSettingsChange,
  onSettingsToggle,
  onThemeToggle,
  onLayoutToggle,
  onPreviewOnlyToggle,
}: ToolbarProps) {
  const { t } = useLanguage();

  return (
    <>
      <header className="flex items-center px-3 min-[1440px]:px-4 py-2 min-[1440px]:py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm overflow-visible relative z-20">
      <div className="flex items-center gap-2 min-[1440px]:gap-3 min-w-0 overflow-hidden relative z-0">
        {/* Bionic Icon - inverted colors for header */}
        <svg 
          className="w-6 h-6 min-[1440px]:w-7 min-[1440px]:h-7 flex-shrink-0" 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="16" height="16" rx="4" className="fill-slate-100 dark:fill-slate-700"/>
          <rect x="4" y="3" width="2" height="10" fill="#10b981"/>
          <rect x="8" y="4" width="4" height="2" fill="#10b981"/>
          <rect x="8" y="7" width="3" height="2" fill="#10b981"/>
          <rect x="8" y="10" width="5" height="2" fill="#10b981"/>
        </svg>
        <h1 className="text-base min-[1440px]:text-xl font-extrabold tracking-tight truncate">
          <span className="hidden sm:inline">
            <span className="text-emerald-500">Bio</span>
            <span className="text-slate-800 dark:text-white">nic </span>
            <span className="text-emerald-500">Mark</span>
            <span className="text-slate-800 dark:text-white">down </span>
            <span className="text-emerald-500">Pre</span>
            <span className="text-slate-800 dark:text-white">view</span>
          </span>
          <span className="sm:hidden">
            <span className="text-emerald-500">Bio</span>
            <span className="text-slate-800 dark:text-white">nic</span>
          </span>
        </h1>
      </div>

      <div className="hidden min-[1440px]:flex items-center justify-center flex-1 gap-3 min-w-0 mx-4 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.leading}</span>
            <Slider
              min={1}
              max={5}
              value={bionicOptions.fixationPoint}
              onChange={(e) => onBionicOptionsChange({ fixationPoint: Number(e.target.value) })}
              className="w-20 h-1.5 rounded-lg cursor-pointer flex-shrink-0"
              title={`${t.leading}: ${bionicOptions.fixationPoint}`}
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-4">{bionicOptions.fixationPoint}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{t.opacity}</span>
            <Slider
              min={0}
              max={100}
              value={bionicOptions.dimOpacity}
              onChange={(e) => onBionicOptionsChange({ dimOpacity: Number(e.target.value) })}
              className="w-16 h-1.5 rounded-lg cursor-pointer flex-shrink-0"
              title={`${t.opacity}: ${bionicOptions.dimOpacity}%`}
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-6">{bionicOptions.dimOpacity}%</span>
          </div>

        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 flex-shrink-0" />

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex-shrink-0 relative z-30">
          <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          <GradientThemeSelector
            value={gradientOptions.theme}
            onChange={(theme) => onGradientOptionsChange({ theme })}
          />
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 flex-shrink-0" />

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-2 relative z-30">
            <Type className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <FontSelector
              value={editorSettings.previewFontFamily}
              onChange={(fontFamily) => onEditorSettingsChange({ previewFontFamily: fontFamily })}
            />
          </div>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-600 flex-shrink-0" />

          <div className="flex items-center gap-1">
            <ALargeSmall className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <Slider
              min={12}
              max={24}
              value={editorSettings.fontSize}
              onChange={(e) => onEditorSettingsChange({ fontSize: Number(e.target.value) })}
              className="w-16 h-1.5 rounded-lg cursor-pointer flex-shrink-0"
              title={`${t.size}: ${editorSettings.fontSize}px`}
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-6">{editorSettings.fontSize}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex-shrink-0">
          <AlignJustify className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          <Slider
            min={1.2}
            max={2}
            step={0.1}
            value={editorSettings.lineHeight}
            onChange={(e) => onEditorSettingsChange({ lineHeight: Number(e.target.value) })}
            className="w-14 h-1.5 rounded-lg cursor-pointer flex-shrink-0"
            title={`${t.lineHeight}: ${editorSettings.lineHeight}`}
          />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-6">{editorSettings.lineHeight}</span>
        </div>
      </div>

      <div className="hidden min-[1440px]:flex items-center gap-1 flex-shrink-0 justify-end">
        <button
          onClick={onLayoutToggle}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={editorSettings.layout === 'horizontal' ? t.layoutVertical : t.layoutHorizontal}
        >
          {editorSettings.layout === 'horizontal' ? (
            <Columns className="w-4 h-4" />
          ) : (
            <Rows className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onPreviewOnlyToggle}
          className={`p-2 rounded-lg transition-colors ${
            previewOnly
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title={previewOnly ? t.exitPreviewOnly : t.previewOnly}
        >
          {previewOnly ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Fullscreen className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={t.toggleTheme}
        >
          {editorSettings.theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        <MoreMenu />
      </div>

      <div className="flex-1 min-[1440px]:hidden" />

      <div className="flex min-[1440px]:hidden items-center gap-1 flex-shrink-0">
        <button
          onClick={onLayoutToggle}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={editorSettings.layout === 'horizontal' ? t.layoutVertical : t.layoutHorizontal}
        >
          {editorSettings.layout === 'horizontal' ? (
            <Columns className="w-5 h-5" />
          ) : (
            <Rows className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onPreviewOnlyToggle}
          className={`p-2 rounded-lg transition-colors ${
            previewOnly
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title={previewOnly ? t.exitPreviewOnly : t.previewOnly}
        >
          {previewOnly ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Fullscreen className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={t.toggleTheme}
        >
          {editorSettings.theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onSettingsToggle}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={t.settings}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
      </header>
    </>
  );
}
