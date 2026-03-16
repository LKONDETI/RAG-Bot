from fastapi import APIRouter, UploadFile, File, HTTPException
from app import rag

router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()
    result = rag.ingest_file(content, file.filename)
    return result


@router.get("/documents")
def get_documents():
    return rag.list_documents()


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    rag.delete_document(doc_id)
    return {"deleted": True}
