#!/usr/bin/env python3
"""
Generate PROFESSIONAL Karis Properties proposal PDF with headers, footers, page numbers
Uses the EXACT same approach as the DTP Service Agreement
"""

import subprocess
import tempfile
import os
from bs4 import BeautifulSoup

def create_professional_proposal_pdf():
    """Create a professional proposal PDF like the DTP contract"""

    # Read original HTML to extract content
    html_path = "/Users/eytan/claude-code/bogen-ai/public/proposals/karis-properties-usa-proposal.html"
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    # Extract all section content
    sections = soup.find_all('div', class_='section')
    content_html = ""

    for section in sections:
        # Remove any script tags
        for script in section.find_all('script'):
            script.decompose()
        # Remove interactive elements
        for elem in section.find_all(['input', 'button']):
            elem.decompose()
        content_html += str(section).replace('class="section"', '')

    # Create professional PDF HTML with proper headers/footers
    pdf_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karis Properties USA — Website Development Proposal</title>
    <style>
        @page {
            size: letter;
            margin: 0.9in 0.75in;
        }

        @page :first {
            margin: 0;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1a2332;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            counter-reset: page-number;
        }

        /* Headers */
        @page:not(:first) {
            @top-left {
                content: "Karis Properties USA";
                font-family: Helvetica, Arial, sans-serif;
                font-size: 9pt;
                color: #5a6c7d;
                font-weight: 600;
            }
            @top-right {
                content: "Website Development Proposal";
                font-family: Helvetica, Arial, sans-serif;
                font-size: 9pt;
                color: #5a6c7d;
                text-align: right;
            }
        }

        /* Footers */
        @page:not(:first) {
            @bottom-left {
                content: "Bogen.ai — A Division of Dave T Productions";
                font-family: Helvetica, Arial, sans-serif;
                font-size: 8pt;
                color: #8899aa;
            }
            @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-family: Helvetica, Arial, sans-serif;
                font-size: 8pt;
                color: #8899aa;
                text-align: right;
            }
        }

        /* Header line */
        .page-header {
            position: fixed;
            top: 0.3in;
            left: 0.75in;
            right: 0.75in;
            display: flex;
            justify-content: space-between;
            font-size: 9pt;
            color: #5a6c7d;
            padding-bottom: 0.15in;
            border-bottom: 0.5pt solid #e5e9ec;
            font-weight: 600;
        }

        .page-footer {
            position: fixed;
            bottom: 0.3in;
            left: 0.75in;
            right: 0.75in;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #8899aa;
            padding-top: 0.15in;
            border-top: 0.5pt solid #e5e9ec;
        }

        .cover-page ~ .page-header,
        .cover-page ~ .page-footer {
            display: none;
        }

        /* COVER PAGE */
        .cover-page {
            background: #0d1620 !important;
            color: white !important;
            text-align: center;
            padding: 2.5in 1in 2in 1in;
            min-height: 10.5in;
            page-break-after: always;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .cover-logos {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .cover-logos img {
            height: 55px;
        }

        .cover-logo-sep {
            font-size: 2rem;
            color: rgba(0, 168, 225, 0.5);
            font-weight: 300;
        }

        .cover-badge {
            display: inline-block;
            background: rgba(0, 168, 225, 0.15);
            border: 1px solid rgba(0, 168, 225, 0.4);
            color: #00a8e1 !important;
            padding: 0.5rem 1.5rem;
            border-radius: 50px;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 1.5rem;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .cover-page h1 {
            font-size: 42pt;
            font-weight: 300;
            letter-spacing: 0.02em;
            margin: 0 0 0.3in 0;
            color: white !important;
        }

        .cover-subtitle {
            font-size: 13pt;
            color: #8899aa !important;
            margin-bottom: 1.5in;
            font-weight: 300;
        }

        .cover-client {
            font-size: 11pt;
            color: white !important;
            margin-bottom: 0.3rem;
        }

        .cover-date {
            font-size: 10pt;
            color: #8899aa !important;
            margin-bottom: 1.5rem;
        }

        .cover-brand {
            font-size: 14pt;
            font-weight: 600;
            color: white !important;
            margin-bottom: 0.2rem;
        }

        .cover-brand-sub {
            font-size: 9pt;
            color: #8899aa !important;
        }

        /* CONTENT */
        .content {
            page-break-before: always;
        }

        h2 {
            font-size: 13pt;
            font-weight: 600;
            color: #0d1620 !important;
            margin: 0.22in 0 0.12in 0;
            padding-top: 0.1in;
            border-top: 2.5pt solid #00a8e1 !important;
            page-break-after: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h2:first-of-type {
            margin-top: 0;
        }

        h3 {
            font-size: 10.5pt;
            font-weight: 600;
            color: #00a8e1 !important;
            margin: 0.16in 0 0.09in 0;
            page-break-after: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h4 {
            font-size: 10pt;
            font-weight: 600;
            color: #1a2332 !important;
            margin: 0.14in 0 0.08in 0;
            page-break-after: avoid;
        }

        p {
            text-align: justify;
            margin: 0 0 0.09in 0;
            orphans: 3;
            widows: 3;
        }

        ul, ol {
            margin: 0 0 0.1in 0;
            padding-left: 0.28in;
        }

        li {
            margin: 0 0 0.06in 0;
        }

        .card {
            background: #f4f7f9 !important;
            border: 1px solid #e5e9ec !important;
            border-radius: 8pt;
            padding: 0.12in;
            margin: 0.1in 0 0.14in 0;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .card h3 {
            margin-top: 0;
        }

        .stat-grid, .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.12in;
            margin: 0.12in 0;
        }

        .stat-card, .feature-card {
            background: #f4f7f9 !important;
            border-left: 3pt solid #00a8e1 !important;
            padding: 0.1in;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .stat-label {
            font-size: 8.5pt;
            color: #00a8e1 !important;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.04in;
        }

        .stat-value {
            font-size: 18pt;
            font-weight: 600;
            color: #1a2332 !important;
            margin-bottom: 0.03in;
        }

        .stat-desc {
            font-size: 8.5pt;
            color: #5a6c7d !important;
        }

        .feature-card h4 {
            margin-top: 0;
            font-size: 9.5pt;
        }

        .feature-card p {
            font-size: 8.5pt;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.12in 0 0.14in 0;
            page-break-inside: avoid;
        }

        table thead {
            background: #0d1620 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table th {
            padding: 0.08in;
            text-align: left;
            font-weight: 600;
            font-size: 9pt;
            border: 0.5pt solid #ccc;
            color: white !important;
        }

        table td {
            padding: 0.08in;
            border: 0.5pt solid #e5e9ec;
            font-size: 8.5pt;
            vertical-align: top;
        }

        table tbody tr:nth-child(even) {
            background: #f4f7f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .config-card {
            background: rgba(0,168,225,0.05) !important;
            border: 1px solid rgba(0,168,225,0.2) !important;
            padding: 0.1in;
            margin-bottom: 0.08in;
            border-radius: 6pt;
            page-break-inside: avoid;
        }

        .config-card-title {
            font-weight: 600;
            font-size: 9.5pt;
            color: #0d1620 !important;
        }

        .config-card-desc {
            font-size: 8.5pt;
            color: #5a6c7d !important;
            margin-top: 0.04in;
        }

        .config-card-prices {
            font-size: 8.5pt;
            color: #00a8e1 !important;
            font-weight: 600;
            margin-top: 0.04in;
        }

        .contact-box {
            background: rgba(0,168,225,0.05) !important;
            border: 1px solid rgba(0,168,225,0.2) !important;
            padding: 0.14in;
            border-radius: 8pt;
            margin: 0.12in 0;
            page-break-inside: avoid;
        }

        strong, b {
            font-weight: 600;
        }

        .page-break {
            page-break-after: always;
        }

        * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Hide interactive elements */
        .template-selector, .pricing-calculator input,
        .pricing-calculator button, .live-quote,
        .base-package-toggle, .addon-grid input,
        .template-grid, .image-modal, .nav,
        .theme-toggle, .pdf-download, .pdf-modal-overlay,
        .footer {
            display: none !important;
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="cover-page">
        <div class="cover-logos">
            <img src="https://bogen.ai/images/eb-logo.png" alt="Bogen.ai">
            <span class="cover-logo-sep">×</span>
            <img src="https://bogen.ai/proposals/karis-properties-logo.png" alt="Karis Properties">
        </div>
        <div class="cover-badge">Website Development Proposal</div>
        <h1>Karis Properties USA</h1>
        <div class="cover-subtitle">Professional Real Estate Web Presence for the Denver Market</div>
        <div class="cover-client">Prepared for: Mike Farr</div>
        <div class="cover-date">April 2026</div>
        <div class="cover-brand">Bogen.ai</div>
        <div class="cover-brand-sub">A Division of Dave T Productions</div>
    </div>

    <!-- Headers and Footers for all pages except cover -->
    <div class="page-header">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <img src="https://bogen.ai/images/eb-logo.png" alt="Bogen.ai" style="height: 20px;">
            <span>Karis Properties USA</span>
        </div>
        <div>Website Development Proposal</div>
    </div>

    <div class="page-footer">
        <div>Bogen.ai — A Division of Dave T Productions</div>
        <div class="page-number"></div>
    </div>

    <!-- CONTENT -->
    <div class="content">
""" + content_html + """
    </div>

    <script>
        // Add page numbers
        const pageNumbers = document.querySelectorAll('.page-number');
        pageNumbers.forEach((el, i) => {
            el.textContent = 'Page ' + (i + 2); // Start from page 2 (after cover)
        });
    </script>
</body>
</html>"""

    # Write to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        temp_html = f.name
        f.write(pdf_html)

    print(f"✓ Generated HTML: {temp_html}")

    try:
        # Use Chrome to generate PDF
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        output_path = "/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_USA_Proposal.pdf"

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

        print(f"✓ Generating PDF...")
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
    create_professional_proposal_pdf()
