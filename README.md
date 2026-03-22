<h1 align="center">⚖️ ContractAI</h1>

<p align="center">
  <strong>Intelligent Legal Contract Management — Powered by NLP</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black"/>
</p>

---

## 🚨 The Problem

Legal contract management is slow, expensive, and error-prone.

| Problem | Impact |
|---|---|
| **Manual review** | Lawyers spend hours reading contracts that could be summarised in seconds |
| **No classification** | Contracts are filed inconsistently with no automated type detection |
| **Access chaos** | Clients, lawyers, and paralegals all need different views of the same documents |
| **Fragmented storage** | Contracts, summaries, and user assignments stored in disconnected systems |

**ContractAI automates the entire pipeline — from upload to insight.**

---

## ✅ What It Does

```
PDF / TXT Upload
      ↓
  NLP Pipeline  →  Extracts text → Classifies contract type → Generates summary
      ↓
  MongoDB  →  Stores contract, summary, classification, and assignments
      ↓
  Role-Based Dashboard  →  Lawyer / Paralegal / Client views
```

---

## ✨ Key Features

- 📄 **Contract Upload** — Upload PDF or TXT contracts for instant AI processing
- 🤖 **AI Classification** — Automatically identifies contract type (Employment, NDA, Service Agreement, etc.) using NLP models
- 📝 **Auto Summarisation** — Generates concise summaries using T5 transformer models
- 👥 **Role-Based Access** — Dedicated dashboards for Lawyers, Paralegals, and Clients with RBAC
- 🔒 **Secure User Management** — Registration, approval workflows, and role assignment
- 🗂️ **Smart Storage** — All contracts, summaries, and assignments stored in MongoDB

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **AI/NLP** | T5 + HuggingFace Transformers | Contract classification & summarisation |
| **Backend** | FastAPI + Python | REST API, AI logic, user management |
| **Database** | MongoDB | Flexible document storage |
| **Frontend** | React + Vite + Tailwind CSS | Role-based UI |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas URI)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env  # fill in your MongoDB URI and secrets

# Run server
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Lawyer** | Upload contracts, view AI analysis, manage assignments |
| **Paralegal** | Review contracts, assist with management |
| **Client** | View own contracts and summaries |

---

## 🔭 Future Scope

- 🔍 Clause-level risk detection and flagging
- 📊 Contract analytics dashboard
- 🌐 Multi-language contract support
- ✍️ AI-assisted contract drafting

---

<p align="center">
  Built to make legal AI practical, not just possible.
</p>s control for Lawyers, Paralegals, and Clients.
- **Management Dashboards**: Dedicated views for managing users and contract assignments.
