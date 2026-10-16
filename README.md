# Bionic Markdown Preview

A Markdown editor with adjustable word emphasis, optional gradients, and a plain preview for comparison.

**Latest release: [bionicmarkdown.com](https://www.bionicmarkdown.com/)**

Hosted on Cloudflare Pages Free. DNS and email forwarding stay with Spaceship.

## Also Available On

| Platform | Link |
|----------|------|
| **Web App** | You are here! |
| **VS Code** | [Marketplace](https://marketplace.visualstudio.com/items?itemName=BionicMarkdown.bionic-markdown-preview) |
| **Chrome** | [GitHub](https://github.com/uiharu-kazari/chrome-bionic-preview) |

## Features

- **Bold Highlighting** - Emphasizes initial letters of words for your preferred reading style
- **Gradient Reading** - Optional color gradients for enhanced visual tracking
- **Live Preview** - Side-by-side editor with real-time preview
- **Customizable Settings** - Adjust fixation strength, fonts, colors, and more
- **Dark/Light Themes** - Full theme support
- **Export Options** - Copy or download processed HTML
- **Scroll Sync** - Synchronized scrolling between editor and preview
- **Tab Session Storage** - Content and settings survive reloads in the same tab; save an export before closing it

## Getting Started

Use Node.js 22.12+ or 24+ (Vite 8).

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

- **Presets** - Ocean, Sunset, Forest, Berry, Lavender, Autumn, Mint, Twilight, Coffee, Monochrome, or None
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
  hooks/          # Custom hooks (debounce, sessionStorage)
  types/          # TypeScript type definitions
  utils/          # Processing utilities (markdown, colors, gradients)
```

## Roadmap

- [x] **Cursor Position Mapping** - Maintain cursor position correspondence between raw Markdown text and rendered preview, allowing click-to-navigate between panels
- [x] **Text Selection Mapping** - Synchronize text selection between editor and preview, highlighting the corresponding region in the opposite panel when text is selected

Reading preferences vary; speed, comprehension, and health benefits have not been measured for this app. Downloaded HTML includes the visible gradient, dimming, typography, and embedded math fonts. Optional Google Fonts and document images may still need a network connection.

## Release review

The 2026-10-08 candidate was checked with 117 unit/component tests, 12 Chromium workflows against both development and production builds, and 5 Electron/Cypress regressions. The audit report records the remaining development-only advisories and platform limits: [PRODUCT-ENGINEERING-AUDIT-2026-10-08.md](docs/PRODUCT-ENGINEERING-AUDIT-2026-10-08.md).

## Hosting

The production site uses Cloudflare Pages Free at https://www.bionicmarkdown.com/,
with https://bionic-markdown-preview.pages.dev as its fallback address. This is a
static app: no database, Functions, or custom server script is required.

```sh
npm run build
npx wrangler@4.148.0 pages deploy --branch main
```

The explicit Pages configuration uploads only `dist/`. Never upload the source
or project directory as static assets. GitHub pushes do not automatically deploy
this manually managed project.

```sh
BIONIC_LIVE_URL=https://www.bionicmarkdown.com npm run test:e2e
```

Spaceship remains the authoritative DNS provider. The `www` CNAME points to
`bionic-markdown-preview.pages.dev`; the root domain uses Spaceship's free HTTPS
URL redirect to `https://www.bionicmarkdown.com/`. The trailing slash preserves
page paths and query parameters. Keep the Spaceship nameservers,
DNSSEC, MX, SPF, ownership verification records, and existing email forwarding.
No domain transfer or paid hosting plan is needed. Cloudflare's subdomain setup
supports external DNS: https://developers.cloudflare.com/pages/configuration/custom-domains/.

The earlier Workers deployment remains a fallback at
https://bionic-markdown-preview.xucgphi.workers.dev. Its independent configuration
is `wrangler.worker.jsonc` (`wrangler deploy --config wrangler.worker.jsonc`); deploying Pages does not update that Worker. Leave the old
Bolt deployment intact until DNS caches have expired after migration.
