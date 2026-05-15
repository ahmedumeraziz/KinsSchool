from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Auth
    admin_username:     str = "admin"
    admin_password:     str = "admin123"
    jwt_secret:         str = "kins-school-secret-change-in-production"
    jwt_algorithm:      str = "HS256"
    jwt_expire_minutes: int = 1440

    # Google Sheets — set in Render Environment Variables
    google_sheet_id:             str = ""
    google_script_url:           str = ""
    google_service_account_json: str = "credentials.json"

    class Config:
        env_file = ".env"
        extra    = "allow"

# NO lru_cache — read fresh every time so Render env vars always picked up
def get_settings() -> Settings:
    return Settings()
