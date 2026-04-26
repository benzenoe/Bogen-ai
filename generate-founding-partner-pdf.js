#!/usr/bin/env node
/**
 * Generate professional Karis Properties Founding Partner PDF with proper headers/footers
 * Uses Puppeteer for full control over PDF generation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  console.log('✓ Launching browser...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Load the HTML file
  const htmlPath = 'file://' + path.resolve(__dirname, 'public/proposals/karis-properties-founding-partner.html');
  console.log(`✓ Loading: ${htmlPath}`);

  await page.goto(htmlPath, {
    waitUntil: 'networkidle0'
  });

  // Wait for any dynamic content to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Inject CSS to hide headers/footers on the first page (cover page)
  await page.addStyleTag({
    content: `
      @page :first {
        margin: 0 !important;
      }
      @media print {
        /* Force cover page to be full page with no margin */
        .hero {
          margin: 0 !important;
          padding: 2.5rem 1.5rem 2rem 1.5rem !important;
          min-height: 10.5in !important;
        }
      }
    `
  });

  console.log('✓ Generating PDF with headers and footers...');

  // Header template (will appear on all pages except first)
  const headerTemplate = `
    <div style="width: 100%; font-size: 9pt; padding: 0 0.75in; margin: 0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1pt solid #e5e9ec; padding-bottom: 0.15in;">
      <div style="display: flex; align-items: center;">
        <img src="https://bogen.ai/images/eb-logo.png" style="height: 22px; width: auto;">
      </div>
      <div style="color: #8899aa; font-weight: 500; letter-spacing: 0.02em; font-family: 'Segoe UI', system-ui, sans-serif;">
        Founding Partner Invitation
      </div>
      <div style="width: 22px;"></div>
    </div>
  `;

  // Footer template (will appear on all pages except first)
  const footerTemplate = `
    <div style="width: 100%; font-size: 8pt; padding: 0 0.75in; margin: 0; display: flex; justify-content: space-between; align-items: center; color: #8899aa; border-top: 1pt solid #e5e9ec; padding-top: 0.15in; font-family: 'Segoe UI', system-ui, sans-serif;">
      <div style="display: flex; align-items: center; gap: 0.3rem;">
        <img src="https://bogen.ai/images/eb-logo.png" style="height: 14px; width: auto; margin-right: 0.3rem;">
        <span>Bogen.ai — A Division of Dave T Productions</span>
      </div>
      <div style="color: #00a8e1; font-weight: 500;">
        support@reignation.com
      </div>
      <div style="color: #8899aa;">
        Page <span class="pageNumber"></span>
      </div>
    </div>
  `;

  // Generate PDF
  const outputPath = '/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_Founding_Partner_Invitation.pdf';

  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: headerTemplate,
    footerTemplate: footerTemplate,
    margin: {
      top: '1in',      // Space for header
      bottom: '0.85in', // Space for footer
      left: '0.75in',
      right: '0.75in'
    },
    preferCSSPageSize: false
  });

  await browser.close();

  // Check file size
  const stats = fs.statSync(outputPath);
  const fileSizeKB = stats.size / 1024;

  console.log(`✓ PDF created: ${outputPath}`);
  console.log(`✓ File size: ${fileSizeKB.toFixed(1)} KB`);
  console.log(`\n✓ Professional PDF with headers and footers generated successfully!`);
  console.log(`\nHeader includes: Bogen.ai logo + "Founding Partner Invitation"`);
  console.log(`Footer includes: Company info + support@reignation.com + page numbers`);
}

generatePDF().catch(err => {
  console.error('✗ Error generating PDF:', err);
  process.exit(1);
});
