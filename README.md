# RAGBot

A Retrieval-Augmented Generation (RAG) application with a Python FastAPI backend and React frontend.

## Project Structure

```
RAGBot/
├── backend/       # Python FastAPI backend
└── frontend/      # React frontend
```

---

## `backend/`

FastAPI-based Python backend that handles:
- **Document ingestion** — upload PDFs/text files, chunk and embed them
- **Vector storage** — stores embeddings in ChromaDB for similarity search
- **RAG pipeline** — retrieves relevant chunks via LangChain and sends them to OpenAI for answer generation
- **REST API** — exposes endpoints consumed by the React frontend

Key libraries: `langchain`, `chromadb`, `openai`, `fastapi`, `uvicorn`, `pypdf2`, `python-dotenv`

### Getting started

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # add your OPENAI_API_KEY
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`

---

## `frontend/`

React frontend that provides:
- A chat interface for asking questions against uploaded documents
- A document upload panel for adding files to the knowledge base
- Real-time display of answers with source citations

### Getting started

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`
