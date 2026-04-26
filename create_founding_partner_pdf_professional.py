#!/usr/bin/env python3
"""
Generate professional Karis Properties Founding Partner PDF with proper headers/footers
Uses WeasyPrint which properly supports CSS Paged Media @page rules
"""

from weasyprint import HTML, CSS
import os

def create_professional_pdf():
    """Create PDF with proper running headers and footers using WeasyPrint"""

    # Input HTML file
    html_path = "/Users/eytan/claude-code/bogen-ai/public/proposals/karis-properties-founding-partner.html"

    # Output PDF path
    output_path = "/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/Karis_Properties_Founding_Partner_Invitation.pdf"

    print(f"✓ Reading HTML from: {html_path}")

    # Additional CSS to ensure proper rendering
    additional_css = CSS(string='''
        @page {
            size: letter;
            margin: 1in 0.75in 0.85in 0.75in;
        }

        @page :first {
            margin: 0;
        }

        /* Ensure all colors render */
        * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
        }
    ''')

    # Generate PDF
    print(f"✓ Generating PDF with WeasyPrint...")

    HTML(filename=html_path).write_pdf(
        output_path,
        stylesheets=[additional_css]
    )

    # Check file size
    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path) / 1024
        print(f"✓ PDF created: {output_path}")
        print(f"✓ File size: {file_size:.1f} KB")
        print(f"✓ Professional PDF with proper headers/footers generated!")
    else:
        print("✗ PDF file was not created")

if __name__ == "__main__":
    create_professional_pdf()
