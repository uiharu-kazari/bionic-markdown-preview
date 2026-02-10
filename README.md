# Bionic Markdown Preview

A Markdown editor with bold highlighting for faster, more focused reading.

**Live at [bionicmarkdown.com](https://bionicmarkdown.com)**

## Also Available On

| Platform | Link |
|----------|------|
| **Web App** | You are here! |
| **VS Code** | [Marketplace](https://marketplace.visualstudio.com/items?itemName=BionicMarkdown.bionic-markdown-preview) |
| **Chrome** | [GitHub](https://github.com/uiharu-kazari/chrome-bionic-preview) |

## Features

- **Bold Highlighting** - Emphasizes initial letters of words to guide eyes through text faster
- **Gradient Reading** - Optional color gradients for enhanced visual tracking
- **Live Preview** - Side-by-side editor with real-time preview
- **Customizable Settings** - Adjust fixation strength, fonts, colors, and more
- **Dark/Light Themes** - Full theme support
- **Export Options** - Copy or download processed HTML
- **Scroll Sync** - Synchronized scrolling between editor and preview
- **Local Storage** - Content and settings persist across sessions

## Getting Started

```bash
npm install
npm run dev
```

## Configuration

### Bold Highlighting Options

- **Fixation Point** (1-5) - Controls how much of each word is bolded
- **Highlight Tag** - HTML tag for emphasis (b, strong, mark, span)
- **Dim Opacity** - Opacity of non-highlighted text portions

### Gradient Reading Options

- **Presets** - Cool, Warm, Monochrome, High Contrast, Colorblind Friendly
- **Apply to Headings** - Include headings in gradient coloring
- **Apply to Links** - Include links in gradient coloring

### Editor Settings

- **Font Size** - Preview text size
- **Font Family** - Choose from Google Fonts
- **Line Height** - Text line spacing
- **Theme** - Light or dark mode

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- markdown-it
- text-vide (Bold highlighting engine)
- DOMPurify (HTML sanitization)

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run typecheck # TypeScript type checking
```

## Project Structure

```
src/
  components/     # React components
  contexts/       # React contexts (scroll sync)
  hooks/          # Custom hooks (debounce, localStorage)
  types/          # TypeScript type definitions
  utils/          # Processing utilities (markdown, colors, gradients)
```

## Roadmap

- [x] **Cursor Position Mapping** - Maintain cursor position correspondence between raw Markdown text and rendered preview, allowing click-to-navigate between panels
- [x] **Text Selection Mapping** - Synchronize text selection between editor and preview, highlighting the corresponding region in the opposite panel when text is selected
