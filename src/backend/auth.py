import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
from database import get_db
from models import User
from config import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    VK_CLIENT_ID, VK_CLIENT_SECRET, VK_REDIRECT_URI, VK_API_VERSION,
    get_allowed_vk_ids,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

VK_AUTH_URL = "https://oauth.vk.com/authorize"
VK_TOKEN_URL = "https://oauth.vk.com/access_token"
VK_API_URL = "https://api.vk.com/method"

STATE_COOKIE = "vk_oauth_state"
STATE_TTL = 600


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    sub: Optional[str] = None


def get_user(db: Session, vk_id: str):
    return db.query(User).filter(User.vk_id == vk_id).first()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def generate_state() -> str:
    return secrets.token_urlsafe(32)


def get_vk_login_url(state: str) -> str:
    return (
        f"{VK_AUTH_URL}"
        f"?client_id={VK_CLIENT_ID}"
        f"&redirect_uri={VK_REDIRECT_URI}"
        f"&display=page"
        f"&response_type=code"
        f"&state={state}"
        f"&v={VK_API_VERSION}"
    )


async def exchange_vk_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            VK_TOKEN_URL,
            params={
                "client_id": VK_CLIENT_ID,
                "client_secret": VK_CLIENT_SECRET,
                "redirect_uri": VK_REDIRECT_URI,
                "code": code,
            },
        )
        data = resp.json()
        if "error" in data:
            raise HTTPException(status_code=400, detail=f"VK error: {data.get('error_description', data['error'])}")
        return data


async def get_vk_user_info(access_token: str, user_id: int) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{VK_API_URL}/users.get",
            params={
                "user_ids": str(user_id),
                "access_token": access_token,
                "v": VK_API_VERSION,
            },
        )
        data = resp.json()
        if "error" in data:
            raise HTTPException(status_code=400, detail=f"VK API error: {data['error'].get('error_msg', 'unknown')}")
        users = data.get("response", [])
        if not users:
            raise HTTPException(status_code=400, detail="VK user not found")
        return users[0]


def is_vk_id_allowed(vk_id: int) -> bool:
    return vk_id in get_allowed_vk_ids()


def get_or_create_user(db: Session, vk_id: int, first_name: str, last_name: str) -> User:
    vk_id_str = str(vk_id)
    user = db.query(User).filter(User.vk_id == vk_id_str).first()
    if user:
        user.first_name = first_name
        user.last_name = last_name
        user.username = f"{first_name} {last_name}"
        db.commit()
        return user

    user = User(
        vk_id=vk_id_str,
        username=f"{first_name} {last_name}",
        first_name=first_name,
        last_name=last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def set_state_cookie(response: Response, state: str):
    response.set_cookie(
        key=STATE_COOKIE,
        value=state,
        max_age=STATE_TTL,
        httponly=True,
        samesite="lax",
        secure=True,
    )


def verify_state(request: Request) -> str:
    state = request.cookies.get(STATE_COOKIE)
    if not state:
        raise HTTPException(status_code=400, detail="OAuth state cookie not found")
    return state


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None:
            raise credentials_exception
        token_data = TokenData(sub=sub)
    except JWTError:
        raise credentials_exception
    user = get_user(db, token_data.sub)
    if user is None:
        raise credentials_exception
    return user
