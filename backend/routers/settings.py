from fastapi import APIRouter, Depends
from utils.auth import get_current_user
from utils.sheets import gas_create_headers, gas_get_all
from config import get_settings
import httpx

router = APIRouter()
settings = get_settings()

@router.post("/test-sheets")
async def test_sheets(data: dict, user=Depends(get_current_user)):
    url = data.get("url", "")
    if not url:
        return {"ok": False, "message": "No URL provided"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(f"{url}?action=getAll&sheet=Students")
            if res.status_code == 200:
                return {"ok": True, "message": "Connection successful! Google Sheets is connected."}
            return {"ok": False, "message": f"HTTP {res.status_code}"}
    except Exception as e:
        return {"ok": False, "message": str(e)}

@router.post("/create-headers")
async def create_headers(user=Depends(get_current_user)):
    result = await gas_create_headers()
    return {"ok": True, "result": result}

@router.post("/sync")
async def manual_sync(user=Depends(get_current_user)):
    students = await gas_get_all("Students")
    return {"ok": True, "synced": {"students": len(students)}}

@router.get("/info")
async def get_info(user=Depends(get_current_user)):
    return {
        "school":    "KINS SCHOOL",
        "address":   "Ratta Rd, Kins St, Gujranwala",
        "version":   "1.0.0",
        "sheetId":   settings.google_sheet_id or "Not configured",
        "scriptUrl": settings.google_script_url or "Not configured",
    }
