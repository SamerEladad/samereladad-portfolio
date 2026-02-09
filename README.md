# Samer Eladad Portfolio

Personal portfolio website with automated CV PDF generation.

## Features

- Responsive portfolio website
- Multilingual CV (English/German)
- Automated PDF generation from HTML using Playwright
- CI/CD pipeline for automatic PDF updates

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
npx playwright install chromium
```

### Development

The site is static HTML/CSS/JS. Open `index.html` in a browser to view.

### PDF Generation

Generate CV PDFs locally:

```bash
npm run generate-pdf
```

This creates:
- `assets/cv/Samer-Eladad-CV-EN.pdf`
- `assets/cv/Samer-Eladad-CV-DE.pdf`

## Project Structure

```
├── assets/
│   ├── cv/              # Generated PDF files
│   ├── images/          # Images and photos
│   └── logos/           # Logo assets
├── resume/
│   ├── index.html       # Web CV (scrollable)
│   ├── print-en.html    # English print layout
│   └── print-de.html    # German print layout
├── scripts/
│   ├── generate-pdf.js  # Playwright PDF generator
│   └── main.js          # Frontend scripts
├── styles/
│   ├── base.css         # Base styles
│   └── components.css   # Component styles
├── .github/workflows/
│   └── generate-pdf.yml # CI/CD for PDF generation
└── index.html           # Portfolio homepage
```

## CV System

The CV is maintained as HTML (single source of truth):
- `resume/print-en.html` and `resume/print-de.html` are 2-page A4 layouts
- PDFs are auto-generated on push to main via GitHub Actions
- Download links on `resume/index.html` update based on language selection

See [docs/pdf-generation.md](docs/pdf-generation.md) for details.

## Deployment

The site is deployed via GitHub Pages. PDFs are automatically updated when resume HTML changes.

## License

© 2026 Samer Eladad. All rights reserved.
