import { useState, useCallback, useEffect } from 'react';
import {
  Toolbar,
  SettingsPanel,
  MarkdownEditor,
  Preview,
  ResizablePanels,
} from './components';
import { useLocalStorage } from './hooks/useLocalStorage';
import { loadGoogleFont, ALL_FONTS } from './utils/fonts';
import type { BionicOptions, EditorSettings, GradientOptions } from './types';

const DEFAULT_MARKDOWN = `# Welcome to Bionic Markdown Preview

This editor combines **Markdown** editing with Bionic preview to help you read faster and with better focus.

## What is Bionic Preview?

Bionic preview guides the eyes through text by emphasizing the **initial letters** of words. This helps your brain complete words faster, resulting in:

- Faster reading speeds
- Better comprehension
- Reduced eye strain
- Improved focus

## How to Use

1. Type your Markdown in the **left panel**
2. See the live Bionic preview in the **right panel**
3. Toggle Bionic preview ON/OFF using the button in the toolbar
4. Adjust settings like bold amount using the settings panel

## Markdown Features

You can use all standard Markdown features:

### Text Formatting

- **Bold text** for emphasis
- *Italic text* for style
- ~~Strikethrough~~ for deletions

### Code

Inline \`code\` looks like this.

\`\`\`javascript
// Code blocks are not affected by Bionic preview
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Blockquotes

> "The only way to do great work is to love what you do."
> — Steve Jobs

### Lists

- Item one
- Item two
  - Nested item
  - Another nested item
- Item three

---

Start editing to see the magic happen!
`;

const DEFAULT_BIONIC_OPTIONS: BionicOptions = {
  enabled: true,
  fixationPoint: 3,
  highlightTag: 'b',
  highlightClass: '',
  dimOpacity: 80,
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
};

function App() {
  const [markdown, setMarkdown] = useLocalStorage('enhanced-md-content', DEFAULT_MARKDOWN);
  const [bionicOptions, setBionicOptions] = useLocalStorage('enhanced-md-highlight', DEFAULT_BIONIC_OPTIONS);
  const [gradientOptions, setGradientOptions] = useLocalStorage('enhanced-md-gradient', DEFAULT_GRADIENT_OPTIONS);
  const [editorSettings, setEditorSettings] = useLocalStorage('enhanced-md-settings', DEFAULT_EDITOR_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

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


  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
      <Toolbar
        bionicOptions={bionicOptions}
        gradientOptions={gradientOptions}
        editorSettings={editorSettings}
        onBionicOptionsChange={handleBionicOptionsChange}
        onGradientOptionsChange={handleGradientOptionsChange}
        onEditorSettingsChange={handleEditorSettingsChange}
        onSettingsToggle={() => setSettingsOpen(true)}
        onThemeToggle={handleThemeToggle}
        onLayoutToggle={handleLayoutToggle}
      />

      <main className="flex-1 overflow-hidden">
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
