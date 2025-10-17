from pydantic import BaseModel
from typing import Literal

Role = Literal["buyer", "seller", "admin"]

class RoleUpdate(BaseModel):
    role: Role

class SettingsUpdate(BaseModel):
    theme: str | None = None
    registrations_open: bool | None = None
