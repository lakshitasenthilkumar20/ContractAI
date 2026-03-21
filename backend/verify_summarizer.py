import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import os

SUMMARIZER_MODEL_NAME = "t5-base"

def verify_summary(text_path):
    print(f"Loading summarizer model: {SUMMARIZER_MODEL_NAME}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(SUMMARIZER_MODEL_NAME)
        model = AutoModelForSeq2SeqLM.from_pretrained(SUMMARIZER_MODEL_NAME)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device)
        print(f"Using device: {device}")

        print(f"Reading text from: {text_path}")
        with open(text_path, "r", encoding="utf-8") as f:
            text = f.read()

        print(f"Input text length: {len(text)} characters.")
        
        # BART handles up to 1024 tokens.
        input_text = text[:4000]
        
        print("Generating summary with BART...")
        inputs = tokenizer(input_text, return_tensors="pt", max_length=1024, truncation=True).to(device)
        
        # BART parameters:
        outputs = model.generate(
            inputs["input_ids"], 
            max_length=300, 
            min_length=100, 
            num_beams=4,
            length_penalty=2.0,
            early_stopping=True,
            no_repeat_ngram_size=3
        )
        
        summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        print("\n--- GENERATED SUMMARY ---")
        print(summary)
        print("--- END OF SUMMARY ---\n")
        
        print(f"Summary length: {len(summary)} characters.")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    base_dir = "/Users/lakshitasenthikumar/Downloads/software 2/Contract_AI/backend"
    text_sample = os.path.join(base_dir, "extracted_text_sample.txt")
    
    if os.path.exists(text_sample):
        verify_summary(text_sample)
    else:
        print(f"Error: {text_sample} not found. Please run extraction first.")
