from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from app import rag
from app.auth import get_current_user

router = APIRouter()


class UrlRequest(BaseModel):
    url: str


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    content = await file.read()
    result = rag.ingest_file(content, file.filename, current_user["user_id"])
    return result


@router.post("/ingest-url")
def ingest_url(
    request: UrlRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return rag.ingest_url(request.url, current_user["user_id"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/documents")
def get_documents(current_user: dict = Depends(get_current_user)):
    return rag.list_documents(current_user["user_id"])


@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
):
    rag.delete_document(doc_id, current_user["user_id"])
    return {"deleted": True}
