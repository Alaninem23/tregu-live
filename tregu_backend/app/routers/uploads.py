import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

MEDIA_ROOT = os.getenv("MEDIA_ROOT", "/app/media")
router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/logo")
async def upload_logo(file: UploadFile = File(...)):
    name = file.filename or "logo.bin"
    ext = os.path.splitext(name)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp", ".svg"]:
        raise HTTPException(status_code=400, detail="unsupported")
    data = await file.read()
    if len(data) > 2_000_000:
        raise HTTPException(status_code=400, detail="too large")
    os.makedirs(MEDIA_ROOT, exist_ok=True)
    out = os.path.join(MEDIA_ROOT, name)
    i = 1
    base = os.path.splitext(name)[0]
    while os.path.exists(out):
        out = os.path.join(MEDIA_ROOT, f"{base}_{i}{ext}")
        i += 1
    with open(out, "wb") as f:
        f.write(data)
    url = f"/media/{os.path.basename(out)}"
    return JSONResponse({"url": url})
