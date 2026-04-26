#!/usr/bin/env python3
"""
Generate professional Karis Properties proposal PDF with headers, footers, and page numbers
"""

from weasyprint import HTML, CSS
from bs4 import BeautifulSoup
import os

def create_professional_pdf():
    """Create a professional proposal PDF with proper headers and footers"""

    # Read the original HTML
    html_path = "/Users/eytan/claude-code/bogen-ai/public/proposals/karis-properties-usa-proposal.html"
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Parse and extract main content
    soup = BeautifulSoup(html_content, 'html.parser')

    # Create professional PDF HTML with headers/footers
    pdf_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Karis Properties USA — Website Development Proposal</title>
    <style>
        @page {
            size: letter;
            margin: 1in 0.75in 0.9in 0.75in;

            @top-left {
                content: "Karis Properties USA";
                font-family: Helvetica, Arial, sans-serif;
                font-size: 9pt;
                color: #5a6c7d;
                padding-top: 0.3in;
            }

            @top-right {
                content: "Website Development Proposal";
                font-family: Helvetica, Arial, sans-serif;
                font-size: 9pt;
                color: #5a6c7d;
                text-align: right;
                padding-top: 0.3in;
            }

            @bottom-left {
                content: "Bogen.ai — A Division of Dave T Productions";
                font-family: Helvetica, Arial, sans-serif;
                font-size: 8pt;
                color: #8899aa;
                padding-bottom: 0.3in;
            }

            @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-family: Helvetica, Arial, sans-serif;
                font-size: 8pt;
                color: #8899aa;
                text-align: right;
                padding-bottom: 0.3in;
            }
        }

        @page :first {
            margin: 0;
            @top-left { content: none; }
            @top-right { content: none; }
            @bottom-left { content: none; }
            @bottom-right { content: none; }
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1a2332;
            margin: 0;
            padding: 0;
        }

        /* COVER PAGE */
        .cover-page {
            background: #0d1620;
            color: white;
            text-align: center;
            padding: 2.5in 1in 2in 1in;
            min-height: 10.5in;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .cover-logos {
            display: flex;
            align-items: center;
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
            background: rgba(0, 168, 225, 0.15);
            border: 1px solid rgba(0, 168, 225, 0.4);
            color: #00a8e1;
            padding: 0.5rem 1.5rem;
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
            letter-spacing: 0.02em;
            margin: 0 0 0.3in 0;
            color: white;
        }

        .cover-subtitle {
            font-size: 13pt;
            color: #8899aa;
            margin-bottom: 1.5in;
            font-weight: 300;
        }

        .cover-client {
            font-size: 11pt;
            margin-bottom: 0.3rem;
        }

        .cover-date {
            font-size: 10pt;
            color: #8899aa;
            margin-bottom: 1.5rem;
        }

        .cover-brand {
            font-size: 14pt;
            font-weight: 600;
            margin-bottom: 0.2rem;
        }

        .cover-brand-sub {
            font-size: 9pt;
            color: #8899aa;
        }

        /* CONTENT */
        .content {
            page-break-before: always;
        }

        h2 {
            font-size: 14pt;
            font-weight: 600;
            color: #0d1620;
            margin: 0.25in 0 0.15in 0;
            padding-top: 0.12in;
            border-top: 3pt solid #00a8e1;
            page-break-after: avoid;
        }

        h2:first-of-type {
            margin-top: 0;
        }

        h3 {
            font-size: 11pt;
            font-weight: 600;
            color: #00a8e1;
            margin: 0.2in 0 0.12in 0;
            page-break-after: avoid;
        }

        h4 {
            font-size: 10pt;
            font-weight: 600;
            color: #1a2332;
            margin: 0.16in 0 0.1in 0;
            page-break-after: avoid;
        }

        p {
            text-align: justify;
            margin: 0 0 0.12in 0;
            orphans: 3;
            widows: 3;
        }

        ul, ol {
            margin: 0.1in 0 0.14in 0;
            padding-left: 0.3in;
        }

        li {
            margin: 0 0 0.08in 0;
        }

        .card {
            background: #f4f7f9;
            border: 1px solid #e5e9ec;
            border-radius: 8pt;
            padding: 0.14in;
            margin: 0.12in 0 0.16in 0;
            page-break-inside: avoid;
        }

        .card h3 {
            margin-top: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.15in 0;
            page-break-inside: avoid;
        }

        table thead {
            background: #0d1620;
            color: white;
        }

        table th {
            padding: 0.12in;
            text-align: left;
            font-weight: 600;
            font-size: 9pt;
        }

        table td {
            padding: 0.1in;
            border-bottom: 0.5pt solid #e5e9ec;
            font-size: 9pt;
        }

        table tbody tr:nth-child(even) {
            background: #f4f7f9;
        }

        .section {
            margin-bottom: 0.2in;
        }

        .page-break {
            page-break-after: always;
        }

        strong {
            font-weight: 600;
        }
    </style>
</head>
<body>
""" + str(soup.find('body')).replace('<body>', '').replace('</body>', '').replace('data-theme="light"', '') + """
</body>
</html>"""

    # Clean up the HTML - remove interactive elements
    soup2 = BeautifulSoup(pdf_html, 'html.parser')

    # Remove nav, theme toggle, pdf download button
    for element in soup2.find_all(['div'], class_=['nav', 'theme-toggle', 'pdf-download', 'pdf-modal-overlay']):
        element.decompose()

    # Remove all script tags
    for script in soup2.find_all('script'):
        script.decompose()

    # Wrap sections in .section divs
    for section_div in soup2.find_all('div', class_='section'):
        section_div.name = 'section'
        section_div['class'] = 'content'

    # Rename hero to cover-page
    hero = soup2.find('div', class_='hero')
    if hero:
        hero['class'] = 'cover-page'
        # Update hero children classes
        for badge in hero.find_all('div', class_='hero-badge'):
            badge['class'] = 'cover-badge'
        for logos in hero.find_all('div', class_='hero-logos'):
            logos['class'] = 'cover-logos'
        for sep in hero.find_all('span', class_='hero-logo-sep'):
            sep['class'] = 'cover-logo-sep'
        for subtitle in hero.find_all('div', class_='hero-subtitle'):
            subtitle['class'] = 'cover-subtitle'
        for client in hero.find_all('div', class_='hero-client'):
            client['class'] = 'cover-client'
        for date in hero.find_all('div', class_='hero-date'):
            date['class'] = 'cover-date'
        for brand in hero.find_all('div', class_='hero-brand'):
            brand['class'] = 'cover-brand'
        for brand_sub in hero.find_all('div', class_='hero-brand-sub'):
            brand_sub['class'] = 'cover-brand-sub'

    final_html = str(soup2)

    # Generate PDF
    output_path = "/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_USA_Proposal.pdf"

    print("✓ Generating professional PDF with headers, footers, and page numbers...")
    HTML(string=final_html, base_url="/Users/eytan/claude-code/bogen-ai/public/proposals/").write_pdf(output_path)

    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path)
        print(f"✓ PDF created: {output_path}")
        print(f"✓ File size: {file_size / 1024:.1f} KB")
    else:
        print("✗ PDF file was not created")

if __name__ == "__main__":
    create_professional_pdf()
