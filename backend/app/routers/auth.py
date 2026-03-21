from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import users
from app.auth import create_token

router = APIRouter(prefix="/auth")


class AuthRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
def register(req: AuthRequest):
    try:
        user = users.register(req.username, req.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = create_token(user["user_id"], user["username"])
    return {"token": token, "username": user["username"], "user_id": user["user_id"]}


@router.post("/login")
def login(req: AuthRequest):
    try:
        user = users.login(req.username, req.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    token = create_token(user["user_id"], user["username"])
    return {"token": token, "username": user["username"], "user_id": user["user_id"]}
