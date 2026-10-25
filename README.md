# Legal Scrutiny Report (LSR) Platform

AI-assisted property document verification, cross-document discrepancy scrutiny, and bank query preparation platform for bank loan processing.

> **Confidentiality & Compliance Notice**:
> - Real borrower documents and sensitive PII are **strictly prohibited** in development environments.
> - All document storage buckets are private. Tenant isolation and immutable audit logging are enforced.
> - **Lawyer Supremacy**: AI provides draft recommendations and evidence-linked discrepancy flags; final legal authority and approval always remain with the empaneled advocate.

---

## Architecture Overview (Monorepo)

The repository is structured as a clear, two-service monorepo tailored for a two-person team:

```text
LSR PLATFORM/
├── frontend/             # Next.js 16 (App Router), TypeScript, Tailwind CSS
│   ├── src/app/          # Pages and routes
│   ├── .env.example      # Frontend environment template
│   └── package.json
├── backend/              # Python FastAPI service
│   ├── app/
│   │   ├── core/         # Settings (pydantic-settings) & security stubs
│   │   ├── api/v1/       # REST endpoints (health checks, scrutiny, queries)
│   │   └── main.py       # FastAPI application entrypoint
│   ├── tests/            # Pytest test suite
│   ├── requirements.txt  # Python dependencies
│   ├── .env.example      # Backend environment template
│   └── .venv/            # Local virtual environment (Python 3.12)
├── .gitignore            # Protects against committing secrets, caches, and test PDFs
├── .env.example          # Monorepo top-level environment template
└── README.md             # This guide
```

---

## Team Division of Work

| Role | Scope | Primary Directory |
|---|---|---|
| **Project Lead** | Frontend UI, overall architecture, integration, Git/GitHub, and document viewer UX | `frontend/` |
| **Teammate** | Backend API, PDF processing (PyMuPDF), pluggable OCR evaluation, and Gemini AI scrutiny engine | `backend/` |

---

## Quickstart Guide

Frontend and backend are **independently runnable** so either team member can develop without blocking the other.

### 1. Backend Setup (`backend/`)

#### Prerequisites
- Python 3.12 installed.

#### Run Locally
1. Open PowerShell and navigate to the backend directory:
   ```powershell
   cd "backend"
   ```
2. Activate the virtual environment:
   ```powershell
   # Windows PowerShell:
   .venv\Scripts\Activate.ps1
   ```
3. Run the development server:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```
4. Open your browser:
   - **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
   - **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Detailed Readiness Check**: [http://localhost:8000/api/v1/health/details](http://localhost:8000/api/v1/health/details)

#### Run Backend Tests
From the root or `backend/` directory:
```powershell
& 'backend/.venv/Scripts/pytest.exe' backend/tests
```

---

### 2. Frontend Setup (`frontend/`)

#### Prerequisites
- Node.js 20+ (v24 LTS installed) and npm.

#### Run Locally
1. Open PowerShell and navigate to the frontend directory:
   ```powershell
   cd "frontend"
   ```
2. Start the Next.js development server:
   ```powershell
   npm run dev
   ```
3. Open your browser at [http://localhost:3000](http://localhost:3000).
4. Click the **"Ping Backend Health (/health)"** button on the dashboard to test live communication between the frontend and backend.

#### Run Frontend Checks (Lint & Build)
```powershell
cd "frontend"
npm run lint
npm run build
```

---

## Status & Roadmap

- [x] **Milestone 0: Repository Scaffolding (Completed)**
  - Clean monorepo structure with `frontend/` and `backend/`.
  - Next.js 16 + TypeScript + Tailwind CSS initialized.
  - FastAPI app with Pydantic configuration and `/health` endpoints.
  - Safe `.env.example` templates (no secrets committed).
  - Automated tests and verification scripts passing (`pytest`, `eslint`, `next build`).
- [ ] **Milestone 1: Database Schema, Tenant RLS & Storage Security**
  - Supabase PostgreSQL migrations, Tenant RLS policies, private storage bucket configuration.
- [ ] **Milestone 2: Case Intake & Confidential Multi-PDF Document Upload**
- [ ] **Milestone 3: PyMuPDF Document Extraction & OCR Evaluation**
- [ ] **Milestone 4: Document Classification & Bank Checklist Gap Analysis**
- [ ] **Milestone 5: Cross-Document Discrepancy Scrutiny & Evidence-Linked Viewer**
- [ ] **Milestone 6: Bank Query Drafting & Lawyer Review / Approval Workflow**
- [ ] **Milestone 7: Supplementary Documents Ingestion & Draft LSR Export**
