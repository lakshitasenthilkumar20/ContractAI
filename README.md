# Contract AI Unified Project

This project, **Contract AI**, is an intelligent platform designed to automate and streamline legal contract management. It leverages Artificial Intelligence to help law firms and clients process, analyze, and manage legal documents more efficiently.

### Core Capabilities
*   **AI-Powered Analysis**: Automatically extracts text from uploaded PDF/TXT contracts, classifies the contract type (e.g., Employment, NDA, Service Agreement), and generates concise summaries using Machine Learning models.
*   **Role-Based Dashboards**: Customized interfaces for different user types (Lawyers, Paralegals, and Clients).
*   **Secure Management**: A robust system for user registration, approval workflows, and secure document storage.

### Technical Stack
*   **Frontend**: React + Vite application styled with Tailwind CSS.
*   **Backend**: FastAPI (Python) server handling the AI logic.
*   **Database**: MongoDB for flexible data storage.
*   **AI/ML**: Integrated Python NLP models (like T5 and Transformers).

## Project Structure

- `backend/`: FastAPI application for contract processing, analysis, and user management.
- `frontend/`: React + Vite application for the user interface.

## Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (running locally or accessible via URI)

## Setup

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables in `.env`.
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Key Features

- **Contract Upload**: Upload PDF/TXT contracts for AI analysis.
- **AI Processing**: Automated classification and summarization using NLP models.
- **User Management**: Role-based access control for Lawyers, Paralegals, and Clients.
- **Management Dashboards**: Dedicated views for managing users and contract assignments.
