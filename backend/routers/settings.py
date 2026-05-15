from fastapi import APIRouter, Depends
from utils.auth import get_current_user
from utils.sheets import gas_create_headers, gas_get_all
from config import get_settings
import httpx

router   = APIRouter()
settings = get_settings()

@router.get("/info")
async def get_info(user=Depends(get_current_user)):
    """Return backend config so frontend can display connected URLs."""
    sheet_id  = settings.google_sheet_id or ""
    sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit" if sheet_id else ""
    return {
        "school":      "KINS SCHOOL",
        "address":     "Ratta Rd, Kins St, Gujranwala",
        "version":     "1.0.0",
        "sheetsUrl":   sheet_url,
        "scriptUrl":   settings.google_script_url or "",
        "sheetId":     sheet_id,
        "connected":   bool(sheet_id and settings.google_script_url),
    }

@router.post("/test-sheets")
async def test_sheets(data: dict, user=Depends(get_current_user)):
    url = data.get("url", "").strip()
    if not url:
        return {"ok": False, "message": "No URL provided"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(f"{url}?action=ping")
            if res.status_code == 200:
                return {"ok": True, "message": "Connection successful! Apps Script is responding."}
            return {"ok": False, "message": f"HTTP {res.status_code} — check your script URL."}
    except Exception as e:
        return {"ok": False, "message": f"Failed: {str(e)}"}

@router.post("/create-headers")
async def create_headers(user=Depends(get_current_user)):
    result = await gas_create_headers()
    return {"ok": True, "result": result}

@router.post("/sync")
async def manual_sync(user=Depends(get_current_user)):
    students = await gas_get_all("Students")
    fees     = await gas_get_all("Fees")
    return {
        "ok":     True,
        "synced": {
            "students": len(students),
            "fees":     len(fees),
        }
    }
