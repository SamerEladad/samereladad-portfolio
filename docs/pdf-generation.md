# CV PDF Generation

This project automatically generates pixel-perfect A4 PDFs from HTML CV pages using Playwright.

## Overview

- **Source of truth**: `/resume/print-en.html` and `/resume/print-de.html`
- **Generated PDFs**: `/assets/cv/Samer-Eladad-CV-EN.pdf` and `/assets/cv/Samer-Eladad-CV-DE.pdf`
- **Generation method**: Playwright (Chromium) headless browser with print media emulation
- **Automation**: GitHub Actions workflow triggered on push to main

## Local Development

### Prerequisites

- Node.js 18 or higher
- npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

### Generate PDFs Locally

```bash
npm run generate-pdf
```

This will:
- Read `/resume/print-en.html` and `/resume/print-de.html`
- Generate PDFs with proper A4 formatting
- Save them to `/assets/cv/`

## Print CSS Requirements

The print HTML files use:
- `@page { size: A4 portrait; margin: 10mm 12mm; }`
- `@media print` rules for print-specific styling
- `print-color-adjust: exact` to preserve colors
- Explicit page breaks via `break-after: page`
- Two `.cv-card` elements (one per page)

## CI/CD

The GitHub Actions workflow (`.github/workflows/generate-pdf.yml`) runs automatically when:
- Resume HTML files are pushed to main
- The PDF generation script changes
- Manually triggered via workflow_dispatch

The workflow:
1. Checks out the repository
2. Installs Node.js and dependencies
3. Installs Playwright with Chromium
4. Generates PDFs
5. Commits and pushes PDFs back to the repository

## Download Links

The main CV page (`/resume/index.html`) dynamically updates download links based on language selection:
- English → `/assets/cv/Samer-Eladad-CV-EN.pdf`
- German → `/assets/cv/Samer-Eladad-CV-DE.pdf`

## Validation

Generated PDFs should:
- Be exactly 2 pages (A4)
- Match the visual layout of print HTML files
- Preserve all colors and fonts
- Have consistent margins (10mm top/bottom, 12mm left/right)
- Include proper page breaks between cards

## Troubleshooting

**Fonts not loading**: Ensure Google Fonts are accessible. The script waits for `document.fonts.ready` before generating PDFs.

**Page breaks incorrect**: Check that each `.cv-card` has `break-after: page` in the `@media print` block.

**Colors missing**: Verify `print-color-adjust: exact` is set in print CSS.

**File size too large**: Optimize images or reduce border-radius in print layout.
