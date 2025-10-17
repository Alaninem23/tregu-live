from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Optional
from sqlalchemy import text
from app.deps import get_db
from app.storage import put_avatar_bytes
from app.auth import get_current_user
from app import models
from app.db import engine
import uuid

router = APIRouter(prefix="/api/profile", tags=["Profile"]) 

def _safe_username(u: str) -> str:
    u = (u or "").strip()
    if not u or len(u) < 3 or len(u) > 32:
        raise HTTPException(400, "username length 3..32")
    if not all(c.isalnum() or c in ("_", ".", "-") for c in u):
        raise HTTPException(400, "invalid username chars")
    return u

def _is_pg() -> bool:
    try:
        return engine.dialect.name == "postgresql"
    except Exception:
        return False

def _ensure_sqlite_tables(db):
    if _is_pg():
        return
    # Create minimal tables for dev when using SQLite fallback
    db.execute(text(
        """
        create table if not exists user_profiles (
            user_id integer primary key,
            username text unique,
            display_name text,
            bio text,
            location text,
            website_url text,
            twitter_url text,
            linkedin_url text,
            is_public integer default 1,
            updated_at text default (datetime('now'))
        )
        """
    ))
    db.execute(text(
        """
        create table if not exists user_media (
            id text primary key,
            user_id integer not null,
            kind text not null,
            storage_key text,
            url_full text,
            url_medium text,
            url_thumb text,
            mime_type text,
            bytes integer,
            created_at text default (datetime('now'))
        )
        """
    ))

@router.get("/me")
def me(current_user: models.User = Depends(get_current_user), db = Depends(get_db)):
    _ensure_sqlite_tables(db)
    schema_user = ""  # users table lives in public via ORM models
    schema_prof = "tregu." if _is_pg() else ""
    qp = f"""
        select u.id, u.email,
               p.username, p.display_name, p.bio, p.location, p.website_url,
               p.twitter_url, p.linkedin_url, p.is_public,
               m.url_full as avatar_full, m.url_medium as avatar_medium, m.url_thumb as avatar_thumb
        from {schema_user}users u
    left join {schema_prof}user_profiles p on p.user_id = u.id
    left join {schema_prof}user_media m on m.user_id = u.id and m.kind = 'avatar'
         where u.id = :uid
    """
    row = db.execute(text(qp).execution_options(autocommit=False), {"uid": current_user.id}).mappings().first()
    return {"ok": True, "profile": dict(row) if row else None}

@router.put("/me")
def update_me(
    current_user: models.User = Depends(get_current_user),
    username: str = Form(...),
    display_name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    website_url: Optional[str] = Form(None),
    twitter_url: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    is_public: bool = Form(True),
    db = Depends(get_db)
):
    _ensure_sqlite_tables(db)
    username = _safe_username(username)
    schema = "tregu." if _is_pg() else ""
    taken = db.execute(text(
        f"select user_id from {schema}user_profiles where lower(username)=lower(:u) and user_id <> :me"
    ), {"u": username, "me": current_user.id}).first()
    if taken:
        raise HTTPException(409, "username already taken")

        db.execute(text(
                f"""
                insert into {schema}user_profiles (user_id, username, display_name, bio, location, website_url, twitter_url, linkedin_url, is_public)
                values (:uid,:username,:display_name,:bio,:location,:website_url,:twitter_url,:linkedin_url,:is_public)
                on conflict (user_id) do update set
                    username=excluded.username,
                    display_name=excluded.display_name,
                    bio=excluded.bio,
                    location=excluded.location,
                    website_url=excluded.website_url,
                    twitter_url=excluded.twitter_url,
                    linkedin_url=excluded.linkedin_url,
                    is_public=excluded.is_public,
                    updated_at=CURRENT_TIMESTAMP
                """
        ), {
        "uid": current_user.id,
        "username": username,
        "display_name": display_name,
        "bio": bio,
        "location": location,
        "website_url": website_url,
        "twitter_url": twitter_url,
        "linkedin_url": linkedin_url,
        "is_public": is_public,
    })
    db.commit()
    return {"ok": True}

@router.post("/me/avatar")
async def upload_avatar(current_user: models.User = Depends(get_current_user), file: UploadFile = File(...), db = Depends(get_db)):
    _ensure_sqlite_tables(db)
    if file.content_type not in ("image/jpeg","image/png","image/webp"):
        raise HTTPException(400, "invalid image type")
    raw = await file.read()
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(400, "file too large (8MB limit)")
    key, u_full, u_med, u_th, bytesz = put_avatar_bytes(str(current_user.id), raw, file.content_type)

    schema = "tregu." if _is_pg() else ""
    db.execute(text(f"delete from {schema}user_media where user_id=:u and kind='avatar'"), {"u": current_user.id})
    db.execute(text(
        f"""
        insert into {schema}user_media (id, user_id, kind, storage_key, url_full, url_medium, url_thumb, mime_type, bytes)
        values (:id, :uid, 'avatar', :key, :u_full, :u_med, :u_th, :mime, :bytes)
        """
    ), {"id": str(uuid.uuid4()), "uid": current_user.id, "key": key, "u_full": u_full, "u_med": u_med, "u_th": u_th, "mime": "image/webp", "bytes": bytesz})
    db.commit()
    return {"ok": True, "url_full": u_full, "url_medium": u_med, "url_thumb": u_th}

@router.get("/by-username/{username}")
def public_profile(username: str, db = Depends(get_db)):
    _ensure_sqlite_tables(db)
    schema = "tregu." if _is_pg() else ""
    q = f"""
        select p.username, p.display_name, p.bio, p.location, p.website_url, p.twitter_url, p.linkedin_url, p.is_public,
               m.url_full as avatar_full, m.url_medium as avatar_medium, m.url_thumb as avatar_thumb
          from {schema}user_profiles p
     left join {schema}user_media m on m.user_id = p.user_id and m.kind='avatar'
         where lower(p.username)=lower(:u)
    """
    row = db.execute(text(q), {"u": username}).mappings().first()
    if not row:
        raise HTTPException(404, "not found")
    d = dict(row)
    if not d.get("is_public"):
        d["bio"] = None; d["website_url"] = None; d["twitter_url"] = None; d["linkedin_url"] = None
    return {"ok": True, "profile": d}
