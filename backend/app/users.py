import json
import os
import uuid

from app.auth import hash_password, verify_password

USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "users.json")


def _load() -> dict:
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE) as f:
            return json.load(f)
    return {}


def _save(data: dict) -> None:
    with open(USERS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def register(username: str, password: str) -> dict:
    data = _load()
    if username in data:
        raise ValueError("Username already taken")
    user_id = str(uuid.uuid4())
    data[username] = {"user_id": user_id, "hashed_password": hash_password(password)}
    _save(data)
    return {"user_id": user_id, "username": username}


def login(username: str, password: str) -> dict:
    data = _load()
    user = data.get(username)
    if not user or not verify_password(password, user["hashed_password"]):
        raise ValueError("Invalid username or password")
    return {"user_id": user["user_id"], "username": username}
