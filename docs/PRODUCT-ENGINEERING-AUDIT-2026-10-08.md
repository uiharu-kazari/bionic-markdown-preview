# Web product and engineering review — 2026-10-08

> This report records the review before publication. The user subsequently approved public source synchronization and the prepared release candidates; publication results are verified separately.

Prepared a local candidate; no public push or deployment. Baseline main 28f5846 was clean. The comprehensive local review, screenshots, candidate ZIP and checksums live in `../release-review-2026-10-08/` (outside this repository).

Implemented safe DOM word emphasis and Unicode handling, Markdown-aware math with original-source offsets and trust:false KaTeX/MathML, validated and resilient tab session storage, mobile focus trapping/Escape restoration, named controls/focus/reduced motion, pointer and keyboard pane resizing, Shift+Tab editor exit, and full styled HTML export with embedded offline math fonts. Removed unsupported reading-benefit claims, unused Supabase, and updated runtime/build dependencies. Added runtime dependency license notices. Stable identical highlight setters and a measurement-ref guard before dispatch resolve the observed React maximum-depth warning.

Verification on Node 24.4.0: 117 unit/component tests pass, typecheck/lint/build pass, 12 Chromium workflows pass on development and production builds, and 5 Cypress/Electron workflows pass with no previously observed repeated-render warning. Tests include malicious decoded text, code/math preservation, exact source offsets, storage failures, focus lifecycle, keyboard resize and offline export. Production screenshots were inspected; CUA independently verified editing/settings/export. Optional Google Fonts/document images remain network-dependent in exports.

Runtime dependency audit: 0 known reports. All-dependency audit: 5 high reports in development-only Tailwind 3 glob tooling (braces/chokidar/fast-glob/micromatch/tailwindcss), stemming from the braces deeply nested pattern exhaustion advisory. No patched braces version was available at inspection. Inputs are developer-controlled build/watch patterns; these tools do not ship in the browser. Patched Picomatch 2.3.2 and PostCSS selector parser 7.1.6 overrides removed the other reports and left generated app CSS/JS hashes unchanged. A Tailwind 4 migration remains separate verified maintenance work. Source/build checks are not a complete security certification.

Commands:

```sh
# Use supported Node (^22.12 or >=24); workspace Node 24 is recommended.
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
BIONIC_PRODUCTION_CHECK=1 npm run test:e2e
npm run test:cypress
npm audit --omit=dev
npm audit
git diff --check
```

The existing bionicmarkdown.com site responds through Netlify. Local deployment linkage/site ID and authenticated Netlify access remain unverified; publication must target that existing site after explicit public-release approval under the supplied global AGENTS.md. No new deployment should be created to bypass the missing linkage. Public GitHub source synchronization also requires that approval.

Remaining product limits: emphasis differs from Chrome/VS Code (information: Web 3/4/6/7/9 letters versus extensions 1/3/5/7/9 at settings 1–5), tab closure clears the draft session, custom colors/opacity are not universally contrast-certified, and no reading study, real touch hardware, full screen-reader matrix, other browser-engine matrix or very-large-document benchmark was performed. This release preserves existing saved preferences and makes no performance/health outcome promises.
