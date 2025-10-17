import os, uuid, io
from typing import Tuple
from PIL import Image

S3_ENABLED = bool(os.getenv("S3_ENDPOINT") or os.getenv("S3_BUCKET") or os.getenv("AWS_S3_BUCKET"))


def _resize(img: Image.Image, max_w: int, max_h: int) -> Image.Image:
    img = img.copy()
    img.thumbnail((max_w, max_h))
    return img


def make_renditions(raw_bytes: bytes, mime: str) -> Tuple[bytes, bytes, bytes]:
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    full = io.BytesIO();  img_full = _resize(img, 2048, 2048); img_full.save(full, format="WEBP", quality=90)
    med  = io.BytesIO();  img_med  = _resize(img,  512,  512); img_med.save(med,  format="WEBP", quality=90)
    th   = io.BytesIO();  img_th   = _resize(img,  128,  128); img_th.save(th,   format="WEBP", quality=90)
    return (full.getvalue(), med.getvalue(), th.getvalue())


def put_object_local(base_dir: str, key: str, data: bytes) -> str:
    p = os.path.join(base_dir, key.replace("/", os.sep))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f:
        f.write(data)
    return f"/media/{key}"


def put_avatar_bytes(user_id: str, raw: bytes, mime: str):
    full, med, th = make_renditions(raw, mime)
    keybase = f"avatars/{user_id}/{uuid.uuid4().hex}"
    bucket = os.getenv("S3_BUCKET") or os.getenv("AWS_S3_BUCKET")
    if S3_ENABLED:
        import importlib
        try:
            boto3 = importlib.import_module("boto3")
        except Exception as e:
            raise RuntimeError("S3 is enabled but boto3 is not installed. Please add boto3 to requirements and install it.") from e
        s3 = boto3.client(
            "s3",
            endpoint_url=os.getenv("S3_ENDPOINT") or None,
            aws_access_key_id=os.getenv("S3_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("S3_REGION") or os.getenv("AWS_REGION") or "us-east-1",
        )
        k_full = f"{keybase}_full.webp"
        k_med  = f"{keybase}_med.webp"
        k_th   = f"{keybase}_th.webp"
        s3.put_object(Bucket=bucket, Key=k_full, Body=full, ContentType="image/webp", ACL="public-read")
        s3.put_object(Bucket=bucket, Key=k_med,  Body=med,  ContentType="image/webp", ACL="public-read")
        s3.put_object(Bucket=bucket, Key=k_th,   Body=th,   ContentType="image/webp", ACL="public-read")
        base = os.getenv("PUBLIC_CDN_BASE") or os.getenv("S3_PUBLIC_BASE")
        if not base:
            # derive a reasonable default from endpoint + bucket
            ep = os.getenv("S3_ENDPOINT") or ""
            if ep:
                ep = ep.rstrip("/")
                base = f"{ep}/{bucket}"
            else:
                base = f"https://{bucket}.s3.amazonaws.com"
        return (k_full, f"{base}/{k_full}", f"{base}/{k_med}", f"{base}/{k_th}", len(raw))
    else:
        media_root = os.getenv("MEDIA_ROOT", "var/media")
        k_full = f"{keybase}_full.webp"
        k_med  = f"{keybase}_med.webp"
        k_th   = f"{keybase}_th.webp"
        u_full = put_object_local(media_root, k_full, full)
        u_med  = put_object_local(media_root, k_med,  med)
        u_th   = put_object_local(media_root, k_th,   th)
        return (k_full, u_full, u_med, u_th, len(raw))
