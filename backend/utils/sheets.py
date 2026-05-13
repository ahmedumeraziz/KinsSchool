import httpx
import gspread
from google.oauth2.service_account import Credentials
from config import get_settings
import os, json

settings = get_settings()

SCOPES = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive",
]

def get_gspread_client():
    """Connect via service account JSON."""
    creds_path = settings.google_service_account_json
    if not os.path.exists(creds_path):
        return None
    creds = Credentials.from_service_account_file(creds_path, scopes=SCOPES)
    return gspread.authorize(creds)

def get_sheet(sheet_name: str):
    gc = get_gspread_client()
    if not gc or not settings.google_sheet_id:
        return None
    try:
        spreadsheet = gc.open_by_key(settings.google_sheet_id)
        return spreadsheet.worksheet(sheet_name)
    except Exception:
        return None

def sheet_to_list(sheet) -> list[dict]:
    """Convert sheet rows to list of dicts."""
    if not sheet:
        return []
    records = sheet.get_all_records()
    return records

async def gas_request(action: str, sheet: str, data: dict = None, record_id: str = None) -> dict:
    """Call Google Apps Script Web App endpoint."""
    if not settings.google_script_url:
        return {"error": "Script URL not configured"}
    params = {"action": action, "sheet": sheet}
    if record_id:
        params["id"] = record_id
    if data:
        params["data"] = json.dumps(data)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.get(settings.google_script_url, params=params)
            return res.json()
    except Exception as e:
        return {"error": str(e)}

async def gas_get_all(sheet: str) -> list:
    result = await gas_request("getAll", sheet)
    return result.get("data", []) if isinstance(result, dict) else []

async def gas_insert(sheet: str, data: dict) -> dict:
    return await gas_request("insert", sheet, data=data)

async def gas_update(sheet: str, record_id: str, data: dict) -> dict:
    return await gas_request("update", sheet, data=data, record_id=record_id)

async def gas_delete(sheet: str, record_id: str) -> dict:
    return await gas_request("delete", sheet, record_id=record_id)

async def gas_create_headers() -> dict:
    return await gas_request("createHeaders", "")
