import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Toolbar,
  SettingsPanel,
  MarkdownEditor,
  Preview,
  ResizablePanels,
} from './components';
import { useLocalStorage } from './hooks/useLocalStorage';
import { loadGoogleFont, ALL_FONTS } from './utils/fonts';
import { useLanguage } from './contexts/LanguageContext';
import { defaultMarkdown } from './i18n/translations';
import type { BionicOptions, EditorSettings, GradientOptions } from './types';

const DEFAULT_BIONIC_OPTIONS: BionicOptions = {
  enabled: true,
  fixationPoint: 3,
  highlightTag: 'b',
  highlightClass: '',
  dimOpacity: 62,
};

const DEFAULT_GRADIENT_OPTIONS: GradientOptions = {
  theme: 'none',
  applyToHeadings: false,
  applyToLinks: false,
};

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 16,
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  lineHeight: 1.6,
  theme: 'light',
  previewFontFamily: '"Inter", sans-serif',
  layout: 'horizontal',
  wordWrap: true, // Enable by default for better scroll sync
};

// Check if content matches any language's default
function isDefaultContent(content: string): boolean {
  return Object.values(defaultMarkdown).some(
    (defaultContent) => content.trim() === defaultContent.trim()
  );
}

function App() {
  const { language } = useLanguage();
  const [markdown, setMarkdown] = useLocalStorage('enhanced-md-content', defaultMarkdown.en);
  const [bionicOptions, setBionicOptions] = useLocalStorage('enhanced-md-highlight', DEFAULT_BIONIC_OPTIONS);
  const [gradientOptions, setGradientOptions] = useLocalStorage('enhanced-md-gradient', DEFAULT_GRADIENT_OPTIONS);
  const [editorSettings, setEditorSettings] = useLocalStorage('enhanced-md-settings', DEFAULT_EDITOR_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const prevLanguageRef = useRef(language);

  useEffect(() => {
    if (editorSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [editorSettings.theme]);

  useEffect(() => {
    const previewFont = ALL_FONTS.find(f => editorSettings.previewFontFamily.includes(f.family));
    if (previewFont) loadGoogleFont(previewFont.family);
  }, [editorSettings.previewFontFamily]);

  // Update content when language changes, but only if it's still the default content
  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      if (isDefaultContent(markdown)) {
        setMarkdown(defaultMarkdown[language]);
      }
      prevLanguageRef.current = language;
    }
  }, [language, markdown, setMarkdown]);

  // Auto-switch to vertical layout on narrow screens (only on first load)
  const NARROW_THRESHOLD = 768;
  const initialLayoutCheckRef = useRef(false);
  useEffect(() => {
    if (!initialLayoutCheckRef.current) {
      initialLayoutCheckRef.current = true;
      if (window.innerWidth < NARROW_THRESHOLD && editorSettings.layout === 'horizontal') {
        setEditorSettings((prev) => ({ ...prev, layout: 'vertical' }));
      }
    }
  }, [editorSettings.layout, setEditorSettings]);

  const handleBionicToggle = useCallback(() => {
    setBionicOptions((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, [setBionicOptions]);

  const handleBionicOptionsChange = useCallback((updates: Partial<BionicOptions>) => {
    setBionicOptions((prev) => ({ ...prev, ...updates }));
  }, [setBionicOptions]);

  const handleGradientOptionsChange = useCallback((updates: Partial<GradientOptions>) => {
    setGradientOptions((prev) => ({ ...prev, ...updates }));
  }, [setGradientOptions]);

  const handleEditorSettingsChange = useCallback((updates: Partial<EditorSettings>) => {
    setEditorSettings((prev) => ({ ...prev, ...updates }));
  }, [setEditorSettings]);

  const handleThemeToggle = useCallback(() => {
    setEditorSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  }, [setEditorSettings]);

  const handleLayoutToggle = useCallback(() => {
    setEditorSettings((prev) => ({
      ...prev,
      layout: prev.layout === 'horizontal' ? 'vertical' : 'horizontal',
    }));
  }, [setEditorSettings]);

  const handlePreviewOnlyToggle = useCallback(() => {
    setPreviewOnly((prev) => !prev);
  }, []);


  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
      <Toolbar
        bionicOptions={bionicOptions}
        gradientOptions={gradientOptions}
        editorSettings={editorSettings}
        previewOnly={previewOnly}
        onBionicOptionsChange={handleBionicOptionsChange}
        onGradientOptionsChange={handleGradientOptionsChange}
        onEditorSettingsChange={handleEditorSettingsChange}
        onSettingsToggle={() => setSettingsOpen(true)}
        onThemeToggle={handleThemeToggle}
        onLayoutToggle={handleLayoutToggle}
        onPreviewOnlyToggle={handlePreviewOnlyToggle}
      />

      <main className="flex-1 overflow-hidden">
        {previewOnly ? (
          <Preview
            markdown={markdown}
            bionicOptions={bionicOptions}
            gradientOptions={gradientOptions}
            settings={editorSettings}
            onBionicToggle={handleBionicToggle}
          />
        ) : (
          <ResizablePanels
            leftPanel={
              <MarkdownEditor
                value={markdown}
                onChange={setMarkdown}
                settings={editorSettings}
              />
            }
            rightPanel={
              <Preview
                markdown={markdown}
                bionicOptions={bionicOptions}
                gradientOptions={gradientOptions}
                settings={editorSettings}
                onBionicToggle={handleBionicToggle}
              />
            }
            defaultSize={50}
            minSize={25}
            maxSize={75}
            direction={editorSettings.layout}
          />
        )}
      </main>

      <SettingsPanel
        isOpen={settingsOpen}
        bionicOptions={bionicOptions}
        gradientOptions={gradientOptions}
        editorSettings={editorSettings}
        onClose={() => setSettingsOpen(false)}
        onBionicOptionsChange={handleBionicOptionsChange}
        onGradientOptionsChange={handleGradientOptionsChange}
        onEditorSettingsChange={handleEditorSettingsChange}
      />
    </div>
  );
}

export default App;
