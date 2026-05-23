from pydantic import BaseModel
from typing import Optional


class LostFoundCreate(BaseModel):
    category: str
    location: str
    contact: str
    name: str
    post_type: str
    additional_info: Optional[str] = None


class LostFoundUpdate(BaseModel):
    category: Optional[str] = None
    location: Optional[str] = None
    contact: Optional[str] = None
    name: Optional[str] = None
    post_type: Optional[str] = None
    additional_info: Optional[str] = None