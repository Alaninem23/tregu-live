from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os, sqlite3, random, smtplib, mimetypes

# OpenTelemetry tracing setup
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

    # Configure tracing
    trace.set_tracer_provider(TracerProvider())
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4317", insecure=True))
    )
except ImportError:
    # OpenTelemetry not available, skip tracing
    pass

try:
    from email_validator import validate_email, EmailNotValidError
except Exception:
    validate_email = None
    EmailNotValidError = Exception

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except Exception:
    pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()
if DATABASE_URL.startswith("sqlite:///"):
    rel = DATABASE_URL.replace("sqlite:///", "", 1)
    DB_PATH = os.path.abspath(os.path.join(ROOT_DIR, rel))
else:
    DB_PATH = os.path.join(ROOT_DIR, "tregu.db")
UPLOAD_DIR = os.path.join(ROOT_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

try:
    from app.routers.auth import router as auth_router
    app.include_router(auth_router)
    print("[main] Auth router mounted")
except Exception as e:
    print("[main] Auth router not loaded:", e)

try:
    from app.routers.two_factor import router as twofa_router
    app.include_router(twofa_router)
    print("[main] 2FA router mounted")
except Exception as e:
    print("[main] 2FA router not loaded:", e)

try:
    from app.routers.inventory import router as inventory_router
    app.include_router(inventory_router)
    print("[main] Inventory router mounted")
except Exception as e:
    print("[main] Inventory router not loaded:", e)

try:
    from app.routers.ai import router as ai_router
    app.include_router(ai_router)
    print("[main] AI router mounted at /ai")
except Exception as e:
    print("[main] AI router not loaded:", e)
# except Exception as e:
#     print("[main] Search router not loaded:", e)

origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def db():
    conn = sqlite3.connect(DB_PATH, isolation_level=None)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users(
            email TEXT PRIMARY KEY,
            role TEXT,
            name TEXT,
            phone TEXT,
            company TEXT,
            company_email TEXT,
            company_phone TEXT,
            age TEXT,
            gender TEXT,
            location TEXT,
            account_no TEXT UNIQUE,
            photo_path TEXT,
            document_path TEXT
        )
    """)
    cols = {r["name"] for r in conn.execute("PRAGMA table_info(users)")}
    if "account_no" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN account_no TEXT UNIQUE")
    conn.close()

# @app.on_event("startup")
# def _startup():
#     init_db()

def _random9() -> str:
    return f"{random.randint(0, 999_999_999):09d}"

def unique_account_no(conn: sqlite3.Connection) -> str:
    for _ in range(32):
        c = _random9()
        if conn.execute("SELECT 1 FROM users WHERE account_no=?", (c,)).fetchone() is None:
            return c
    return _random9()

def require_valid_email(raw: str) -> str:
    if raw is None:
        raise HTTPException(status_code=422, detail="email is required")
    s = raw.strip().lower()
    if not s:
        raise HTTPException(status_code=422, detail="email is required")
    if validate_email:
        try:
            info = validate_email(s, allow_smtputf8=True, check_deliverability=False)
            s = info.normalized.lower()
        except EmailNotValidError as e:
            raise HTTPException(status_code=422, detail=f"invalid email: {str(e)}")
    else:
        if "@" not in s or "." not in s.split("@")[-1]:
            raise HTTPException(status_code=422, detail="invalid email")
    return s

def send_welcome_email(to_email: str, name: str, account_no: str, photo_path: str | None = None):
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    pwd = os.getenv("SMTP_PASS")
    sender = os.getenv("SMTP_FROM") or user
    subject = "Welcome to Tregu — your account is ready"
    plain = f"""Hi {name or 'there'},

Welcome to Tregu!
Your 9-digit Tregu ID: {account_no}

Keep this number safe; only you and Tregu admins can see it in your account.

— The Tregu Team
"""
    html = f"""<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:640px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
    <div style="background:#1f66ff;color:#fff;padding:18px 22px">
      <h1 style="margin:0;font-size:22px">Welcome to Tregu</h1>
      <div>Your account is set.</div>
    </div>
    <div style="padding:18px 22px">
      <p>Hi {name or 'there'},</p>
      <p>Thanks for joining Tregu. Your unique ID is:</p>
      <p style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:28px;letter-spacing:2px"><strong>{account_no}</strong></p>
      <p>Keep this 9-digit number safe; it identifies your account across Tregu.</p>
      <p>Welcome aboard,<br/>The Tregu Team</p>
    </div>
  </div>
</body></html>"""
    if not (host and user and pwd):
        print("[email] SMTP not configured — preview:")
        print(f"TO: {to_email}\nSUBJECT: {subject}\n\n{plain}")
        return
    from email.message import EmailMessage
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(plain)
    msg.add_alternative(html, subtype="html")
    if photo_path and os.path.exists(photo_path):
        ctype, _ = mimetypes.guess_type(photo_path)
        maintype, subtype = (ctype or "application/octet-stream").split("/", 1)
        with open(photo_path, "rb") as f:
            msg.add_attachment(f.read(), maintype=maintype, subtype=subtype,
                               filename=os.path.basename(photo_path))
    with smtplib.SMTP(host, port) as s:
        s.starttls()
        s.login(user, pwd)
        s.send_message(msg)

@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Backend is running"}

@app.post("/api/onboard")
async def onboard(
    role: str = Form(...),
    email: str = Form(...),
    name: str = Form(""),
    phone: str = Form(""),
    company: str = Form(""),
    company_email: str = Form(""),
    company_phone: str = Form(""),
    age: str = Form(""),
    gender: str = Form(""),
    location: str = Form(""),
    photo: UploadFile | None = File(None),
    document: UploadFile | None = File(None),
):
    email = require_valid_email(email)
    conn = db()

    def save_upload(prefix: str, f: UploadFile | None):
        if not f:
            return None
        ext = os.path.splitext(f.filename or "")[1] or ".bin"
        safe_email = email.replace("/", "_")
        path = os.path.join(UPLOAD_DIR, f"{prefix}_{safe_email}{ext}")
        with open(path, "wb") as out:
            out.write(f.file.read())
        return path

    photo_path = save_upload("photo", photo)
    document_path = save_upload("doc", document)

    row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    created_now = False
    if row is None:
        acct = unique_account_no(conn)
        conn.execute("""
            INSERT INTO users(
                email, role, name, phone, company, company_email, company_phone,
                age, gender, location, account_no, photo_path, document_path
            )
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (email, role, name, phone, company, company_email, company_phone,
              age, gender, location, acct, photo_path, document_path))
        created_now = True
    else:
        acct = row["account_no"] or unique_account_no(conn)
        conn.execute("""
            UPDATE users
               SET role=?, name=?, phone=?, company=?, company_email=?, company_phone=?,
                   age=?, gender=?, location=?,
                   account_no = COALESCE(account_no, ?),
                   photo_path=COALESCE(?, photo_path),
                   document_path=COALESCE(?, document_path)
             WHERE email=?
        """, (role, name, phone, company, company_email, company_phone,
              age, gender, location, acct, photo_path, document_path, email))

    out = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()

    if created_now:
        try:
            send_welcome_email(email, name, out["account_no"], photo_path)
        except Exception as e:
            print("[email] send failed:", e)

    return dict(out)

@app.get("/api/profile/{email}")
def get_profile(email: str):
    email = require_valid_email(email)
    conn = db()
    row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    if not row:
        return JSONResponse(status_code=404, content={"detail": "not found"})
    return dict(row)

class ChatReqSchema:
    pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8003"))
    uvicorn.run("main:app", host="127.0.0.1", port=port)
