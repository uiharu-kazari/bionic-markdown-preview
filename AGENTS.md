# Agent Instructions

Guidelines for AI agents working on this codebase.

## Quick Reference

```bash
npm run dev        # Start dev server (port 5173)
npm run build      # Production build
npm run typecheck  # Type check
npm run lint       # ESLint
```

---

## Project Overview

**Bionic Markdown Preview** is a React/TypeScript editor that renders Markdown with "Bionic Reading" emphasis—bolding the initial portions of words to guide the eye for faster reading. It also supports optional gradient coloring for visual line tracking.

**Core Features:**
- Split-pane editor with synchronized scrolling
- Real-time Bionic Reading transformation via `text-vide`
- Gradient reading with per-line color interpolation
- Dark/light theme support
- i18n support (EN, ZH, FR, JA)
- Persistent settings via localStorage
- HTML export (copy/download)

---

## Architecture

### Component Hierarchy

```
main.tsx
└── LanguageProvider     # i18n context
    └── EditorProvider   # Scroll sync context
        └── App          # State container
            ├── Toolbar          # Controls (responsive: full toolbar ≥1440px, minimal + settings panel <1440px)
            ├── ResizablePanels  # Drag-resizable split view
            │   ├── MarkdownEditor   # Textarea with line numbers
            │   └── Preview          # Rendered HTML output
            └── SettingsPanel    # Slide-out settings (mobile/tablet)
```

### Data Flow

```
User input → MarkdownEditor
              ↓
         App.tsx (state)
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
renderMarkdown()    Settings
(markdown-it)           ↓
    ↓              Preview styles
DOMPurify.sanitize()
    ↓
applyBionicReading()  ← BionicOptions
(text-vide)
    ↓
Preview component
    ↓
applyGradientReading() ← GradientOptions (post-render, DOM-based)
```

### Key Processing Steps

1. **Markdown → HTML**: `markdown-it` parses Markdown with typographer, linkify, and line breaks enabled
2. **Sanitization**: DOMPurify allows only safe HTML tags/attributes
3. **Bionic Transform**: `text-vide` wraps initial word portions in `<b>` tags; non-bold text gets dimmed via opacity
4. **Gradient Coloring**: After render, walks the DOM to wrap emphasized text nodes in `<span>` elements with per-word HSL colors based on line position

---

## State Management

All application state lives in `App.tsx` using the `useLocalStorage` hook:

| State | Storage Key | Type | Purpose |
|-------|-------------|------|---------|
| `markdown` | `enhanced-md-content` | `string` | Editor content |
| `bionicOptions` | `enhanced-md-highlight` | `BionicOptions` | Fixation point, opacity, tag |
| `gradientOptions` | `enhanced-md-gradient` | `GradientOptions` | Theme, heading/link inclusion |
| `editorSettings` | `enhanced-md-settings` | `EditorSettings` | Font, size, line-height, theme, layout |

### Contexts

| Context | Location | Purpose |
|---------|----------|---------|
| `EditorContext` | `contexts/EditorContext.tsx` | Scroll sync between editor/preview via refs |
| `LanguageContext` | `contexts/LanguageContext.tsx` | i18n with browser language detection |

---

## File Reference

### Core Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component, state management, settings handlers |
| `src/main.tsx` | App bootstrap with context providers |
| `src/types/index.ts` | All TypeScript interfaces |

### Utilities

| File | Key Exports | Purpose |
|------|-------------|---------|
| `utils/markdownProcessor.ts` | `renderMarkdown()`, `applyBionicReading()`, `processMarkdownToBionic()` | Markdown parsing and Bionic transformation |
| `utils/gradientReading.ts` | `applyGradientReading()`, `removeGradient()`, `createGradientObserver()` | Post-render gradient coloring with ResizeObserver |
| `utils/colorUtils.ts` | `GRADIENT_THEME_LIST`, `interpolateHsl()`, `ensureContrast()`, `adjustPaletteForTheme()` | HSL manipulation, WCAG contrast checking |
| `utils/fonts.ts` | `GOOGLE_FONTS`, `SYSTEM_FONTS`, `loadGoogleFont()` | Dynamic Google Font loading |
| `utils/sourceMapping.ts` | `createMarkdownItWithSourceMap()`, `getSourceLineForElement()`, `scrollPreviewToLine()` | Source line mapping between editor and preview |

### Components

| Component | Props | Notes |
|-----------|-------|-------|
| `MarkdownEditor` | `value`, `onChange`, `settings` | Textarea with dynamic line numbers, text wrapping, Tab key handling |
| `Preview` | `markdown`, `bionicOptions`, `gradientOptions`, `settings`, `onBionicToggle` | Renders HTML, applies gradient post-mount |
| `ResizablePanels` | `leftPanel`, `rightPanel`, `direction`, `defaultSize`, `minSize`, `maxSize` | Horizontal/vertical split with drag handle |
| `Toolbar` | All options + handlers | Responsive: full controls ≥1440px, compact otherwise |
| `SettingsPanel` | All options + handlers | Slide-out panel for smaller screens |
| `FontSelector` | `value`, `onChange` | Dropdown with font preview |
| `GradientThemeSelector` | `value`, `onChange` | Theme dropdown with color swatches |
| `Slider` | `min`, `max`, `value`, `onChange`, `step?` | Custom styled range input |

---

## Code Conventions

### TypeScript

```typescript
// ✓ Use interfaces for object shapes
interface BionicOptions {
  enabled: boolean;
  fixationPoint: number;
}

// ✓ Explicit return types on exported functions
export function renderMarkdown(content: string): string { ... }

// ✗ Avoid `any`
```

### React Patterns

```typescript
// ✓ useCallback for handlers passed as props
const handleToggle = useCallback(() => {
  setBionicOptions(prev => ({ ...prev, enabled: !prev.enabled }));
}, [setBionicOptions]);

// ✓ useMemo for expensive computations
const processedHtml = useMemo(() => {
  return processMarkdownToBionic(markdown, bionicOptions);
}, [markdown, bionicOptions]);
```

### Styling

- Tailwind CSS only—no CSS modules or styled-components
- Dark mode via `dark:` prefix classes
- Responsive breakpoints: `min-[1440px]:` for desktop toolbar
- Dynamic values use inline `style` prop
- Typography plugin (`@tailwindcss/typography`) for prose styling in Preview

---

## Common Tasks

### Adding a New Setting

1. **Add type** to `src/types/index.ts`:
   ```typescript
   export interface EditorSettings {
     // ...existing
     newSetting: boolean;
   }
   ```

2. **Add default** in `App.tsx`:
   ```typescript
   const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
     // ...existing
     newSetting: false,
   };
   ```

3. **Add UI control** in `SettingsPanel.tsx` (and optionally `Toolbar.tsx` for ≥1440px)

4. **Wire up handler** in `App.tsx` (typically already handled by `handleEditorSettingsChange`)

### Adding a Gradient Theme

1. **Add theme ID** to `GradientTheme` union in `types/index.ts`:
   ```typescript
   export type GradientTheme = 'none' | 'ocean' | 'sunset' | 'forest' | 'berry' | 'newTheme';
   ```

2. **Add theme config** in `utils/colorUtils.ts`:
   ```typescript
   const GRADIENT_THEMES: Record<GradientTheme, GradientThemeConfig> = {
     // ...existing
     newTheme: {
       id: 'newTheme',
       name: 'New Theme',
       palette: {
         name: 'New Theme',
         colors: [
           { h: 200, s: 80, l: 45 },
           // 5 colors recommended for smooth cycling
         ],
       },
       previewColors: ['#hexcolor1', '#hexcolor2', ...], // for UI swatches
     },
   };
   ```

3. **Add translation keys** in `i18n/translations.ts`:
   ```typescript
   gradientNewTheme: 'New Theme',  // for each language
   ```

### Adding a New Language

1. **Add to Language type** in `i18n/translations.ts`:
   ```typescript
   export type Language = 'en' | 'zh' | 'fr' | 'ja' | 'de';
   ```

2. **Add translations object** with all keys from `Translations` interface

3. **Add to `languageNames` and `languageCodes`**

4. **Update detection** in `detectLanguage()` if needed

5. **Update valid check** in `LanguageContext.tsx`:
   ```typescript
   if (stored && ['en', 'zh', 'fr', 'ja', 'de'].includes(stored)) {
   ```

### Modifying Bionic Processing

The processing happens in `utils/markdownProcessor.ts`:

```typescript
// Skip certain tags from Bionic processing
const skipTags = new Set(['CODE', 'PRE', 'A', 'SCRIPT', 'STYLE']);

// text-vide options
textVide(text, {
  sep: [`<${tag}>`, `</${tag}>`],  // Wrapper tags for emphasized portion
  fixationPoint: 6 - options.fixationPoint,  // Inverted: higher setting = more bold
});
```

**Key considerations:**
- `fixationPoint` is inverted (user sees 1-5, text-vide gets 5-1)
- Dimming is applied via inline opacity styles to non-bold portions
- Links (`<a>`) are skipped to preserve clickability

### Adding Export Formats

The Preview component has `handleCopyHtml` and `handleDownloadHtml`. To add new formats:

1. Add handler in `Preview.tsx`
2. Add button to the header toolbar
3. Format the output (current HTML export includes inline styles for portability)

---

## Processing Pipeline Details

### Bionic Reading Algorithm

1. Parse HTML with `DOMParser`
2. Walk text nodes (skip CODE, PRE, A, SCRIPT, STYLE)
3. Call `text-vide()` which:
   - Splits words
   - Calculates fixation point (portion to bold)
   - Wraps in configured tag
4. Apply dimming opacity to non-emphasized text
5. Serialize back to HTML string

### Gradient Reading Algorithm

1. After HTML is rendered in DOM:
2. Walk text nodes inside `<b>`, `<strong>`, or `<mark>` tags (Bionic emphasis)
3. Wrap each word in a `<span data-gradient-word>`
4. Group spans by Y-position into lines (±3px tolerance)
5. Interpolate colors across each line from palette
6. Apply `style.color` to each span
7. Use ResizeObserver to reapply on container resize

### Source Line Mapping (Character-Precise Cursor Position & Selection Sync)

Enables bidirectional navigation and selection sync between editor and preview with **character-level precision**.

**How it works:**
1. Custom markdown-it renderer injects both line-level (`data-source-line`) and character-level (`data-source-start`, `data-source-end`) attributes
2. Text spans track their exact character positions in the source markdown
3. Uses `caretPositionFromPoint`/`caretRangeFromPoint` APIs for click-to-character mapping
4. DOMPurify allows all source mapping attributes

**Editor → Preview:**
- Click on a line number → scrolls preview to corresponding element with temporary highlight
- Select text in editor → highlights all preview elements that overlap the selection character range

**Preview → Editor:**
- Click on any word/text in preview → uses browser caret APIs to find exact click position
- Maps click position to source character offset → positions editor cursor precisely
- Focuses editor at the exact character position, not just the line

**Character mapping algorithm:**
1. Each text token gets wrapped in a span with `data-source-start` and `data-source-end` attributes
2. Markdown syntax (**, *, #, etc.) is stripped during position calculation
3. Click coordinates → caret position → source character offset → editor cursor

**Key files:**
- `utils/sourceMapping.ts` - markdown-it customization, character offset tracking, click position mapping
- `contexts/EditorContext.tsx` - character-based navigation and highlight state
- `components/Preview.tsx` - click handler using `getCharacterPositionFromClick()`

---

## Dependencies

| Package | Purpose | Usage |
|---------|---------|-------|
| `react` / `react-dom` | UI framework | Components |
| `markdown-it` | Markdown parser | `renderMarkdown()` |
| `text-vide` | Bionic Reading engine | `applyBionicReading()` |
| `dompurify` | HTML sanitization | XSS prevention |
| `lucide-react` | Icons | UI icons |
| `@tailwindcss/typography` | Prose styling | Preview article styles |
| `@supabase/supabase-js` | (Unused currently) | Future backend integration |

---

## Performance Considerations

1. **Debouncing**: Preview uses `useDebounce(html, 150)` to prevent excessive gradient recomputation

2. **Memoization**: `processedHtml` is memoized on `[markdown, bionicOptions]`

3. **RequestAnimationFrame**: Gradient application uses RAF for smooth rendering

4. **Observer Cleanup**: ResizeObserver and scroll listeners are properly cleaned up in useEffect returns

---

## Gotchas & Tips

- **Gradient only applies to emphasized text**: It walks `<b>`, `<strong>`, `<mark>` tags, not all text
- **Dark mode colors are auto-adjusted**: `adjustPaletteForTheme()` increases lightness for dark backgrounds
- **Scroll sync uses ratio-based positioning**: Works across different content heights
- **Font loading is lazy**: Google Fonts are loaded only when selected
- **Settings panel vs Toolbar**: <1440px shows settings panel, ≥1440px shows inline toolbar controls
- **Layout direction affects ResizablePanels**: `horizontal` = side-by-side, `vertical` = stacked
- **Source mapping is character-precise**: Uses `caretPositionFromPoint`/`caretRangeFromPoint` APIs to map clicks to exact source positions
- **Selection highlight auto-clears**: Preview highlights clear when editor loses focus
- **Markdown syntax stripped for mapping**: Bold markers (**), headings (#), etc. are handled correctly in position calculations
- **Editor text wrapping**: Text wraps in the editor (pre-wrap) and line numbers dynamically adjust height to match wrapped lines using `useLineHeights` hook with ResizeObserver
