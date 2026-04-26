#!/usr/bin/env python3
"""
Generate professional Karis Properties PDF with headers, footers, page numbers
Uses Chrome headless with JavaScript for page numbering
"""

import subprocess
import tempfile
import os
from bs4 import BeautifulSoup

def create_final_pdf():
    """Create professional PDF with proper headers/footers"""

    # Read original HTML
    html_path = "/Users/eytan/claude-code/bogen-ai/public/proposals/karis-properties-usa-proposal.html"
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    sections = soup.find_all('div', class_='section')

    content_html = ""
    for section in sections:
        for script in section.find_all('script'):
            script.decompose()
        for elem in section.find_all(['input', 'button']):
            elem.decompose()
        content_html += str(section).replace('class="section"', 'class="content-section"')

    # Professional PDF HTML
    pdf_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Karis Properties USA — Website Development Proposal</title>
    <style>
        @page {
            size: letter;
            margin: 1in 0.85in;
        }

        @page :first {
            margin: 0;
        }

        * { box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Helvetica, Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #2c3e50;
            margin: 0;
            padding: 0;
            font-weight: 400;
            letter-spacing: -0.01em;
        }

        /* COVER PAGE - Award-Winning Design */
        .cover-page {
            background: linear-gradient(135deg, #0a0e14 0%, #1a2332 100%) !important;
            color: white !important;
            text-align: center;
            padding: 2.2in 1.2in 1.8in 1.2in;
            min-height: 10.5in;
            page-break-after: always;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            position: relative;
            overflow: hidden;
        }

        .cover-page::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 60%;
            height: 120%;
            background: radial-gradient(ellipse at center, rgba(0, 168, 225, 0.08) 0%, transparent 70%);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .cover-logos {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 2.5rem;
            position: relative;
            z-index: 2;
        }

        .cover-logos img {
            height: 60px;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
        }

        .cover-logo-sep {
            font-size: 2.5rem;
            color: rgba(0, 168, 225, 0.4);
            font-weight: 200;
        }

        .cover-badge {
            display: inline-block;
            background: linear-gradient(135deg, rgba(0, 168, 225, 0.2) 0%, rgba(0, 168, 225, 0.1) 100%) !important;
            border: 1.5px solid rgba(0, 168, 225, 0.5) !important;
            color: #00d4ff !important;
            padding: 0.6rem 2rem;
            border-radius: 50px;
            font-size: 9.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px rgba(0, 168, 225, 0.15);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            position: relative;
            z-index: 2;
        }

        .cover-page h1 {
            font-size: 48pt;
            font-weight: 200;
            letter-spacing: -0.02em;
            margin: 0 0 0.4in 0;
            color: white !important;
            line-height: 1.1;
            position: relative;
            z-index: 2;
        }

        .cover-subtitle {
            font-size: 14pt;
            color: #b0c4d8 !important;
            margin-bottom: 1.8in;
            font-weight: 300;
            line-height: 1.5;
            max-width: 85%;
            margin-left: auto;
            margin-right: auto;
            position: relative;
            z-index: 2;
        }

        .cover-client {
            font-size: 12pt;
            color: white !important;
            margin-bottom: 0.4rem;
            font-weight: 500;
            position: relative;
            z-index: 2;
        }

        .cover-date {
            font-size: 10pt;
            color: #8899aa !important;
            margin-bottom: 2rem;
            position: relative;
            z-index: 2;
        }

        .cover-brand {
            font-size: 16pt;
            font-weight: 600;
            color: white !important;
            margin-bottom: 0.3rem;
            position: relative;
            z-index: 2;
        }

        .cover-brand-sub {
            font-size: 9.5pt;
            color: #8899aa !important;
            letter-spacing: 0.03em;
            position: relative;
            z-index: 2;
        }

        /* RUNNING HEADERS & FOOTERS - On every page */
        .page-header {
            position: fixed;
            top: 0.35in;
            left: 0.85in;
            right: 0.85in;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 0.15in;
            border-bottom: 1.5pt solid #e8f1f8;
            background: white;
            z-index: 100;
        }

        .page-header-left {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 9.5pt;
            font-weight: 600;
            color: #4a5f7a;
        }

        .page-header-left img {
            height: 24px;
        }

        .page-header-right {
            font-size: 9.5pt;
            color: #6b7d94;
            font-weight: 500;
        }

        .page-footer {
            position: fixed;
            bottom: 0.35in;
            left: 0.85in;
            right: 0.85in;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 0.15in;
            border-top: 1.5pt solid #e8f1f8;
            background: white;
            z-index: 100;
        }

        .page-footer-left {
            display: flex;
            align-items: center;
        }

        .page-footer-left img {
            height: 22px;
        }

        .page-footer-right {
            font-size: 8.5pt;
            color: #8899aa;
            font-weight: 600;
        }

        /* Cover page hides headers/footers with overlay */
        .cover-page {
            position: relative;
            z-index: 1000;
        }

        /* White overlays to cover fixed header/footer on first page */
        .cover-page::before {
            content: '';
            position: absolute;
            top: -3in;
            left: -3in;
            right: -3in;
            height: 3in;
            background: linear-gradient(135deg, #0a0e14 0%, #1a2332 100%);
            z-index: 999;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .cover-page::after {
            content: '';
            position: absolute;
            bottom: -3in;
            left: -3in;
            right: -3in;
            height: 3in;
            background: linear-gradient(135deg, #0a0e14 0%, #1a2332 100%);
            z-index: 999;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Content wrapper needs margin for headers/footers */
        .content-wrapper {
            margin-top: 0.8in;
            margin-bottom: 0.7in;
        }

        /* CONTENT - Premium Typography */
        h2 {
            font-size: 16pt;
            font-weight: 600;
            color: #1a2840 !important;
            margin: 0.28in 0 0.16in 0;
            padding-top: 0.14in;
            padding-left: 0.18in;
            border-left: 4pt solid #00a8e1 !important;
            background: linear-gradient(to right, rgba(0, 168, 225, 0.03) 0%, transparent 100%) !important;
            page-break-after: avoid;
            line-height: 1.3;
            letter-spacing: -0.02em;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h2:first-of-type { margin-top: 0; }

        h3 {
            font-size: 12pt;
            font-weight: 600;
            color: #0088cc !important;
            margin: 0.2in 0 0.12in 0;
            page-break-after: avoid;
            letter-spacing: -0.01em;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h4 {
            font-size: 10.5pt;
            font-weight: 600;
            color: #2c3e50 !important;
            margin: 0.16in 0 0.1in 0;
            page-break-after: avoid;
        }

        p {
            text-align: justify;
            margin: 0 0 0.12in 0;
            orphans: 3;
            widows: 3;
            line-height: 1.65;
        }

        ul, ol {
            margin: 0 0 0.14in 0;
            padding-left: 0.32in;
        }

        li {
            margin: 0 0 0.08in 0;
            line-height: 1.6;
        }

        .card {
            background: linear-gradient(135deg, #f8fafb 0%, #ffffff 100%) !important;
            border: 1.5px solid #dce7f0 !important;
            border-radius: 10pt;
            padding: 0.18in;
            margin: 0.14in 0 0.18in 0;
            page-break-inside: avoid;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .card h3 {
            margin-top: 0;
            color: #1a2840 !important;
        }

        .stat-grid, .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.16in;
            margin: 0.16in 0;
        }

        .stat-card, .feature-card {
            background: linear-gradient(to bottom right, #ffffff 0%, #f8fafb 100%) !important;
            border-left: 4pt solid #00a8e1 !important;
            border-radius: 6pt;
            padding: 0.14in;
            page-break-inside: avoid;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .stat-label {
            font-size: 9pt;
            color: #0088cc !important;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 0.06in;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .stat-value {
            font-size: 24pt;
            font-weight: 300;
            color: #1a2840 !important;
            margin-bottom: 0.06in;
            line-height: 1;
            letter-spacing: -0.02em;
        }

        .stat-desc {
            font-size: 9pt;
            color: #6b7d94 !important;
            line-height: 1.5;
        }

        .feature-card h4 {
            margin-top: 0;
            font-size: 10pt;
            color: #1a2840 !important;
        }

        .feature-card p {
            font-size: 9pt;
            line-height: 1.6;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 0.16in 0 0.18in 0;
            page-break-inside: avoid;
            border-radius: 8pt;
            overflow: hidden;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        }

        table thead {
            background: linear-gradient(135deg, #1a2840 0%, #0d1620 100%) !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table th {
            padding: 0.12in 0.14in;
            text-align: left;
            font-weight: 600;
            font-size: 9.5pt;
            border: none;
            color: white !important;
            letter-spacing: 0.01em;
        }

        table td {
            padding: 0.12in 0.14in;
            border-bottom: 1px solid #e8f1f8;
            font-size: 9pt;
            vertical-align: top;
        }

        table tbody tr {
            background: white !important;
        }

        table tbody tr:nth-child(even) {
            background: #f8fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table tbody tr:hover {
            background: #f0f7fc !important;
        }

        .config-card {
            background: linear-gradient(135deg, rgba(0,168,225,0.04) 0%, rgba(0,168,225,0.02) 100%) !important;
            border: 1.5px solid rgba(0,168,225,0.25) !important;
            padding: 0.14in;
            margin-bottom: 0.12in;
            border-radius: 8pt;
            page-break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0, 168, 225, 0.08);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .config-card-title {
            font-weight: 600;
            font-size: 10pt;
            color: #1a2840 !important;
        }

        .config-card-desc {
            font-size: 9pt;
            color: #5a6c7d !important;
            margin-top: 0.06in;
            line-height: 1.5;
        }

        .config-card-prices {
            font-size: 9pt;
            color: #0088cc !important;
            font-weight: 600;
            margin-top: 0.08in;
        }

        .contact-box {
            background: linear-gradient(135deg, rgba(0,168,225,0.06) 0%, rgba(0,168,225,0.03) 100%) !important;
            border: 1.5px solid rgba(0,168,225,0.3) !important;
            padding: 0.18in;
            border-radius: 10pt;
            margin: 0.16in 0;
            page-break-inside: avoid;
            box-shadow: 0 2px 6px rgba(0, 168, 225, 0.1);
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        strong, b { font-weight: 600; }

        * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

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

    <!-- RUNNING HEADER - Will appear on every page -->
    <div class="page-header">
        <div class="page-header-left">
            <img src="https://bogen.ai/images/eb-logo.png" alt="Bogen.ai">
            <span>Karis Properties USA</span>
        </div>
        <div class="page-header-right">Website Development Proposal</div>
    </div>

    <!-- RUNNING FOOTER - Will appear on every page -->
    <div class="page-footer">
        <div class="page-footer-left">
            <img src="https://bogen.ai/images/eb-logo.png" alt="EB">
        </div>
        <div class="page-footer-right">Page 2</div>
    </div>

    <!-- CONTENT PAGES -->
    <div class="content-wrapper">
""" + content_html + """
    </div>
</body>
</html>"""

    # Write to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        temp_html = f.name
        f.write(pdf_html)

    print(f"✓ Generated HTML: {temp_html}")

    try:
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
    create_final_pdf()
