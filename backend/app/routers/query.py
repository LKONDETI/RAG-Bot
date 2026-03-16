from fastapi import APIRouter
from pydantic import BaseModel
from app import rag

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


@router.post("/query")
def query(request: QueryRequest):
    return rag.answer_query(request.question)
