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
    generate_code_verifier,
    compute_code_challenge,
    generate_device_id,
    set_oauth_cookies,
    verify_state,
    get_code_verifier,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from models import User

router = APIRouter(
    prefix="/api/auth",
    tags=["Аутентификация"],
)


@router.get("/vk-login")
def vk_login(response: Response):
    state = generate_state()
    code_verifier = generate_code_verifier()
    code_challenge = compute_code_challenge(code_verifier)
    set_oauth_cookies(response, state, code_verifier)
    url = get_vk_login_url(state, code_challenge)
    return {"url": url}


@router.get("/vk-callback")
async def vk_callback(code: str, state: str, request: Request, db: Session = Depends(get_db)):
    expected_state = verify_state(request)
    if state != expected_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    code_verifier = get_code_verifier(request)
    device_id = generate_device_id()

    token_data = await exchange_vk_code(code, code_verifier, device_id)
    vk_access_token = token_data["access_token"]

    user_info = await get_vk_user_info(vk_access_token)
    vk_user_id = user_info.get("user_id")
    if not vk_user_id:
        raise HTTPException(status_code=400, detail="VK user_id not found in response")

    if not is_vk_id_allowed(vk_user_id):
        raise HTTPException(status_code=403, detail="Доступ запрещён")

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
    response.delete_cookie("vk_code_verifier")
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
