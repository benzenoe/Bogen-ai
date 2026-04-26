#!/usr/bin/env python3
"""
Update the original DTP Service Agreement PDF with pricing changes
Maintains exact ReportLab formatting from the original
"""

from pypdf import PdfReader
import re

def extract_and_show_changes():
    """Extract text from original PDF and show what needs to change"""

    # Read original PDF
    pdf_path = "/Users/eytan/Library/CloudStorage/OneDrive-Personal/Documents/Real Estate/Reignation/Bogen.ai/DTP_Service_Agreement_CORRECTED (1).pdf"

    reader = PdfReader(pdf_path)

    print(f"Original PDF has {len(reader.pages)} pages\n")

    # Extract text from page 3 (table page)
    page_3_text = reader.pages[2].extract_text()

    print("=== PAGE 3 TEXT (Service Table) ===")
    print(page_3_text)
    print("\n" + "="*50 + "\n")

    # Extract text from page 4 (deliverables)
    page_4_text = reader.pages[3].extract_text()

    print("=== PAGE 4 TEXT (Deliverables) ===")
    print(page_4_text[:1000])
    print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    extract_and_show_changes()
