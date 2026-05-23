from pydantic import BaseModel
from typing import Optional


class OrganizationResponse(BaseModel):
    id: str
    organization_name: str
    address: Optional[str]
    contact_person: Optional[str]
    email: Optional[str]


class OrganizationCreate(BaseModel):
    organization_name: str
    address: Optional[str]
    contact_person: Optional[str]