from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    Token,
)
from models import User

router = APIRouter(
    prefix="/api/auth",
    tags=["Аутентификация"],
)


@router.post("/register")
def register(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")
    if not username or not password:
        raise HTTPException(status_code=400, detail="username и password обязательны")
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
    user = User(
        username=username,
        password_hash=get_password_hash(password),
        email=email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Пользователь успешно зарегистрирован", "id": user.id}


@router.post("/login", response_model=Token)
def login(form_data: dict, db: Session = Depends(get_db)):
    username = form_data.get("username")
    password = form_data.get("password")

    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }