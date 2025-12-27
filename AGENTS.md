# Agent Instructions

Guidelines for AI agents working on this codebase.

## Project Overview

BionicMarkdown is a React/TypeScript application that combines Markdown editing with Bionic Reading technology. The app has a split-pane interface with an editor on the left and live preview on the right.

## Architecture

### Core Data Flow

1. User types Markdown in `MarkdownEditor`
2. Content passes through `markdownProcessor.ts`:
   - `renderMarkdown()` converts Markdown to HTML via markdown-it
   - `applyBionicReading()` processes text nodes with text-vide library
3. Optional gradient coloring applied via `gradientReading.ts`
4. Rendered in `Preview` component with sanitized HTML

### State Management

- All app state lives in `App.tsx`
- `useLocalStorage` hook persists state to browser storage
- `EditorContext` handles scroll synchronization between panels

### Key Files

- `src/App.tsx` - Main component, state management
- `src/utils/markdownProcessor.ts` - Markdown and Bionic processing
- `src/utils/gradientReading.ts` - Gradient coloring system
- `src/utils/colorUtils.ts` - Color manipulation utilities
- `src/types/index.ts` - TypeScript interfaces

## Code Conventions

### TypeScript

- Use interfaces for object shapes
- Explicit return types on exported functions
- No `any` types

### React

- Functional components only
- `useCallback` for event handlers passed as props
- `useMemo` for expensive computations
- Custom hooks in `src/hooks/`

### Styling

- Tailwind CSS for all styling
- Dark mode via `dark:` prefix classes
- No inline styles except for dynamic values

### File Organization

- One component per file
- Related utilities grouped in `utils/`
- Barrel exports via `index.ts` files

## Testing Changes

```bash
npm run build      # Verify production build succeeds
npm run typecheck  # Verify types are correct
npm run lint       # Verify linting passes
```

## Common Tasks

### Adding a New Setting

1. Add type to `src/types/index.ts`
2. Add default value in `App.tsx`
3. Add UI control in `SettingsPanel.tsx`
4. Wire up handler in `App.tsx`

### Modifying Bionic Processing

- Edit `src/utils/markdownProcessor.ts`
- `applyBionicReading()` handles text-vide integration
- Skip tags defined in `skipTags` Set (CODE, PRE, A, etc.)

### Adding Color Presets

- Edit `src/utils/colorUtils.ts`
- Add to `PRESETS` object with HSL colors
- Update `GradientPreset` type in `src/types/index.ts`

## Dependencies

Key external libraries:
- `markdown-it` - Markdown parsing
- `text-vide` - Bionic Reading text processing
- `dompurify` - HTML sanitization
- `lucide-react` - Icons
