# ContractInsight AI Backend

A complete FastAPI + MongoDB backend for the ContractInsight AI legal contract analysis platform.

## Features
- **JWT Authentication** & Role-Based Access Control (Admin, Lawyer, Paralegal, Client)
- **Contract Management**: Upload (PDF/DOCX), List, Status tracking
- **AI Results**: Store and retrieve AI analysis results (Classification, Summary, Entities, Risk Score)
- **Comments System**: Threaded comments with Internal/External visibility scopes
- **Clean Architecture**: Modular structure with Motor (Async MongoDB)

## Technologies
- Python 3.9+
- FastAPI
- MongoDB (Motor)
- Python-Jose (JWT)
- Passlib (Bcrypt)

## Setup & Run

### 1. Prerequisites
- Python 3.x installed
- MongoDB installed and running locally (`mongodb://localhost:27017`)

### 2. Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure Environment:
   Rename `.env.example` to `.env`.
   ```bash
   copy .env.example .env
   # Check .env settings
   ```

### 3. Database Initialization

Run the seed script to create default users (Admin, Lawyer, Paralegal, Client):

```bash
python seed_users.py
```

### 4. Run the Server

```bash
uvicorn app.main:app --reload
```

Server will start at `http://127.0.0.1:8000`.
Docs available at `http://127.0.0.1:8000/docs`.

---

## Sample API Requests (Curl)

### 1. Login (Get Token)
Replace `username` and `password`. Default seed: `admin@example.com` / `adminpassword`.

```bash
curl -X POST "http://127.0.0.1:8000/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin@example.com&password=adminpassword"
```

*Copy the `access_token` from the response.*

### 2. Upload Contract (Lawyer)
(Assumes you logged in as Lawyer `lawyer@example.com` / `lawyerpassword` and have the token)

```bash
curl -X POST "http://127.0.0.1:8000/contracts/upload" \
     -H "Authorization: Bearer <YOUR_LAWYER_TOKEN>" \
     -F "title=Service Agreement v1" \
     -F "file=@/path/to/contract.pdf"
```

*Copy the `id` (Contract ID) from the response.*

### 3. Post AI Results (Admin/System)
(Assumes Admin token)

```bash
curl -X POST "http://127.0.0.1:8000/contracts/<CONTRACT_ID>/results" \
     -H "Authorization: Bearer <YOUR_ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "classification": "Service Agreement",
       "summary": "Standard service agreement for consulting.",
       "risk_score": 0.2,
       "entities": [{"label": "ORG", "text": "Acme Corp"}]
     }'
```

### 4. View Contract & Results (Client)
(Assumes Client `client@example.com` / `clientpassword` and Client is assigned to this contract via `client_id`, or use Lawyer/Admin to view)

```bash
# Get Contract Details
curl -X GET "http://127.0.0.1:8000/contracts/<CONTRACT_ID>" \
     -H "Authorization: Bearer <YOUR_TOKEN>"

# Get AI Results
curl -X GET "http://127.0.0.1:8000/contracts/<CONTRACT_ID>/results" \
     -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 5. Add Comment
**Internal (Lawyer/Admin):**
```bash
curl -X POST "http://127.0.0.1:8000/contracts/<CONTRACT_ID>/comments" \
     -H "Authorization: Bearer <YOUR_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"comment_text": "Needs review on clause 5.", "comment_type": "internal"}'
```

**External (Client/Lawyer):**
```bash
curl -X POST "http://127.0.0.1:8000/contracts/<CONTRACT_ID>/comments" \
     -H "Authorization: Bearer <YOUR_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"comment_text": "Is this term standard?", "comment_type": "external"}'
```
