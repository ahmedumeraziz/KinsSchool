from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Auth
    admin_username: str = "admin"
    admin_password: str = "admin123"
    jwt_secret:     str = "kins-school-secret-change-in-production"
    jwt_algorithm:  str = "HS256"
    jwt_expire_minutes: int = 1440

    # Google Sheets — set these in Render Environment Variables
    google_sheet_id:             str = ""
    google_script_url:           str = ""
    google_service_account_json: str = "credentials.json"

    class Config:
        env_file = ".env"
        extra    = "allow"

@lru_cache()
def get_settings():
    return Settings()
