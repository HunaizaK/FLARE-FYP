from pydantic import BaseModel
from typing import Optional


class ShelterCreate(BaseModel):
    shelter_name: str
    location: str
    capacity: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ShelterUpdate(BaseModel):
    shelter_name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None