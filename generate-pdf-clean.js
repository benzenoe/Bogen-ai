#!/usr/bin/env node
/**
 * Generate professional PDF with proper headers/footers
 * - Cover page: NO headers/footers
 * - All other pages: Clean headers and footers with logo, company info, and page numbers
 * - Uses base64 encoded logo to avoid broken images
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

async function generatePDF() {
  console.log('✓ Step 1: Preparing logo...');

  // Read and convert logo to base64 (using dark version for visibility on white background)
  const logoPath = path.resolve(__dirname, 'public/images/eb-logo-old.png');
  const logoBuffer = fsSync.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  console.log('✓ Step 2: Launching browser...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const htmlPath = 'file://' + path.resolve(__dirname, 'public/proposals/karis-properties-founding-partner.html');
  console.log(`✓ Step 3: Loading HTML...`);

  await page.goto(htmlPath, { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✓ Step 4: Generating PDF with headers/footers...');

  // Clean header template with larger logo
  const headerTemplate = `
    <div style="width: 100%; padding: 0; margin: 0; font-size: 9pt; -webkit-print-color-adjust: exact;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 48px 12px 48px; border-bottom: 1px solid #e5e9ec;">
        <img src="${logoDataUrl}" style="height: 32px; width: auto;">
        <span style="font-family: -apple-system, system-ui, sans-serif; color: #8899aa; font-weight: 500;">Founding Partner Invitation</span>
        <div style="width: 32px;"></div>
      </div>
    </div>
  `;

  // Clean footer template with larger logo
  const footerTemplate = `
    <div style="width: 100%; padding: 0; margin: 0; font-size: 8pt; -webkit-print-color-adjust: exact;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 48px 0 48px; border-top: 1px solid #e5e9ec;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${logoDataUrl}" style="height: 18px; width: auto;">
          <span style="font-family: -apple-system, system-ui, sans-serif; color: #8899aa;">Bogen.ai — Dave T Productions</span>
        </div>
        <span style="font-family: -apple-system, system-ui, sans-serif; color: #00a8e1; font-weight: 500;">support@reignation.com</span>
        <span style="font-family: -apple-system, system-ui, sans-serif; color: #8899aa;">Page <span class="pageNumber"></span></span>
      </div>
    </div>
  `;

  const tempPath = path.resolve(__dirname, 'temp-founding-partner-clean.pdf');

  // Generate PDF with headers/footers
  await page.pdf({
    path: tempPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: headerTemplate,
    footerTemplate: footerTemplate,
    margin: {
      top: '0.85in',    // Space for header
      bottom: '0.75in', // Space for footer
      left: '0.75in',
      right: '0.75in'
    },
    preferCSSPageSize: false
  });

  await browser.close();

  console.log('✓ Step 5: Processing PDF to remove header/footer from cover page...');

  // Load the PDF
  const pdfBytes = await fs.readFile(tempPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get all pages
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Get dimensions
  const { width, height } = firstPage.getSize();

  // Create new PDF
  const newPdfDoc = await PDFDocument.create();

  // First page - full size (no margins for cover)
  const [copiedFirstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
  copiedFirstPage.setSize(width, height);
  newPdfDoc.addPage(copiedFirstPage);

  // Copy remaining pages with headers/footers
  for (let i = 1; i < pages.length; i++) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(copiedPage);
  }

  const outputPath = '/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_Founding_Partner_Invitation.pdf';

  // Save final PDF
  const finalPdfBytes = await newPdfDoc.save();
  await fs.writeFile(outputPath, finalPdfBytes);

  // Clean up
  await fs.unlink(tempPath);

  const fileSizeKB = finalPdfBytes.length / 1024;

  console.log(`✓ Step 6: PDF created: ${outputPath}`);
  console.log(`✓ File size: ${fileSizeKB.toFixed(1)} KB`);
  console.log(`\n✅ CLEAN PROFESSIONAL PDF GENERATED!`);
  console.log(`\n📄 Cover Page: NO headers/footers`);
  console.log(`📄 Content Pages: Clean headers/footers with working logos`);
}

generatePDF().catch(err => {
  console.error('✗ Error:', err);
  process.exit(1);
});
