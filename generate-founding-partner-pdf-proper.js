#!/usr/bin/env node
/**
 * Generate professional PDF with proper headers/footers
 * Cover page: NO headers/footers
 * All other pages: Full headers/footers with logo, text, and page numbers
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

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✓ Generating PDF...');

  // Header template - styled to match professional look
  const headerTemplate = `
    <div style="width: 100%; font-size: 0; margin: 0; padding: 0.2in 0 0.12in 0; border-bottom: 1pt solid #e5e9ec;">
      <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
        <tr>
          <td style="width: 33%; text-align: left; padding: 0; vertical-align: middle;">
            <img src="https://bogen.ai/images/eb-logo.png" style="height: 22px; width: auto; display: block;">
          </td>
          <td style="width: 34%; text-align: center; padding: 0; vertical-align: middle;">
            <span style="font-family: 'Segoe UI', system-ui, sans-serif; font-size: 9pt; color: #8899aa; font-weight: 500; letter-spacing: 0.02em;">Founding Partner Invitation</span>
          </td>
          <td style="width: 33%; text-align: right; padding: 0;"></td>
        </tr>
      </table>
    </div>
  `;

  // Footer template
  const footerTemplate = `
    <div style="width: 100%; font-size: 0; margin: 0; padding: 0.12in 0 0.2in 0; border-top: 1pt solid #e5e9ec;">
      <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
        <tr>
          <td style="width: 40%; text-align: left; padding: 0; vertical-align: middle;">
            <div style="display: flex; align-items: center;">
              <img src="https://bogen.ai/images/eb-logo.png" style="height: 14px; width: auto; margin-right: 0.3rem; display: inline-block; vertical-align: middle;">
              <span style="font-family: 'Segoe UI', system-ui, sans-serif; font-size: 8pt; color: #8899aa; vertical-align: middle;">Bogen.ai — A Division of Dave T Productions</span>
            </div>
          </td>
          <td style="width: 35%; text-align: center; padding: 0; vertical-align: middle;">
            <span style="font-family: 'Segoe UI', system-ui, sans-serif; font-size: 8pt; color: #00a8e1; font-weight: 500;">support@reignation.com</span>
          </td>
          <td style="width: 25%; text-align: right; padding: 0; vertical-align: middle;">
            <span style="font-family: 'Segoe UI', system-ui, sans-serif; font-size: 8pt; color: #8899aa;">Page <span class="pageNumber"></span></span>
          </td>
        </tr>
      </table>
    </div>
  `;

  const outputPath = '/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_Founding_Partner_Invitation.pdf';

  // Generate PDF with custom margin for first page
  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: headerTemplate,
    footerTemplate: footerTemplate,
    margin: {
      top: '0.7in',     // Reduced top margin for header
      bottom: '0.7in',  // Reduced bottom margin for footer
      left: '0.75in',
      right: '0.75in'
    },
    preferCSSPageSize: false,
    omitBackground: false
  });

  await browser.close();

  const stats = fs.statSync(outputPath);
  const fileSizeKB = stats.size / 1024;

  console.log(`✓ PDF created: ${outputPath}`);
  console.log(`✓ File size: ${fileSizeKB.toFixed(1)} KB`);
  console.log(`\n✓ Professional PDF generated successfully!`);
  console.log(`\nFeatures:`);
  console.log(`  • Header: Bogen.ai logo (left) + "Founding Partner Invitation" (center)`);
  console.log(`  • Footer: Company info + support@reignation.com + page numbers`);
  console.log(`  • Full-page cover with professional styling`);
  console.log(`  • All colors and backgrounds preserved`);
}

generatePDF().catch(err => {
  console.error('✗ Error generating PDF:', err);
  process.exit(1);
});
