#!/usr/bin/env python3
"""
Generate Karis Properties Founding Partner Invitation PDF using Chrome
"""

import subprocess
import tempfile
import os
from bs4 import BeautifulSoup

def create_founding_partner_pdf():
    """Create PDF from the founding partner proposal"""

    # Read the new merged HTML
    html_path = "/Users/eytan/claude-code/bogen-ai/public/proposals/karis-properties-founding-partner.html"
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    # Remove interactive elements
    for elem in soup.find_all(['script']):
        elem.decompose()
    for elem in soup.find_all(['input', 'button']):
        elem.decompose()
    for elem in soup.find_all(class_=['nav', 'theme-toggle', 'template-selector', 'image-modal', 'pdf-modal-overlay']):
        elem.decompose()

    # Get the body content
    body = soup.find('body')
    content_html = str(body)

    # PDF-optimized HTML with print CSS
    pdf_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Karis Properties USA — Founding Partner Invitation</title>
    <style>
        @page {
            size: letter;
            margin: 1.1in 0.85in 0.9in 0.85in;
        }

        @page :first {
            margin: 0;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Helvetica, Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #2c3e50;
            margin: 0;
            padding: 0;
            font-weight: 400;
            letter-spacing: -0.01em;
            background: white;
        }

        /* HERO/COVER PAGE */
        .hero {
            background: linear-gradient(135deg, #0a0e14 0%, #1a2332 100%) !important;
            color: white !important;
            text-align: center;
            padding: 2.2in 1.2in 1.8in 1.2in;
            min-height: 10.5in;
            page-break-after: always;
            position: relative;
            overflow: hidden;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 60%;
            height: 120%;
            background: radial-gradient(ellipse at center, rgba(0, 168, 225, 0.08) 0%, transparent 70%);
        }

        .hero * {
            position: relative;
            z-index: 2;
            color: white !important;
        }

        .hero-logos {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 2.5rem;
        }

        .hero-logos img {
            height: 60px;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
        }

        .hero-logo-sep {
            font-size: 2.5rem;
            color: rgba(0, 168, 225, 0.4) !important;
            font-weight: 200;
        }

        .hero-badge {
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
        }

        .pulse-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #00a8e1 !important;
            border-radius: 50%;
            margin-right: 0.5rem;
        }

        .hero h1 {
            font-size: 48pt;
            font-weight: 200;
            letter-spacing: -0.02em;
            margin: 0 0 0.4in 0;
            line-height: 1.1;
        }

        .hero-subtitle {
            font-size: 14pt;
            color: #b0c4d8 !important;
            margin-bottom: 1.2in;
            font-weight: 300;
            line-height: 1.5;
            max-width: 85%;
            margin-left: auto;
            margin-right: auto;
        }

        .hero-client {
            font-size: 12pt;
            margin-bottom: 0.4rem;
            font-weight: 500;
        }

        .hero-date, .hero-proposal-meta {
            font-size: 10pt;
            color: #8899aa !important;
            margin-bottom: 0.5rem;
        }

        .expiration-warning {
            display: inline-block;
            background: rgba(255, 93, 93, 0.15) !important;
            border: 1.5px solid rgba(255, 93, 93, 0.4) !important;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 9pt;
            color: #ff6b6b !important;
            font-weight: 600;
            margin: 1rem 0 2rem 0;
        }

        .hero-brand {
            font-size: 16pt;
            font-weight: 600;
            margin-bottom: 0.3rem;
        }

        .hero-brand-sub {
            font-size: 9.5pt;
            color: #8899aa !important;
            letter-spacing: 0.03em;
        }

        /* SECTIONS */
        .section {
            page-break-inside: avoid;
            margin-bottom: 0.3in;
        }

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
        }

        h2:first-of-type { margin-top: 0; }

        h3 {
            font-size: 12pt;
            font-weight: 600;
            color: #0088cc !important;
            margin: 0.2in 0 0.12in 0;
            page-break-after: avoid;
            letter-spacing: -0.01em;
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

        strong, b {
            font-weight: 600;
            color: #1a2840 !important;
        }

        /* CARDS */
        .card {
            background: linear-gradient(135deg, #f8fafb 0%, #ffffff 100%) !important;
            border: 1.5px solid #dce7f0 !important;
            border-radius: 10pt;
            padding: 0.18in;
            margin: 0.14in 0 0.18in 0;
            page-break-inside: avoid;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .card h3 {
            margin-top: 0;
            color: #1a2840 !important;
        }

        /* BONUS CARDS */
        .bonus-card {
            background: linear-gradient(135deg, rgba(0,168,225,0.08) 0%, rgba(90,45,130,0.06) 100%) !important;
            border: 2px solid #00a8e1 !important;
            border-radius: 10pt;
            padding: 0.18in;
            margin: 0.14in 0 0.18in 0;
            page-break-inside: avoid;
        }

        .bonus-card h3 {
            color: #0088cc !important;
            margin-top: 0;
        }

        .bonus-value {
            background: rgba(0,168,225,0.2) !important;
            color: #0066aa !important;
            padding: 0.15rem 0.5rem;
            border-radius: 4pt;
            font-size: 8.5pt;
            font-weight: 700;
            margin-left: 0.25rem;
        }

        /* GRIDS */
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
        }

        .stat-label {
            font-size: 9pt;
            color: #0088cc !important;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 0.06in;
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

        /* TEMPLATES */
        .template-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.16in;
            margin: 0.16in 0;
        }

        .template-card {
            background: linear-gradient(135deg, #f8fafb 0%, #ffffff 100%) !important;
            border: 1.5px solid #dce7f0 !important;
            border-radius: 10pt;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .template-image {
            width: 100%;
            height: 2in;
            overflow: hidden;
            background: #e8f1f8 !important;
        }

        .template-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: top;
        }

        .template-info {
            padding: 0.14in;
        }

        .template-info h3 {
            margin: 0 0 0.06in 0;
            font-size: 11pt;
            color: #0088cc !important;
        }

        .template-tagline {
            font-size: 9pt;
            color: #1a2840 !important;
            font-weight: 600;
            margin-bottom: 0.08in;
        }

        .template-features {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .template-features li {
            position: relative;
            padding-left: 0.16in;
            margin-bottom: 0.04in;
            font-size: 8.5pt;
            color: #6b7d94 !important;
            line-height: 1.5;
        }

        .template-features li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #0088cc !important;
            font-weight: 700;
        }

        /* PRICING */
        .base-package-box {
            background: linear-gradient(135deg, #f8fafb 0%, #ffffff 100%) !important;
            border: 2px solid #00a8e1 !important;
            border-radius: 10pt;
            padding: 0.18in;
            margin: 0.14in 0 0.18in 0;
            page-break-inside: avoid;
        }

        .base-package-box h4 {
            margin: 0 0 0.08in 0;
            color: #0088cc !important;
        }

        .base-includes-item {
            position: relative;
            padding-left: 0.2in;
            margin-bottom: 0.06in;
            font-size: 9pt;
            line-height: 1.5;
        }

        .base-includes-item::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #00a8e1 !important;
            font-weight: 700;
        }

        .config-card {
            background: linear-gradient(135deg, rgba(0,168,225,0.04) 0%, rgba(0,168,225,0.02) 100%) !important;
            border: 1.5px solid rgba(0,168,225,0.25) !important;
            padding: 0.14in;
            margin-bottom: 0.12in;
            border-radius: 8pt;
            page-break-inside: avoid;
        }

        .config-card-title {
            font-weight: 600;
            font-size: 10pt;
            color: #1a2840 !important;
            margin-bottom: 0.06in;
        }

        .config-card-desc {
            font-size: 9pt;
            color: #5a6c7d !important;
            line-height: 1.5;
            margin-bottom: 0.06in;
        }

        .config-card-prices {
            font-size: 9pt;
            color: #0088cc !important;
            font-weight: 600;
        }

        /* SIGNATURE */
        .signature-section {
            background: linear-gradient(135deg, #f8fafb 0%, #ffffff 100%) !important;
            border: 2px solid #00a8e1 !important;
            border-radius: 10pt;
            padding: 0.2in;
            margin: 0.2in 0;
            page-break-inside: avoid;
        }

        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.2in;
            margin-top: 0.16in;
        }

        .signature-box {
            border: 1px solid #dce7f0 !important;
            border-radius: 8pt;
            padding: 0.16in;
            background: white !important;
        }

        .signature-box h4 {
            margin: 0 0 0.12in 0;
            color: #0088cc !important;
        }

        .signature-line {
            border-bottom: 2px solid #dce7f0 !important;
            margin: 0.16in 0 0.06in 0;
            height: 0.5in;
        }

        .signature-label {
            font-size: 8.5pt;
            color: #6b7d94 !important;
            margin-top: 0.04in;
        }

        /* CONTACT */
        .contact-box {
            background: linear-gradient(135deg, rgba(0,168,225,0.06) 0%, rgba(0,168,225,0.03) 100%) !important;
            border: 1.5px solid rgba(0,168,225,0.3) !important;
            border-left: 4pt solid #00a8e1 !important;
            padding: 0.18in;
            border-radius: 10pt;
            margin: 0.16in 0;
            page-break-inside: avoid;
        }

        .contact-box h4 {
            margin-top: 0;
            color: #0088cc !important;
        }

        .contact-box p {
            margin: 0.04in 0;
            font-size: 9pt;
        }

        .contact-box a {
            color: #0088cc !important;
            text-decoration: none;
            font-weight: 600;
        }

        /* HIDE INTERACTIVE ELEMENTS */
        .nav, .theme-toggle, .template-selector, .pricing-calculator,
        .live-quote, .image-modal, .footer, .pdf-modal-overlay,
        input, button, .base-package-toggle, .template-image::after {
            display: none !important;
        }
    </style>
</head>
""" + content_html + """
</html>"""

    # Write to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
        temp_html = f.name
        f.write(pdf_html)

    print(f"✓ Generated HTML: {temp_html}")

    try:
        chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        output_path = "/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_Founding_Partner_Invitation.pdf"

        cmd = [
            chrome_path,
            '--headless=new',
            '--disable-gpu',
            '--print-to-pdf=' + output_path,
            '--print-to-pdf-no-header',
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
    create_founding_partner_pdf()
