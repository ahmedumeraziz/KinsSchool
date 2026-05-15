from fastapi import APIRouter, Depends, HTTPException
from utils.auth import get_current_user
import httpx
import os

router = APIRouter()

def get_sheet_id() -> str:
    # Read directly from os.environ — most reliable on Render
    return os.environ.get("GOOGLE_SHEET_ID", "").strip()

def get_script_url() -> str:
    return os.environ.get("GOOGLE_SCRIPT_URL", "").strip()

@router.get("/info")
async def get_info(user=Depends(get_current_user)):
    sheet_id   = get_sheet_id()
    script_url = get_script_url()
    sheet_url  = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit"
        if sheet_id else ""
    )
    return {
        "school":       "KINS SCHOOL",
        "address":      "Ratta Rd, Kins St, Gujranwala",
        "version":      "1.0.0",
        "sheetsUrl":    sheet_url,
        "scriptUrl":    script_url,
        "sheetId":      sheet_id,
        "connected":    bool(sheet_id and script_url),
        "sheetIdSet":   bool(sheet_id),
        "scriptUrlSet": bool(script_url),
        # Debug info — remove later
        "debug": {
            "sheet_id_length":   len(sheet_id),
            "script_url_length": len(script_url),
            "env_keys": [k for k in os.environ.keys() if "GOOGLE" in k or "SHEET" in k or "SCRIPT" in k],
        }
    }

@router.post("/test-sheets")
async def test_sheets(data: dict, user=Depends(get_current_user)):
    script_url = get_script_url()
    url = data.get("url", "").strip() or script_url
    if not url:
        return {
            "ok":      False,
            "message": "No Apps Script URL found. Add GOOGLE_SCRIPT_URL in Render environment variables."
        }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.get(f"{url}?action=ping")
            if res.status_code == 200:
                return {"ok": True, "message": "✅ Connection successful! Apps Script is responding."}
            return {"ok": False, "message": f"❌ HTTP {res.status_code} — check your Apps Script URL."}
    except Exception as e:
        return {"ok": False, "message": f"❌ Failed: {str(e)}"}

@router.post("/create-headers")
async def create_headers(user=Depends(get_current_user)):
    script_url = get_script_url()
    if not script_url:
        raise HTTPException(
            status_code=400,
            detail="GOOGLE_SCRIPT_URL not set in Render environment variables."
        )
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.get(f"{script_url}?action=createHeaders")
            if res.status_code == 200:
                data = res.json()
                return {
                    "ok":      True,
                    "created": data.get("data", {}).get("created", []),
                    "existing":data.get("data", {}).get("existing", []),
                    "message": "All sheet headers created successfully!",
                }
            return {"ok": False, "message": f"Script returned HTTP {res.status_code}"}
    except Exception as e:
        return {"ok": False, "message": f"Error: {str(e)}"}

@router.post("/sync")
async def manual_sync(user=Depends(get_current_user)):
    script_url = get_script_url()
    if not script_url:
        return {"ok": False, "message": "GOOGLE_SCRIPT_URL not configured in Render environment."}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            s_res = await client.get(f"{script_url}?action=getAll&sheet=Students")
            f_res = await client.get(f"{script_url}?action=getAll&sheet=Fees")
            students = s_res.json().get("data", []) if s_res.status_code == 200 else []
            fees     = f_res.json().get("data", []) if f_res.status_code == 200 else []
        return {
            "ok":     True,
            "synced": {
                "students": len(students),
                "fees":     len(fees),
            }
        }
    except Exception as e:
        return {"ok": False, "message": str(e)}
