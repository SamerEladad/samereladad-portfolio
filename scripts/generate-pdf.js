#!/usr/bin/env node

/**
 * Generate deterministic A4 PDFs from the print-ready HTML CV pages.
 * Uses Playwright's Chromium engine for pixel-perfect print rendering.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '../assets/cv');
const RESUME_DIR = path.join(__dirname, '../resume');

const PAGES = [
  {
    inputFile: 'print-en.html',
    outputFile: 'Samer-Eladad-CV-EN.pdf',
    lang: 'English'
  },
  {
    inputFile: 'print-de.html',
    outputFile: 'Samer-Eladad-CV-DE.pdf',
    lang: 'German'
  }
];

async function generatePDFs() {
  console.log('🚀 Starting PDF generation with Playwright...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created output directory: ${OUTPUT_DIR}\n`);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });

  try {
    for (const page of PAGES) {
      const inputPath = path.join(RESUME_DIR, page.inputFile);
      const outputPath = path.join(OUTPUT_DIR, page.outputFile);

      if (!fs.existsSync(inputPath)) {
        console.error(`❌ Input file not found: ${inputPath}`);
        process.exit(1);
      }

      console.log(`📄 Generating ${page.lang} PDF...`);
      console.log(`   Input:  ${path.relative(process.cwd(), inputPath)}`);
      console.log(`   Output: ${path.relative(process.cwd(), outputPath)}`);

      const context = await browser.newContext();
      const browserPage = await context.newPage();

      // Load the HTML file
      await browserPage.goto(`file://${inputPath}`, {
        waitUntil: 'networkidle'
      });

      // Wait for fonts to load
      await browserPage.evaluate(() => document.fonts.ready);

      // Generate PDF with print media emulation
      await browserPage.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '12mm',
          bottom: '10mm',
          left: '12mm'
        },
        preferCSSPageSize: false
      });

      await context.close();

      // Check file size for basic validation
      const stats = fs.statSync(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ✓ Generated: ${fileSizeKB} KB\n`);
    }

    console.log('✅ All PDFs generated successfully!');
  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the script
generatePDFs().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
