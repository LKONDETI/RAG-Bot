# RAGBot

A full-stack Retrieval-Augmented Generation (RAG) application. Upload PDFs or text files, ingest URLs, then ask questions — the app retrieves relevant chunks from your documents and generates accurate, cited answers using OpenAI. Chat history is saved locally across sessions.

**Stack:** FastAPI · LangChain · ChromaDB · OpenAI · React · TypeScript

---

## Project Structure

```
RAGBot/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── rag.py           # Core RAG pipeline (ingest, retrieve, answer)
│   │   └── routers/
│   │       ├── documents.py # /upload, /documents, /documents/{id}, /ingest-url
│   │       └── query.py     # /query
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── api.ts                    # Typed fetch client
        ├── App.tsx                   # Layout + chat session state (localStorage)
        └── components/
            ├── StatusBar.tsx         # Backend health indicator
            ├── DocumentPanel.tsx     # Upload + ingest URL + list + delete documents
            ├── ChatSidebar.tsx       # Chat history list + new chat button
            └── ChatPanel.tsx         # Chat UI with source citations
```

---

## Getting Started

### Prerequisites
- Python 3.11+ (arm64 build on Apple Silicon — use Homebrew, not Anaconda)
- Node.js 18+
- An OpenAI API key

### 1. Backend

```bash
cd backend
/opt/homebrew/bin/python3.11 -m venv venv   # use Homebrew Python on Apple Silicon
source venv/bin/activate                     # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                         # fill in your OPENAI_API_KEY
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`
Swagger UI at `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`

---

## Features

- **Document ingestion** — upload PDFs or `.txt` files, or paste a URL to ingest web content
- **RAG-powered answers** — questions are answered using retrieved document chunks as context
- **Source citations** — collapsible source list (filename + excerpt) shown alongside each answer
- **Chat history** — multiple chat sessions, saved to `localStorage` and restored on refresh
- **New chat** — start a fresh conversation at any time; previous chats remain in the sidebar

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Backend health check |
| `POST` | `/upload` | Upload a PDF or TXT file |
| `GET` | `/documents` | List all ingested documents |
| `DELETE` | `/documents/{doc_id}` | Delete a document and its chunks |
| `POST` | `/ingest-url` | Ingest content from a URL |
| `POST` | `/query` | Ask a question, get an answer + sources |

---

## How It Works

1. **Ingest** — uploaded files or URLs are split into overlapping chunks (1000 chars, 200 overlap), embedded via OpenAI, and stored in a persistent ChromaDB collection
2. **Retrieve** — at query time, the question is embedded and the top 4 most similar chunks are fetched from ChromaDB
3. **Answer** — retrieved chunks are assembled into a context prompt and sent to `gpt-3.5-turbo`, which returns a grounded answer
4. **Cite** — the frontend displays collapsible source citations (filename + excerpt) alongside each answer
5. **Persist** — chat sessions are stored in `localStorage` so history survives page refreshes

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `CHROMA_PERSIST_DIR` | Path to ChromaDB storage (default: `./chroma_db`) |
