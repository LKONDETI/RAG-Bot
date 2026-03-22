# RAGBot

A full-stack Retrieval-Augmented Generation (RAG) application. Upload PDFs or text files, ingest URLs, then ask questions — the app retrieves relevant chunks from your documents and generates accurate, cited answers using OpenAI. Supports user accounts with JWT authentication, guest access, and persistent chat history.

**Stack:** FastAPI · LangChain · ChromaDB · OpenAI · React · TypeScript

---

## Project Structure

```
RAGBot/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── rag.py           # Core RAG pipeline (ingest, retrieve, answer)
│   │   ├── auth.py          # Password hashing (bcrypt), JWT creation & validation
│   │   ├── users.py         # File-based user storage (users.json)
│   │   └── routers/
│   │       ├── auth.py      # POST /auth/register, POST /auth/login
│   │       ├── documents.py # /upload, /documents, /documents/{id}, /ingest-url
│   │       └── query.py     # /query
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── api.ts                    # Typed fetch client
        ├── App.tsx                   # Layout + chat session state (localStorage)
        ├── contexts/
        │   └── AuthContext.tsx       # Auth state, token storage, getAuthHeaders()
        └── components/
            ├── StatusBar.tsx         # Backend health indicator
            ├── LoginPage.tsx         # Register / login form
            ├── AuthModal.tsx         # Auth modal for in-app login/register
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
cp .env.example .env                         # fill in OPENAI_API_KEY and JWT_SECRET
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

- **User authentication** — register and log in with a username and password; sessions persist via JWT stored in `localStorage`
- **Guest access** — use the app without an account; isolated by a browser-generated guest ID
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
| `POST` | `/auth/register` | Register a new user, returns JWT |
| `POST` | `/auth/login` | Log in, returns JWT |
| `POST` | `/upload` | Upload a PDF or TXT file |
| `GET` | `/documents` | List all ingested documents |
| `DELETE` | `/documents/{doc_id}` | Delete a document and its chunks |
| `POST` | `/ingest-url` | Ingest content from a URL |
| `POST` | `/query` | Ask a question, get an answer + sources |

---

## How It Works

1. **Auth** — users register/login via `/auth/register` and `/auth/login`; a JWT is issued and sent as a Bearer token on subsequent requests. Unauthenticated users are treated as guests identified by a `X-Guest-ID` header.
2. **Ingest** — uploaded files or URLs are split into overlapping chunks (1000 chars, 200 overlap), embedded via OpenAI, and stored in a persistent ChromaDB collection
3. **Retrieve** — at query time, the question is embedded and the top 4 most similar chunks are fetched from ChromaDB
4. **Answer** — retrieved chunks are assembled into a context prompt and sent to `gpt-3.5-turbo`, which returns a grounded answer
5. **Cite** — the frontend displays collapsible source citations (filename + excerpt) alongside each answer
6. **Persist** — chat sessions are stored in `localStorage` so history survives page refreshes

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `CHROMA_PERSIST_DIR` | Path to ChromaDB storage (default: `./chroma_db`) |

---

## Notes

- **Apple Silicon (M1/M2/M3):** Always create the Python venv using `/opt/homebrew/bin/python3.11`, not the Anaconda Python, to avoid `x86_64` vs `arm64` architecture conflicts.
- **bcrypt compatibility:** The project uses `bcrypt` 5.x directly (bypassing `passlib`) due to a known incompatibility between `passlib` 1.7.4 and `bcrypt` 4.x+.
- User data is stored in `backend/users.json` (file-based, no database required). This file is excluded from git via `.gitignore` — it will be created automatically on first registration.
