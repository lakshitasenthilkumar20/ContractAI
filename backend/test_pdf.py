import pdfplumber
import os
import sys

def test_extraction(pdf_path):
    print(f"Testing extraction for: {pdf_path}")
    if not os.path.exists(pdf_path):
        print("File not found")
        return
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Pages: {len(pdf.pages)}")
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                print(f"Page {i+1} text length: {len(text) if text else 0}")
                if text:
                    print(f"Sample: {text[:100]}...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_file = "/Users/lakshitasenthikumar/Downloads/software 2/Contract_AI/backend/uploads/a7f887b7-8cf8-43eb-9cbe-caf76f3ce25d.pdf"
    test_extraction(test_file)
