from fastapi import APIRouter, HTTPException, status
from models.schemas import LoginRequest, TokenResponse
from utils.auth import create_token
from config import get_settings

router   = APIRouter()
settings = get_settings()

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    if req.username != settings.admin_username or req.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_token({"sub": req.username, "role": "admin"})
    return TokenResponse(access_token=token, user={"username": req.username, "role": "admin"})

@router.get("/me")
async def me():
    return {"username": "admin", "role": "admin", "school": "KINS SCHOOL"}
