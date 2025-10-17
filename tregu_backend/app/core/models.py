from __future__ import annotations
from typing import Any, Optional, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class Envelope(BaseModel, Generic[T]):
    ok: bool = True
    data: Optional[T] = None
    error: Optional[dict] = None
    meta: dict = Field(default_factory=dict)

class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
