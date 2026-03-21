from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app import rag
from app.auth import get_current_user

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


@router.post("/query")
def query(
    request: QueryRequest,
    current_user: dict = Depends(get_current_user),
):
    return rag.answer_query(request.question, current_user["user_id"])
