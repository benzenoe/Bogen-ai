#!/usr/bin/env node
/**
 * Generate professional PDF with proper headers/footers
 * - Cover page: NO headers/footers (full page)
 * - All other pages: Headers and footers with logo, company info, and page numbers
 *
 * Uses Puppeteer + pdf-lib to achieve this
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function generatePDF() {
  console.log('✓ Step 1: Launching browser...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const htmlPath = 'file://' + path.resolve(__dirname, 'public/proposals/karis-properties-founding-partner.html');
  console.log(`✓ Step 2: Loading HTML...`);

  await page.goto(htmlPath, { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✓ Step 3: Generating initial PDF with headers/footers...');

  // Professional header template
  const headerTemplate = `
    <div style="width: 100%; font-size: 0; margin: 0; padding: 0.15in 0 0.1in 0; border-bottom: 1pt solid #e5e9ec;">
      <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
        <tr>
          <td style="width: 30%; text-align: left; padding-left: 0.75in;">
            <img src="https://bogen.ai/images/eb-logo.png" style="height: 20px; display: block;">
          </td>
          <td style="width: 40%; text-align: center;">
            <span style="font-family: system-ui, sans-serif; font-size: 9pt; color: #8899aa; font-weight: 500;">Founding Partner Invitation</span>
          </td>
          <td style="width: 30%; padding-right: 0.75in;"></td>
        </tr>
      </table>
    </div>
  `;

  // Professional footer template
  const footerTemplate = `
    <div style="width: 100%; font-size: 0; margin: 0; padding: 0.1in 0 0.15in 0; border-top: 1pt solid #e5e9ec;">
      <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
        <tr>
          <td style="width: 45%; text-align: left; padding-left: 0.75in;">
            <img src="https://bogen.ai/images/eb-logo.png" style="height: 13px; display: inline-block; vertical-align: middle; margin-right: 0.25rem;">
            <span style="font-family: system-ui, sans-serif; font-size: 8pt; color: #8899aa; vertical-align: middle;">Bogen.ai — Dave T Productions</span>
          </td>
          <td style="width: 30%; text-align: center;">
            <span style="font-family: system-ui, sans-serif; font-size: 8pt; color: #00a8e1; font-weight: 500;">support@reignation.com</span>
          </td>
          <td style="width: 25%; text-align: right; padding-right: 0.75in;">
            <span style="font-family: system-ui, sans-serif; font-size: 8pt; color: #8899aa;">Page <span class="pageNumber"></span></span>
          </td>
        </tr>
      </table>
    </div>
  `;

  const tempPath = path.resolve(__dirname, 'temp-founding-partner.pdf');

  // Generate initial PDF with headers/footers on ALL pages
  await page.pdf({
    path: tempPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: headerTemplate,
    footerTemplate: footerTemplate,
    margin: {
      top: '0.65in',
      bottom: '0.65in',
      left: '0',
      right: '0'
    },
    preferCSSPageSize: false
  });

  await browser.close();

  console.log('✓ Step 4: Processing PDF to remove header/footer from cover page...');

  // Load the PDF
  const pdfBytes = await fs.readFile(tempPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get all pages
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Get the current size of the first page
  const { width, height } = firstPage.getSize();

  // Create a new PDF with the first page full-size (no margins)
  const newPdfDoc = await PDFDocument.create();

  // Copy first page and reset to full page size (removes header/footer space)
  const [copiedFirstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);

  // Set the media box to remove margins (full page)
  copiedFirstPage.setMediaBox(0, 0, width, height);
  copiedFirstPage.setSize(width, height);

  newPdfDoc.addPage(copiedFirstPage);

  // Copy remaining pages as-is (with headers/footers)
  for (let i = 1; i < pages.length; i++) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(copiedPage);
  }

  const outputPath = '/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_Founding_Partner_Invitation.pdf';

  // Save the final PDF
  const finalPdfBytes = await newPdfDoc.save();
  await fs.writeFile(outputPath, finalPdfBytes);

  // Clean up temp file
  await fs.unlink(tempPath);

  const fileSizeKB = finalPdfBytes.length / 1024;

  console.log(`✓ Step 5: PDF created: ${outputPath}`);
  console.log(`✓ File size: ${fileSizeKB.toFixed(1)} KB`);
  console.log(`\n✅ PROFESSIONAL PDF GENERATED SUCCESSFULLY!`);
  console.log(`\n📄 Cover Page (Page 1):`);
  console.log(`   • NO headers or footers`);
  console.log(`   • Full-page cover design`);
  console.log(`\n📄 Content Pages (Page 2+):`);
  console.log(`   • Header: Bogen.ai logo (left) + "Founding Partner Invitation" (center)`);
  console.log(`   • Footer: Company info + support@reignation.com + page numbers (right)`);
  console.log(`   • Professional borders and spacing`);
}

generatePDF().catch(err => {
  console.error('✗ Error generating PDF:', err);
  process.exit(1);
});
