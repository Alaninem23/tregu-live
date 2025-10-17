from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.user import User

router = APIRouter(prefix="/account-id")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def mask(n: str) -> str:
    if not n or len(n) < 5: return "****"
    return n[:2] + "*****" + n[-2:]

@router.get("/me")
def me(user_id: str = Query(..., alias="user_id"), reveal: bool = False, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="not found")
    return {"masked": mask(u.account_number) if not reveal else u.account_number}
