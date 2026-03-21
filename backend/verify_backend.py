import requests
import os

BASE_URL = "http://127.0.0.1:8000"

# Credentials (from seed_users.py)
ADMIN_CREDS = {"username": "admin@example.com", "password": "adminpassword"}
LAWYER_CREDS = {"username": "lawyer@example.com", "password": "lawyerpassword"}
CLIENT_CREDS = {"username": "client@example.com", "password": "clientpassword"}

def get_token(creds):
    response = requests.post(f"{BASE_URL}/auth/login", data=creds)
    if response.status_code != 200:
        print(f"❌ Login failed for {creds['username']}: {response.text}")
        return None
    return response.json()["access_token"]

def run_verification():
    print("🚀 Starting Backend Verification...\n")

    # 1. Login
    print("🔹 1. Testing Authentication...")
    admin_token = get_token(ADMIN_CREDS)
    lawyer_token = get_token(LAWYER_CREDS)
    client_token = get_token(CLIENT_CREDS)

    if not (admin_token and lawyer_token and client_token):
        print("❌ Auth failed. Aborting.")
        return

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    lawyer_headers = {"Authorization": f"Bearer {lawyer_token}"}
    client_headers = {"Authorization": f"Bearer {client_token}"}
    print("✅ Login successful for Admin, Lawyer, and Client.\n")

    # 2. Upload Contract (Lawyer)
    print("🔹 2. Testing Contract Upload (Lawyer)...")
    
    # Create a dummy file
    with open("test_contract.txt", "w") as f:
        f.write("This is a dummy contract for testing purposes.")
    
    files = {"file": ("test_contract.txt", open("test_contract.txt", "rb"), "text/plain")}
    data = {"title": "Test Agreement 2024", "client_id": ""} 
    # Note: In a real scenario, we'd need the Client's UUID to assign it. 
    # For now, we'll leave client_id empty or fetch the client ID first.
    
    # Let's fetch Client ID first to assign it correctly
    client_me = requests.get(f"{BASE_URL}/auth/me", headers=client_headers).json()
    data["client_id"] = client_me["id"]

    response = requests.post(f"{BASE_URL}/contracts/upload", headers=lawyer_headers, files=files, data=data)
    
    if response.status_code == 200:
        contract = response.json()
        contract_id = contract["id"]
        print(f"✅ Contract uploaded successfully via Lawyer. ID: {contract_id}")
    else:
        print(f"❌ Upload failed: {response.text}")
        return

    # 3. Post AI Results (Admin)
    print("\n🔹 3. Testing AI Results Submission (Admin)...")
    results_data = {
        "classification": "Service Agreement",
        "summary": "This is an automated summary of the test contract.",
        "risk_score": 0.5,
        "entities": [{"label": "DATE", "text": "2024-01-01"}]
    }
    response = requests.post(f"{BASE_URL}/contracts/{contract_id}/results", headers=admin_headers, json=results_data)
    if response.status_code == 200:
        print("✅ AI Results posted successfully.")
    else:
        print(f"❌ AI Results post failed: {response.text}")

    # 4. Comments Test (Internal vs External)
    print("\n🔹 4. Testing Comments & RBAC...")
    
    # Lawyer posts Internal comment
    internal_comment = {"comment_text": "This is strictly internal.", "comment_type": "internal"}
    requests.post(f"{BASE_URL}/contracts/{contract_id}/comments", headers=lawyer_headers, json=internal_comment)
    
    # Lawyer posts External comment
    external_comment = {"comment_text": "Please review this clause.", "comment_type": "external"}
    requests.post(f"{BASE_URL}/contracts/{contract_id}/comments", headers=lawyer_headers, json=external_comment)
    
    print("   -> Comments posted by Lawyer.")

    # Client views comments
    print("   -> Client fetching comments (Expect only External)...")
    response = requests.get(f"{BASE_URL}/contracts/{contract_id}/comments", headers=client_headers)
    comments = response.json()
    
    if len(comments) == 1 and comments[0]["comment_type"] == "external":
        print("✅ RBAC SUCCESS: Client sees only external comments.")
    else:
        print(f"❌ RBAC FAIL: Client saw {len(comments)} comments. Dump: {comments}")

    # Clean up
    try:
        os.remove("test_contract.txt")
        # Optional: Delete uploads/ file if you want to be clean
    except:
        pass

    print("\n🎉 Verification Complete!")

if __name__ == "__main__":
    try:
        run_verification()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server.")
        print("💡 Make sure you are running 'uvicorn app.main:app' in a separate terminal!")
