from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
import os
from dotenv import load_dotenv
from fastapi import HTTPException
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET", "secret")
ALGORITHM = "HS256"
EXPIRATION = int(os.getenv("JWT_EXPIRATION", 86400))


def hash_password(password: str):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str):
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=EXPIRATION)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
    



def require_admin(payload):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")