from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "google/long-t5-tglobal-base"

print(f"Downloading {MODEL_NAME}... This may take a while.")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
print("Download Complete! You can now run your main server.")