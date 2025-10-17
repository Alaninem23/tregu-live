from fastapi import APIRouter, HTTPException, Response, Request, status
from pydantic import BaseModel, EmailStr
import os, secrets, hashlib, base64

router = APIRouter(prefix="/auth", tags=["auth"])

USERS = {}     # DEV ONLY
SESSIONS = {}  # DEV ONLY

def _pbkdf2_hash(password: str, salt: bytes = None, rounds: int = 200_000) -> str:
    if salt is None:
        salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, rounds)
    return f"pbkdf2${rounds}${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"

def _verify(password: str, stored: str) -> bool:
    try:
        _, rounds, salt_b64, dk_b64 = stored.split("$", 3)
        rounds = int(rounds)
        salt = base64.b64decode(salt_b64)
        dk = base64.b64decode(dk_b64)
        test = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, rounds)
        return secrets.compare_digest(test, dk)
    except Exception:
        return False

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    email: EmailStr
    name: str | None = None

COOKIE_NAME = "session"

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn):
    email = data.email.lower()
    if email in USERS:
        raise HTTPException(status_code=409, detail="Email already registered")
    USERS[email] = {"email": email, "name": data.name or email.split("@")[0], "pw": _pbkdf2_hash(data.password)}
    return {"email": email, "name": USERS[email]["name"]}

@router.post("/login", response_model=UserOut)
def login(data: LoginIn, response: Response):
    email = data.email.lower()
    u = USERS.get(email)
    if not u or not _verify(data.password, u["pw"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = secrets.token_urlsafe(32)
    SESSIONS[token] = email
    response.set_cookie(key=COOKIE_NAME, value=token, httponly=True, samesite="lax", secure=False, path="/")
    return {"email": email, "name": u["name"]}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if token:
        SESSIONS.pop(token, None)
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return Response(status_code=204)

@router.get("/me", response_model=UserOut)
def me(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token or token not in SESSIONS:
        raise HTTPException(status_code=401, detail="Not authenticated")
    email = SESSIONS[token]
    u = USERS[email]
    return {"email": email, "name": u["name"]}
