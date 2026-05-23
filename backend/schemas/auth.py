from pydantic import BaseModel, EmailStr


class SignupSchema(BaseModel):
    email: EmailStr
    contact_no: str
    username: str
    password: str
    role: str


class LoginSchema(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    role: str
    user_id: str