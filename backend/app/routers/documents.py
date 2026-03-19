from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app import rag

router = APIRouter()


class UrlRequest(BaseModel):
    url: str


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()
    result = rag.ingest_file(content, file.filename)
    return result


@router.post("/ingest-url")
def ingest_url(request: UrlRequest):
    try:
        return rag.ingest_url(request.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/documents")
def get_documents():
    return rag.list_documents()


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    rag.delete_document(doc_id)
    return {"deleted": True}
