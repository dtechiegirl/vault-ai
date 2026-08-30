# TAG AI Engineering Bootcamp: Cohort 1

## Team Accelerators: Project 1

This repository contains Team Accelerators' work for Project 1 of the TAG AI Engineering Bootcamp.

## Team Members

- Yifieyeh Achesomie Goni
- SOULEY Raquib
- Tomoloju Temilolaoluwa
- Iyamokuma inatimi
- Aishat Adebanjo
- Monday Imeobong

# Vault AI — Local & Private Document Intelligence Assistant

## Project Brief
Vault AI is a 100% offline, privacy-first document intelligence platform. It allows users to upload local documents (PDF, PPTX, TXT), ask questions about them in natural language, and receive grounded answers with verifiable page citations. It runs entirely on the user's own machine using a local LLM served through Ollama; no cloud APIs, no subscription fees, and no data ever leaves the device.

This solves a real problem for compliance-conscious organisations (law firms, healthcare providers, financial consultancies) who cannot risk sending sensitive documents to third-party cloud AI services due to NDA, GDPR, or data breach concerns.

## Objectives
- Allow users to upload and index single or multiple documents (PDF, PPTX, TXT) locally.
- Enable natural language Q&A that is answered strictly from the uploaded documents, with no fabrication.
- Provide a source citation (file name + page number) with every answer so it can be verified.
- Provide one-click actions in a "Studio" panel: Generate Executive Summary, Extract Key Entities & Dates, Auto-Generate FAQ.
- Ensure the system clearly states "Not found in provided documents" rather than hallucinating when an answer isn't present.
- Demonstrate the entire workflow running fully offline (e.g. in Airplane Mode) by Demo Day.

## Tech Stack
- **LLM Inference:** Ollama, running Llama 3.2 (3B or 1B, 4-bit quantized)
- **Embeddings:** Local transformer model (e.g. `all-MiniLM-L6-v2`) or Ollama embedding endpoint
- **Vector Store:** ChromaDB (embedded, persisted locally on disk)
- **Document Parsing:** Docling / PyPDF
- **Backend:** FastAPI, confirmed working locally with:
  - `fastapi` 0.128.8
  - `uvicorn[standard]` 0.39.0
  - `pydantic` 2.13.5
  - `sqlalchemy` 2.0.52
  - `httpx` 0.28.1
  - `pytest` 8.4.2
  - `python-multipart` 0.0.20

  > ⚠️ The versions currently pinned in `backend/requirements.txt` (e.g. `fastapi==0.141.1`, `httpx2==2.12.0`) don't exist on PyPI and will fail to install. Use the versions above, or open ranges like `fastapi>=0.115,<1.0`, until the file is corrected.
- **Frontend:** Not yet built — the `frontend/` folder currently exists but is empty. Planned: React or Streamlit, 3-panel UI (Sources, Chat, Studio).

## Project Structure
Confirmed as of the current `main` branch:

```
c1-accelerators-project-1/
├── backend/
│   ├── __init__.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py       # FastAPI entry point (app object lives here)
│   │   ├── api/          # Route definitions (e.g. documents upload, /health)
│   │   ├── core/         # App config / settings
│   │   ├── db/           # Database setup
│   │   ├── schemas/      # Pydantic request/response models
│   │   └── services/     # Business logic
│   ├── requirements.txt
│   └── tests/
├── frontend/              # Currently empty — no code yet
├── ingestion/             # RAG ingestion pipeline (has active code, see PR #4)
├── retrieval/             # Scaffolding only so far
├── data/                  # Scaffolding only so far
├── docs/                  # Scaffolding only so far
├── evaluation/            # Scaffolding only so far
├── scripts/               # Scaffolding only so far
├── .gitignore
└── README.md
```

**Note:** `backend/` and `ingestion/` have real, working code. `frontend/`, `retrieval/`, `data/`, `docs/`, `evaluation/`, and `scripts/` are still just initial folder scaffolding as of this writing — update this section as those fill in.

## Getting Started
Confirmed working steps for running the backend locally. The frontend isn't built yet, so there's no UI to open in a browser — you can exercise the API directly via the interactive docs page instead (see step 5).

### Prerequisites
- Python 3.9+ (tested working on 3.9)
- Git, with collaborator access to this repo (ask your team lead to add you if you get a 403 error)

### 1. Clone the repo
Using SSH (recommended — avoids repeated password/token prompts once set up):
```bash
git clone git@github.com:tag-ecosystemai/c1-accelerators-project-1.git
```
Using HTTPS (if prompted for a password, use a GitHub Personal Access Token, not your account password):
```bash
git clone https://github.com/tag-ecosystemai/c1-accelerators-project-1.git
```

### 2. Set up the backend environment
```bash
cd c1-accelerators-project-1/backend
python3 -m venv venv
source venv/bin/activate
```
Your terminal prompt should now start with `(venv)`, confirming the virtual environment is active.

### 3. Install dependencies
```bash
pip install -r requirements.txt
```
> ⚠️ **Known issue:** as of this writing, `requirements.txt` has some pinned versions that don't exist on PyPI (e.g. `fastapi==0.141.1`, `httpx2==2.12.0`) and will fail with a "Could not find a version that satisfies the requirement" error. Until the file is fixed, install these confirmed-working versions instead:
> ```
> fastapi>=0.115,<1.0
> uvicorn[standard]>=0.30
> pydantic>=2.9,<3.0
> pytest>=8.0
> httpx>=0.27
> sqlalchemy>=2.0
> python-multipart>=0.0.9
> ```

### 4. Run the backend server
Go back up to the project root first — the code's internal imports expect to be run from here, not from inside `backend/`:
```bash
cd ..
uvicorn backend.app.main:app --reload
```
Success looks like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 5. Try it out
Open your browser to:
```
http://127.0.0.1:8000/docs
```
This is FastAPI's auto-generated interactive API page. Confirmed available so far:
- `GET /health` — health check
- `documents` — document upload endpoint

Click an endpoint → "Try it out" → "Execute" to call it live and see a real response.

### Ollama / RAG pipeline (not required yet)
Needed once the RAG pipeline is wired into the backend, but not for the steps above:
```bash
ollama pull llama3.2
ollama serve
```
[Install Ollama here](https://ollama.com/download) if you don't have it.

## Team Workflow
1. Create a branch before working on a feature or task.
2. Do not work directly on the main branch.
3. Push changes to your branch.
4. Open a pull request when the work is ready.
5. Another team member should review the pull request before it is merged.
6. Keep commit messages clear and descriptive.
7. Never commit passwords, API keys, tokens or other secrets.

## Mentor
Assigned mentor: God'sgift Olomu

## Program
TAG AI Engineering Bootcamp: Cohort 1
