#!/usr/bin/env node
/**
 * Generate the Iryna Ferenets SEO & AI Search Visibility Proposal PDF.
 * - Cover page: NO headers/footers (full page)
 * - All other pages: header + footer with logo, brand info, page numbers
 * - Logo embedded as base64 data URL to avoid broken images
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

async function generatePDF() {
  console.log('✓ Step 1: Preparing logo...');
  const logoPath = path.resolve(__dirname, 'public/images/eb-logo-pdf.png');
  const logoBase64 = fsSync.readFileSync(logoPath).toString('base64');
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  console.log('✓ Step 2: Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const htmlPath = 'file://' + path.resolve(__dirname, 'public/proposals/iryna-ferenets-seo-proposal.html');
  console.log('✓ Step 3: Loading HTML...');
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('✓ Step 4: Generating PDF with headers/footers...');

  const headerTemplate = `
    <div style="width: 100%; padding: 0; margin: 0; font-size: 9pt; -webkit-print-color-adjust: exact;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 48px 12px 48px; border-bottom: 1px solid #e5e9ec;">
        <img src="${logoDataUrl}" style="height: 30px; width: auto;">
        <span style="font-family: -apple-system, system-ui, sans-serif; color: #8899aa; font-weight: 500;">SEO &amp; AI Search Visibility Proposal — Iryna Ferenets</span>
        <div style="width: 30px;"></div>
      </div>
    </div>
  `;

  const footerTemplate = `
    <div style="width: 100%; padding: 0; margin: 0; font-size: 8pt; -webkit-print-color-adjust: exact;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 48px 0 48px; border-top: 1px solid #e5e9ec;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${logoDataUrl}" style="height: 16px; width: auto;">
          <span style="font-family: -apple-system, system-ui, sans-serif; color: #8899aa;">Bogen.ai — A Division of Dave T Productions</span>
        </div>
        <span style="font-family: -apple-system, system-ui, sans-serif; color: #00a8e1; font-weight: 500;">eytan@benzeno.com</span>
        <span style="font-family: -apple-system, system-ui, sans-serif; color: #8899aa;">Page <span class="pageNumber"></span></span>
      </div>
    </div>
  `;

  const tempPath = path.resolve(__dirname, 'temp-iryna-pdf.pdf');

  await page.pdf({
    path: tempPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: { top: '0.85in', bottom: '0.75in', left: '0.6in', right: '0.6in' },
    preferCSSPageSize: false
  });

  await browser.close();

  console.log('✓ Step 5: Removing header/footer from cover page...');
  const pdfDoc = await PDFDocument.load(await fs.readFile(tempPath));
  const pages = pdfDoc.getPages();
  const { width, height } = pages[0].getSize();

  const newPdfDoc = await PDFDocument.create();
  const [cover] = await newPdfDoc.copyPages(pdfDoc, [0]);
  cover.setSize(width, height);
  newPdfDoc.addPage(cover);
  for (let i = 1; i < pages.length; i++) {
    const [p] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(p);
  }

  const outputPath = path.resolve(__dirname, 'public/proposals/iryna-ferenets-seo-proposal.pdf');
  const finalBytes = await newPdfDoc.save();
  await fs.writeFile(outputPath, finalBytes);
  await fs.unlink(tempPath);

  console.log(`✓ Step 6: PDF created: ${outputPath}`);
  console.log(`✓ File size: ${(finalBytes.length / 1024).toFixed(1)} KB`);
  console.log(`✓ Pages: ${pages.length}`);
  console.log('\n✅ PROPOSAL PDF GENERATED');
}

generatePDF().catch(err => {
  console.error('✗ Error:', err);
  process.exit(1);
});
