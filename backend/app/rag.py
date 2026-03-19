import os
import uuid
from io import BytesIO

from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
import anthropic
import requests
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter
import PyPDF2

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

_chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
_embedding_fn = embedding_functions.DefaultEmbeddingFunction()
_collection = _chroma_client.get_or_create_collection(
    "ragbot_docs", embedding_function=_embedding_fn
)
_anthropic = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)


def _extract_text(file_bytes: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return file_bytes.decode("utf-8", errors="replace")


def ingest_file(file_bytes: bytes, filename: str) -> dict:
    doc_id = str(uuid.uuid4())
    text = _extract_text(file_bytes, filename)
    chunks = _splitter.split_text(text)

    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "filename": filename, "chunk": i} for i in range(len(chunks))]

    # ChromaDB's DefaultEmbeddingFunction handles embeddings automatically
    _collection.add(ids=ids, documents=chunks, metadatas=metadatas)

    return {"doc_id": doc_id, "filename": filename, "chunks": len(chunks)}


def list_documents() -> list[dict]:
    result = _collection.get(include=["metadatas"])
    seen: dict[str, str] = {}
    for meta in result["metadatas"]:
        doc_id = meta["doc_id"]
        if doc_id not in seen:
            seen[doc_id] = meta["filename"]
    return [{"id": doc_id, "filename": filename} for doc_id, filename in seen.items()]


def delete_document(doc_id: str) -> None:
    result = _collection.get(where={"doc_id": doc_id}, include=["metadatas"])
    if result["ids"]:
        _collection.delete(ids=result["ids"])


def ingest_url(url: str) -> dict:
    response = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()

    content_type = response.headers.get("content-type", "")
    if "application/pdf" in content_type:
        return ingest_file(response.content, url.split("/")[-1] or "page.pdf")

    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)

    doc_id = str(uuid.uuid4())
    # Use the page title or URL as the display name
    title = soup.title.string.strip() if soup.title and soup.title.string else url
    chunks = _splitter.split_text(text)

    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "filename": title, "chunk": i, "url": url} for i in range(len(chunks))]

    _collection.add(ids=ids, documents=chunks, metadatas=metadatas)

    return {"doc_id": doc_id, "filename": title, "chunks": len(chunks)}


def answer_query(question: str) -> dict:
    results = _collection.query(
        query_texts=[question],
        n_results=4,
        include=["documents", "metadatas"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]

    context = "\n\n".join(
        f"[Source: {m['filename']}, chunk {m['chunk']}]\n{d}"
        for d, m in zip(docs, metas)
    )

    prompt = (
        "You are a helpful assistant. Answer the question using only the provided context.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\nAnswer:"
    )

    response = _anthropic.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    answer = response.content[0].text

    sources = [
        {"filename": m["filename"], "excerpt": d[:200]}
        for d, m in zip(docs, metas)
    ]

    return {"answer": answer, "sources": sources}
