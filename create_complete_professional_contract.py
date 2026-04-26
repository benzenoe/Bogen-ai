#!/usr/bin/env python3
"""
Generate complete professional contract PDF with all 23+ sections
"""

import markdown
import subprocess
import tempfile
import os
import re
import time

def create_complete_contract_pdf(md_path, output_path):
    """Create a complete professional contract PDF matching original styling"""

    # Read markdown content
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Convert markdown to HTML with all extensions
    html_body = markdown.markdown(
        md_content,
        extensions=['tables', 'nl2br', 'extra', 'sane_lists', 'attr_list']
    )

    # Remove title section (we have cover page)
    html_body = re.sub(r'<h1>.*?</h1>.*?(?=<h2>)', '', html_body, flags=re.DOTALL)

    # Remove any standalone hr tags from markdown
    html_body = html_body.replace('<hr />', '').replace('<hr>', '')

    # Create complete HTML document
    html_doc = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DTP Service Agreement - DTP-2026-001</title>
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
            font-family: Helvetica, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.45;
            color: #000;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* COVER PAGE */
        .cover-page {
            background: #1a3e5c !important;
            color: white !important;
            text-align: center;
            padding: 2in 1in;
            min-height: 10.5in;
            page-break-after: always;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .cover-page h1 {
            font-size: 36pt;
            font-weight: 300;
            letter-spacing: 0.12em;
            margin: 1.5in 0 0.25in 0;
            color: white !important;
            text-transform: uppercase;
        }

        .cover-page h2 {
            font-size: 15pt;
            font-weight: 300;
            margin: 0.12in 0;
            color: white !important;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .cover-page .divider {
            width: 3in;
            height: 2.5pt;
            background: #00a8e1 !important;
            margin: 0.25in auto;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .cover-page .info {
            font-size: 10.5pt;
            line-height: 1.7;
            margin: 0.4in 0;
            color: white !important;
        }

        .cover-page .info p {
            margin: 0.07in 0;
            color: white !important;
        }

        .cover-page strong {
            font-weight: 600;
            color: white !important;
        }

        /* CONTENT PAGES */
        .content {
            page-break-before: always;
        }

        /* Section headings - numbered sections */
        h2 {
            font-size: 13pt;
            font-weight: bold;
            color: #1a3e5c !important;
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

        /* Subsection headings */
        h3 {
            font-size: 10.5pt;
            font-weight: bold;
            color: #00a8e1 !important;
            margin: 0.16in 0 0.09in 0;
            page-break-after: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h4 {
            font-size: 10pt;
            font-weight: bold;
            color: #1a3e5c !important;
            margin: 0.14in 0 0.08in 0;
            page-break-after: avoid;
        }

        /* Paragraphs */
        p {
            text-align: justify;
            margin: 0 0 0.09in 0;
            orphans: 3;
            widows: 3;
        }

        /* Lists */
        ul {
            margin: 0 0 0.1in 0;
            padding-left: 0.28in;
        }

        li {
            margin: 0 0 0.06in 0;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.12in 0 0.14in 0;
            page-break-inside: auto;
        }

        table thead {
            background: #1a3e5c !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table th {
            padding: 0.08in;
            text-align: center;
            font-weight: bold;
            font-size: 9pt;
            border: 0.5pt solid #ccc;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table td {
            padding: 0.08in;
            border: 0.5pt solid #ccc;
            font-size: 8.5pt;
            vertical-align: top;
        }

        table td:first-child {
            text-align: left;
        }

        table td:not(:first-child) {
            text-align: center;
        }

        table tbody tr:nth-child(even) {
            background: #f4f4f4 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table tfoot {
            background: #e6e6e6 !important;
            font-weight: bold;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        table tr {
            page-break-inside: avoid;
        }

        /* Text formatting */
        strong, b {
            font-weight: bold;
        }

        em, i {
            font-style: italic;
        }

        /* Page break class */
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="cover-page">
        <h1>DAVE T PRODUCTIONS LLC</h1>
        <h2>Website Development & Digital Services</h2>
        <div class="divider"></div>
        <h2 style="margin-top: 0.18in;">Service Proposal & Agreement</h2>

        <div class="info" style="margin-top: 0.75in;">
            <p><strong>Prepared For:</strong> Michael Farr / Karis Properties USA</p>
            <p><strong>Location:</strong> Denver Metro, Colorado</p>
            <p><strong>MLS / Association:</strong> RE Colorado / South Metro Denver Realtor Assoc.</p>
        </div>

        <div class="info" style="margin-top: 0.32in;">
            <p><strong>Proposal No.:</strong> DTP-2026-001</p>
            <p><strong>Date:</strong> April 14, 2026</p>
            <p><strong>Valid Until:</strong> 30 days from proposal date</p>
        </div>

        <div class="info" style="margin-top: 0.95in;">
            <p><strong>Prepared By:</strong> Dave T Productions LLC</p>
            <p>A Florida Limited Liability Company</p>
        </div>
    </div>

    <!-- CONTENT -->
    <div class="content">
""" + html_body + """
    </div>
</body>
</html>"""

    # Write HTML to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        temp_html = f.name
        f.write(html_doc)

    print(f"✓ Generated HTML: {temp_html}")

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
        # Keep temp file for debugging
        print(f"✓ Temp HTML saved at: {temp_html}")

if __name__ == "__main__":
    md_file = "/Users/eytan/claude-code/bogen-ai/public/proposals/DTP_Service_Agreement_UPDATED.md"
    pdf_file = "/Users/eytan/claude-code/bogen-ai/public/proposals/DTP_Service_Agreement_UPDATED.pdf"

    create_complete_contract_pdf(md_file, pdf_file)
