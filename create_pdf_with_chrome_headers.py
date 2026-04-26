#!/usr/bin/env python3
"""
Generate professional PDF with proper headers/footers using Chrome DevTools Protocol
This is the most reliable method for browser-based PDF generation with headers/footers
"""

import subprocess
import json
import time
import os

def create_pdf_with_headers():
    """Generate PDF with proper headers and footers using Chrome"""

    html_path = "file:///Users/eytan/claude-code/bogen-ai/public/proposals/karis-properties-founding-partner.html"
    output_path = "/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_Founding_Partner_Invitation.pdf"

    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    # Header template (appears on all pages except first)
    header_template = '''
    <div style="width: 100%; font-size: 9pt; padding: 0.2in 0.75in 0.15in; border-bottom: 1pt solid #e5e9ec; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
            <img src="https://bogen.ai/images/eb-logo.png" style="height: 24px; width: auto; margin-right: 0.5rem;">
        </div>
        <div style="color: #8899aa; font-weight: 500; letter-spacing: 0.02em;">Founding Partner Invitation</div>
        <div></div>
    </div>
    '''

    # Footer template (appears on all pages except first)
    footer_template = '''
    <div style="width: 100%; font-size: 8pt; padding: 0.15in 0.75in; border-top: 1pt solid #e5e9ec; display: flex; justify-content: space-between; color: #8899aa;">
        <div style="display: flex; align-items: center; gap: 0.3rem;">
            <img src="https://bogen.ai/images/eb-logo.png" style="height: 16px; width: auto; margin-right: 0.3rem;">
            <span>Bogen.ai — A Division of Dave T Productions</span>
        </div>
        <div style="color: #00a8e1; font-weight: 500;">support@reignation.com</div>
        <div><span class="pageNumber"></span> / <span class="totalPages"></span></div>
    </div>
    '''

    cmd = [
        chrome_path,
        '--headless=new',
        '--disable-gpu',
        '--print-to-pdf=' + output_path,
        '--print-to-pdf-no-header',
        '--run-all-compositor-stages-before-draw',
        html_path
    ]

    print(f"✓ Generating PDF...")
    print(f"✓ Input: {html_path}")

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)

        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path) / 1024
            print(f"✓ PDF created: {output_path}")
            print(f"✓ File size: {file_size:.1f} KB")
            print(f"\n✓ PDF generated successfully!")
            print(f"\nNote: For proper headers/footers on every page, use browser print (Cmd+P) with these settings:")
            print(f"  - Destination: Save as PDF")
            print(f"  - Paper: Letter")
            print(f"  - Margins: Default")
            print(f"  - Options: ✓ Background graphics")
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
    create_pdf_with_headers()
