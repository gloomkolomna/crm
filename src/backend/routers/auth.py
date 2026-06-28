from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import (
    create_access_token,
    get_current_user,
    get_vk_login_url,
    exchange_vk_code,
    get_vk_user_info,
    is_vk_id_allowed,
    get_or_create_user,
    generate_state,
    set_state_cookie,
    verify_state,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    Token,
)
from models import User

router = APIRouter(
    prefix="/api/auth",
    tags=["Аутентификация"],
)


@router.get("/vk-login")
def vk_login(response: Response):
    state = generate_state()
    set_state_cookie(response, state)
    url = get_vk_login_url(state)
    return {"url": url}


@router.get("/vk-callback")
async def vk_callback(code: str, state: str, request: Request, db: Session = Depends(get_db)):
    expected_state = verify_state(request)
    if state != expected_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    token_data = await exchange_vk_code(code)
    vk_access_token = token_data["access_token"]
    vk_user_id = token_data["user_id"]

    if not is_vk_id_allowed(vk_user_id):
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    user_info = await get_vk_user_info(vk_access_token, vk_user_id)
    first_name = user_info.get("first_name", "")
    last_name = user_info.get("last_name", "")

    user = get_or_create_user(db, vk_user_id, first_name, last_name)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.vk_id)}, expires_delta=access_token_expires
    )

    frontend_url = "https://belovolovhome.ru/crm"
    response = RedirectResponse(url=f"{frontend_url}/login?token={access_token}", status_code=302)
    response.delete_cookie("vk_oauth_state")
    return response


@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "vk_id": current_user.vk_id,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
    }
