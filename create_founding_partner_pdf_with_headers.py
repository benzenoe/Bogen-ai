#!/usr/bin/env python3
"""
Generate professional Karis Properties Founding Partner PDF with proper headers/footers
Uses Chrome Headless with embedded header/footer elements
"""

import subprocess
import tempfile
import os
from bs4 import BeautifulSoup

def create_pdf_with_proper_headers():
    """Create PDF with headers and footers on every page except cover"""

    # Read original HTML
    html_path = "/Users/eytan/claude-code/bogen-ai/public/proposals/karis-properties-founding-partner.html"
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    # Add header/footer template that will be injected before each section
    header_footer_html = '''
    <!-- Page Header (appears on all pages except cover) -->
    <div class="print-only page-header">
        <div class="header-left">
            <img src="https://bogen.ai/images/eb-logo.png" alt="Bogen.ai">
        </div>
        <div class="header-center">Founding Partner Invitation</div>
    </div>

    <!-- Page Footer (appears on all pages except cover) -->
    <div class="print-only page-footer">
        <div class="footer-left">
            <img src="https://bogen.ai/images/eb-logo.png" alt="Bogen.ai">
            <span>Bogen.ai — A Division of Dave T Productions</span>
        </div>
        <div class="footer-center">support@reignation.com</div>
        <div class="footer-right"></div>
    </div>
    '''

    # Add print-specific CSS for headers/footers
    print_css = '''
    <style>
        @media print {
            /* Cover page - full page, no headers/footers */
            .hero {
                min-height: 10.5in !important;
                page-break-after: always;
                margin: 0 !important;
                padding: 2.5rem 1.5rem 2rem 1.5rem !important;
            }

            /* Hide web-only elements */
            .nav, .btn-book, .theme-toggle { display: none !important; }
            .print-only { display: flex !important; }

            /* Page Header */
            .page-header {
                display: flex !important;
                justify-content: space-between;
                align-items: center;
                padding: 0.2in 0 0.15in 0;
                border-bottom: 1pt solid #e5e9ec;
                margin-bottom: 0.2in;
                position: relative;
            }

            .page-header img {
                height: 24px;
                width: auto;
            }

            .header-center {
                font-size: 9pt;
                color: #8899aa;
                font-weight: 500;
                letter-spacing: 0.02em;
                text-align: center;
                flex: 1;
            }

            /* Page Footer */
            .page-footer {
                display: flex !important;
                justify-content: space-between;
                align-items: center;
                padding: 0.15in 0 0.2in 0;
                border-top: 1pt solid #e5e9ec;
                margin-top: 0.3in;
                font-size: 8pt;
                color: #8899aa;
                position: relative;
            }

            .footer-left {
                display: flex;
                align-items: center;
                gap: 0.3rem;
            }

            .footer-left img {
                height: 16px;
                width: auto;
            }

            .footer-center {
                color: #00a8e1;
                font-weight: 500;
            }

            .footer-right::after {
                content: "Page " counter(page);
            }

            /* Content sections */
            .section {
                padding: 1rem 0;
                page-break-inside: avoid;
            }

            /* First section gets header before it */
            .section:first-of-type {
                margin-top: 0;
            }
        }

        /* Hide headers/footers on screen */
        .print-only {
            display: none;
        }
    </style>
    '''

    # Insert print CSS before closing head tag
    head_close = soup.find('head')
    if head_close:
        head_close.append(BeautifulSoup(print_css, 'html.parser'))

    # Find the first section after hero
    hero = soup.find('div', class_='hero')
    first_section = hero.find_next_sibling('div', class_='section') if hero else None

    # Insert header/footer before first content section
    if first_section:
        header_footer_soup = BeautifulSoup(header_footer_html, 'html.parser')
        first_section.insert_before(header_footer_soup)

    # Write modified HTML to temp file
    modified_html = str(soup)

    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        temp_html = f.name
        f.write(modified_html)

    print(f"✓ Generated HTML: {temp_html}")

    try:
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        output_path = "/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_Founding_Partner_Invitation.pdf"

        cmd = [
            chrome_path,
            '--headless=new',
            '--disable-gpu',
            '--no-pdf-header-footer',
            '--print-to-pdf=' + output_path,
            '--run-all-compositor-stages-before-draw',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            temp_html
        ]

        print(f"✓ Generating PDF with Chrome...")
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)

        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"✓ PDF created: {output_path}")
            print(f"✓ File size: {file_size / 1024:.1f} KB")
            print(f"✓ Temp HTML: {temp_html}")
        else:
            print("✗ PDF file was not created")

    except subprocess.TimeoutExpired:
        print("✗ PDF generation timed out")
        raise
    except subprocess.CalledProcessError as e:
        print(f"✗ Error generating PDF: {e}")
        if e.stderr:
            print(f"  stderr: {e.stderr}")
        raise

if __name__ == "__main__":
    create_pdf_with_proper_headers()
