# TAG AI Engineering Bootcamp: Cohort 1

## Team Accelerators — Project 1

This repository contains Team Accelerators' work for Project 1 of the TAG AI Engineering Bootcamp.

## Team Members

* Yifieyeh Achesomie Goni
* SOULEY Raquib
* Tomoloju Temilolaoluwa
* Iyamokuma Inatimi
* Aishat Adebanjo
* Monday Imeobong

# Vault AI — Local & Private Document Intelligence Assistant

## Project Overview

Vault AI is a local-first document intelligence platform that allows users to upload documents, ask questions about their content in natural language, and receive grounded answers with source citations.

The system processes documents, creates local embeddings, retrieves relevant evidence, reranks the retrieved chunks, and passes only the most relevant context to a locally running LLM through Ollama.

The goal is to provide useful document intelligence without sending sensitive documents to external AI APIs.

> **Core idea:** Upload your documents. Ask questions. Get evidence-backed answers — locally and privately.

## Key Features

* Local document ingestion and indexing
* PDF, PPTX and TXT document support
* Page/slide metadata preservation for citations
* Local text embeddings using Ollama
* Persistent local ChromaDB vector storage
* Semantic retrieval
* Retrieval reranking using:

  * Semantic similarity
  * Lexical matching
  * Section-heading matching
  * Phrase matching
* Single-document question answering
* Multi-document retrieval support
* Source citations containing document name and page
* Grounded-answer prompting
* Safe not-found behavior
* Local Ollama model selection through environment configuration
* Automated retrieval evaluation
* Automated backend tests
* React frontend
* FastAPI backend

## System Architecture

```text
                         ┌─────────────────────┐
                         │    React Frontend   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         └──────────┬──────────┘
                                    │
                           User Question
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Query Embedding   │
                         │   nomic-embed-text  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       ChromaDB      │
                         │  Candidate Retrieval│
                         │       Top 8         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Reranker       │
                         │ Semantic + Lexical  │
                         │ Heading + Phrase    │
                         └──────────┬──────────┘
                                    │
                               Final Top 3
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       Ollama        │
                         │      Local LLM      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Grounded Answer +   │
                         │      Citations      │
                         └─────────────────────┘
```

## Supported Documents

Currently supported:

* PDF
* PPTX
* TXT

The parser preserves document location metadata such as page or slide information so retrieved evidence can be cited back to the original source.

## Technology Stack

| Component        | Technology                       |
| ---------------- | -------------------------------- |
| Frontend         | React                            |
| Backend          | FastAPI                          |
| Language         | Python                           |
| LLM Runtime      | Ollama                           |
| Default LLM      | Llama 3.2 3B                     |
| Local Model      | Configurable through `.env`      |
| Embeddings       | `nomic-embed-text`               |
| Vector Database  | ChromaDB                         |
| Document Parsing | PyPDF / python-pptx / TXT parser |
| Testing          | pytest                           |
| Version Control  | Git + GitHub                     |

## Project Structure

```text
c1-accelerators-project-1/

├── backend/
│   ├── __init__.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── chat.py
│   │   │   │   ├── documents.py
│   │   │   │   └── studio.py
│   │   │   └── ...
│   │   ├── core/
│   │   ├── db/
│   │   ├── schemas/
│   │   └── services/
│   │       ├── chat_service.py
│   │       ├── document_service.py
│   │       ├── ingestion_service.py
│   │       └── studio_service.py
│   └── tests/

├── ingestion/
│   ├── parser.py
│   ├── chunker.py
│   └── embedding.py

├── retrieval/
│   ├── search.py
│   ├── reranker.py
│   └── test_search.py

├── evaluation/
│   ├── dataset.py
│   ├── golden_qa_set.json
│   ├── ingest_evaluation_documents.py
│   ├── retrieval_eval.py
│   ├── test_dataset.py
│   ├── test_retrieval_eval.py
│   └── sample_documents/

├── frontend/

├── data/
├── docs/
├── scripts/
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Getting Started

### Prerequisites

Install the following:

* Python 3.11+
* Node.js and npm
* Git
* Ollama

Python 3.11.9 is the development environment currently used for the project.

### 1. Clone the repository

```bash
git clone git@github.com:tag-ecosystemai/c1-accelerators-project-1.git
cd c1-accelerators-project-1
```

HTTPS can also be used:

```bash
git clone https://github.com/tag-ecosystemai/c1-accelerators-project-1.git
cd c1-accelerators-project-1
```

### 2. Create the Python environment

From the project root:

#### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install project dependencies

All Python dependencies are managed through the single `requirements.txt` file at the project root.

```bash
pip install -r requirements.txt
```

### 4. Configure the local LLM

Vault AI uses an environment variable to select the Ollama chat model.

Create a local `.env` file in the project root:

```env
CHAT_MODEL=llama3.2:3b
```

The repository provides `.env.example` as the template.

The default project model is:

```env
CHAT_MODEL=llama3.2:3b
```

If your computer has limited RAM, you can use a smaller locally installed model without changing the application code.

For example:

```env
CHAT_MODEL=qwen2.5:0.5b
```

The `.env` file is intentionally excluded from Git.

### 5. Install the Ollama models

Install Ollama and make sure it is running.

Then pull the default model:

```bash
ollama pull llama3.2:3b
```

Install the embedding model:

```bash
ollama pull nomic-embed-text
```

If using a smaller local model, pull that model as well:

```bash
ollama pull qwen2.5:0.5b
```

Check installed models:

```bash
ollama list
```

### 6. Start the backend

From the project root:

```bash
uvicorn backend.app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive documentation is available at:

```text
http://127.0.0.1:8000/docs
```

### 7. Start the frontend

From the frontend directory:

```bash
cd frontend
npm install
```

For development:

```bash
npm run dev
```

## Privacy

Vault AI is designed as a local-first application.

Document processing, embeddings, vector storage and LLM inference run locally through the application's local components.

No cloud LLM API is required for the core workflow.

This makes the architecture suitable for scenarios where documents may contain sensitive or confidential information.

## Current Status

Vault AI currently has:

* Document ingestion
* PDF, PPTX, and TXT parsing
* Metadata and page tracking
* Text chunking
* Local embeddings
* ChromaDB vector storage
* Semantic retrieval
* Retrieval reranking
* Local LLM question answering
* Source/page citations
* Configurable Ollama models
* Automated tests
* Retrieval evaluation framework

The retrieval pipeline currently achieves **100% Recall@3** on the 15-question positive evaluation set.

## Mentor

**Assigned Mentor:** God'sgift Olomu

## Program

**TAG AI Engineering Bootcamp — Cohort 1**
