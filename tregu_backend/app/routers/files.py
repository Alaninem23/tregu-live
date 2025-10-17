# app/routers/files.py  (ORIGINAL for Tregu)
import os, uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
MAX_BYTES = int(os.getenv("UPLOAD_MAX_BYTES", "10485760"))  # 10 MB default
ALLOWED = {"image/jpeg", "image/png", "image/webp"}

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=415, detail="Unsupported file type")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    ext = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }.get(file.content_type, "bin")

    name = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / name

    size = 0
    chunk_size = 1024 * 1024  # 1 MB
    with dest.open("wb") as f:
        chunk = await file.read(chunk_size)
        while chunk:
            size += len(chunk)
            if size > MAX_BYTES:
                f.close()
                try:
                    dest.unlink()
                except Exception:
                    pass
                raise HTTPException(status_code=413, detail=f"File too large (>{MAX_BYTES} bytes)")
            f.write(chunk)
            chunk = await file.read(chunk_size)

    url = f"/uploads/{name}"
    return {"ok": True, "filename": name, "url": url, "bytes": size, "content_type": file.content_type}
