#!/usr/bin/env python3
"""
Generate professional Karis Properties proposal PDF with optimized spacing
"""

import subprocess
import tempfile
import os
from bs4 import BeautifulSoup

def create_karis_proposal_pdf(html_path, output_path):
    """Create a professional proposal PDF with proper spacing"""

    # Read the original HTML
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Parse HTML to extract content sections
    soup = BeautifulSoup(html_content, 'html.parser')

    # Create professional PDF-optimized HTML
    html_doc = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karis Properties USA — Website Development Proposal</title>
    <style>
        @page {
            size: letter;
            margin: 0.75in;
        }

        @page :first {
            margin: 0;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1a2332;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .cover-logos {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 0.75in;
        }

        .cover-logos img {
            height: 60px;
        }

        .cover-logos-sep {
            font-size: 2rem;
            color: rgba(0, 168, 225, 0.5);
            font-weight: 300;
        }

        .cover-badge {
            background: rgba(0, 168, 225, 0.15);
            border: 1px solid rgba(0, 168, 225, 0.4);
            color: #00a8e1 !important;
            padding: 0.4rem 1.2rem;
            border-radius: 50px;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 1.5rem;
        }

        .cover-page h1 {
            font-size: 42pt;
            font-weight: 300;
            letter-spacing: 0.05em;
            margin: 0 0 0.3in 0;
            color: white !important;
        }

        .cover-subtitle {
            font-size: 13pt;
            color: #8899aa !important;
            margin-bottom: 1.5in;
            font-weight: 300;
            letter-spacing: 0.02em;
        }

        .cover-client {
            font-size: 11pt;
            color: white !important;
            margin-bottom: 0.15in;
        }

        .cover-date {
            font-size: 10pt;
            color: #8899aa !important;
            margin-bottom: 0.8in;
        }

        .cover-brand {
            font-size: 14pt;
            font-weight: 600;
            color: white !important;
            margin-bottom: 0.1in;
        }

        .cover-brand-sub {
            font-size: 9pt;
            color: #8899aa !important;
        }

        /* CONTENT PAGES */
        .content {
            page-break-before: always;
        }

        /* Section headings */
        h2 {
            font-size: 14pt;
            font-weight: 600;
            color: #0d1620 !important;
            margin: 0.25in 0 0.12in 0;
            padding-top: 0.1in;
            border-top: 3pt solid #00a8e1 !important;
            page-break-after: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h2:first-of-type {
            margin-top: 0;
        }

        /* Subsection headings */
        h3 {
            font-size: 11pt;
            font-weight: 600;
            color: #00a8e1 !important;
            margin: 0.18in 0 0.1in 0;
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

        /* Paragraphs */
        p {
            text-align: justify;
            margin: 0 0 0.1in 0;
            orphans: 3;
            widows: 3;
            line-height: 1.5;
        }

        /* Lists */
        ul, ol {
            margin: 0.08in 0 0.12in 0;
            padding-left: 0.3in;
        }

        li {
            margin: 0 0 0.07in 0;
            line-height: 1.45;
        }

        /* Cards/Boxes */
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

        /* Stats/Features Grid */
        .stats-grid, .features-grid {
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

        .stat-number {
            font-size: 20pt;
            font-weight: 600;
            color: #00a8e1 !important;
            margin: 0 0 0.05in 0;
        }

        .stat-label {
            font-size: 9pt;
            color: #5a6c7d !important;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.14in 0;
            page-break-inside: auto;
        }

        table thead {
            background: #0d1620 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table th {
            padding: 0.1in;
            text-align: left;
            font-weight: 600;
            font-size: 9pt;
            border: 0.5pt solid #ccc;
            color: white !important;
        }

        table td {
            padding: 0.09in;
            border: 0.5pt solid #e5e9ec;
            font-size: 9pt;
            vertical-align: top;
        }

        table tbody tr:nth-child(even) {
            background: #f4f7f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table tr {
            page-break-inside: avoid;
        }

        /* Text formatting */
        strong, b {
            font-weight: 600;
        }

        em, i {
            font-style: italic;
        }

        /* Page break class */
        .page-break {
            page-break-after: always;
        }

        /* Pricing section */
        .pricing-summary {
            background: #0d1620 !important;
            color: white !important;
            padding: 0.15in;
            border-radius: 8pt;
            margin: 0.15in 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .pricing-summary h3 {
            color: white !important;
            margin-top: 0;
        }

        .pricing-row {
            display: flex;
            justify-content: space-between;
            padding: 0.08in 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .pricing-total {
            font-size: 16pt;
            font-weight: 600;
            padding-top: 0.12in;
            border-top: 2pt solid #00a8e1 !important;
            margin-top: 0.1in;
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="cover-page">
        <div class="cover-logos">
            <img src="https://bogen.ai/images/eb-logo.png" alt="Bogen.ai">
            <span class="cover-logos-sep">×</span>
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

    <!-- CONTENT -->
    <div class="content">
""" + str(soup.find('body')).replace('<body>', '').replace('</body>', '').split('<!-- Executive Summary -->')[1] if '<!-- Executive Summary -->' in str(soup.find('body')) else "" + """
    </div>
</body>
</html>"""

    # Write HTML to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        temp_html = f.name
        f.write(html_doc)

    print(f"✓ Generated PDF-optimized HTML: {temp_html}")

    try:
        # Use Chrome with settings optimized for complete rendering
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

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

        # Check file size
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"✓ PDF created: {output_path}")
            print(f"✓ File size: {file_size / 1024:.1f} KB")
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
    finally:
        print(f"✓ Temp HTML saved at: {temp_html}")

if __name__ == "__main__":
    html_file = "/Users/eytan/claude-code/bogen-ai/public/proposals/karis-properties-usa-proposal.html"
    pdf_file = "/Users/eytan/claude-code/bogen-ai/public/proposals/Karis_Properties_USA_Proposal.pdf"

    create_karis_proposal_pdf(html_file, pdf_file)
