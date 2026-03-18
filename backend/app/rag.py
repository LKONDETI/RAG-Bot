import os
import uuid
from io import BytesIO

from dotenv import load_dotenv
import chromadb
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
import PyPDF2

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

_chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
_collection = _chroma_client.get_or_create_collection("ragbot_docs")
_embeddings = OpenAIEmbeddings()
_llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
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

    embeddings = _embeddings.embed_documents(chunks)
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "filename": filename, "chunk": i} for i in range(len(chunks))]

    _collection.add(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadatas)

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


def answer_query(question: str) -> dict:
    question_embedding = _embeddings.embed_query(question)
    results = _collection.query(
        query_embeddings=[question_embedding],
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

    response = _llm.invoke(prompt)
    answer = response.content

    sources = [
        {"filename": m["filename"], "excerpt": d[:200]}
        for d, m in zip(docs, metas)
    ]

    return {"answer": answer, "sources": sources}
