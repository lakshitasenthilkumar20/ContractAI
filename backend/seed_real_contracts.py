import asyncio
import os
import sys
import random
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Path fix
sys.path.append(os.getcwd())

from app.db import users_collection, contracts_collection, results_collection, client
from app.utils import generate_uuid, get_current_time
from app.ai_service import extract_text_from_pdf, SUMMARIZER_MODEL_NAME

async def seed_real_contracts():
    print("Starting AI Contract Seeding...")
    
    # 0. Clear existing contract data
    print("Clearing existing contracts and results...")
    await contracts_collection.delete_many({})
    await results_collection.delete_many({})
    
    # 1. Get Users
    users_cursor = users_collection.find({"role": "client"})
    clients = await users_cursor.to_list(length=100)
    if not clients:
        print("No clients found. Please run seed_hierarchy.py first.")
        return

    # 2. Get PDFs
    uploads_dir = "/Users/lakshitasenthikumar/Downloads/software 2/Contract_AI/backend/uploads"
    pdf_files = [f for f in os.listdir(uploads_dir) if f.endswith(".pdf")]
    
    if len(pdf_files) < 6:
        print(f"Only found {len(pdf_files)} PDFs. Using all of them.")
        selected_pdfs = pdf_files
    else:
        selected_pdfs = random.sample(pdf_files, 6)

    print(f"Selected {len(selected_pdfs)} PDFs: {selected_pdfs}")

    # 3. Load Models
    print(f"Loading {SUMMARIZER_MODEL_NAME} for seeding...")
    tokenizer = AutoTokenizer.from_pretrained(SUMMARIZER_MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(SUMMARIZER_MODEL_NAME)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)

    print("Loading classifier for seeding...")
    classifier = None
    classifier_path = "contract_classifier.pkl"
    if os.path.exists(classifier_path):
        import joblib
        from app.ai_service import clean_text
        classifier = joblib.load(classifier_path)

    # 4. Process Each PDF
    for i, pdf_name in enumerate(selected_pdfs):
        pdf_path = os.path.join(uploads_dir, pdf_name)
        contract_title = f"Contract {i+1}"
        print(f"\n[{i+1}/{len(selected_pdfs)}] Processing {pdf_name} as '{contract_title}'...")
        
        # Step A: Randomly assign to a client
        target_client = random.choice(clients)
        
        # Step B: Extract text using pdfplumber
        print(f"Extracting text from {pdf_name}...")
        text = extract_text_from_pdf(pdf_path)
        if not text:
            print(f"Failed to extract text from {pdf_name}, skipping.")
            continue

        # Step C: Classify with ML
        classification = "Legal Contract"
        if classifier:
            print("Predicting contract type...")
            cleaned = clean_text(text)
            classification = str(classifier.predict([cleaned])[0])
            print(f"Predicted Type: {classification}")

        # Step D: Add to contract DB with unique ID
        contract_id = generate_uuid()
        contract_doc = {
            "_id": contract_id,
            "title": contract_title,
            "filename": pdf_name,
            "filepath": pdf_path,
            "full_text": text,
            "uploader_id": target_client["_id"],
            "client_id": target_client["_id"],
            "status": "analyzed",
            "uploaded_at": get_current_time(),
            "updated_at": get_current_time()
        }
        await contracts_collection.insert_one(contract_doc)
        print(f"Created contract {contract_id}")

        # Step E: Do summaries and add to contract_result
        print("Generating summary...")
        input_text = text[:4000]
        inputs = tokenizer(input_text, return_tensors="pt", max_length=1024, truncation=True).to(device)
        
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
        
        result_doc = {
            "_id": generate_uuid(),
            "contract_id": contract_id,
            "classification": classification,
            "summary": summary,
            "entities": [],
            "risk_score": 0.0,
            "created_at": get_current_time()
        }
        await results_collection.insert_one(result_doc)
        
        print(f"Done. Assigned to Client: {target_client['full_name']} ({target_client['email']})")

    print("\nAI Seeding complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_real_contracts())
