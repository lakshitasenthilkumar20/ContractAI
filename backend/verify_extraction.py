import pdfplumber
import os

def extract_and_save(pdf_path, output_path):
    print(f"Opening PDF: {pdf_path}")
    text_content = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Total Pages: {len(pdf.pages)}")
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    text_content.append(f"--- PAGE {i+1} ---\n{text}\n")
                else:
                    text_content.append(f"--- PAGE {i+1} ---\n[No text found on this page]\n")
        
        full_text = "\n".join(text_content)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(full_text)
        
        print(f"Extraction successful! Saved to: {output_path}")
        print(f"Total characters extracted: {len(full_text)}")
        
    except Exception as e:
        print(f"An error occurred during extraction: {e}")

if __name__ == "__main__":
    # Using one of the existing uploads for verification
    base_dir = "/Users/lakshitasenthikumar/Downloads/software 2/Contract_AI/backend"
    test_pdf = os.path.join(base_dir, "uploads/a7f887b7-8cf8-43eb-9cbe-caf76f3ce25d.pdf")
    output_txt = os.path.join(base_dir, "extracted_text_sample.txt")
    
    extract_and_save(test_pdf, output_txt)
