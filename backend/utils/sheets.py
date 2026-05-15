import httpx
import os
import json

def get_script_url() -> str:
    return os.environ.get("GOOGLE_SCRIPT_URL", "").strip()

async def gas_request(action: str, sheet: str, data: dict = None, record_id: str = None) -> dict:
    """Call Google Apps Script Web App — follow redirects, flatten nested data."""
    script_url = get_script_url()
    if not script_url:
        return {"error": "GOOGLE_SCRIPT_URL not configured"}

    params = {"action": action, "sheet": sheet}
    if record_id:
        params["id"] = str(record_id)
    if data:
        # Flatten nested dicts/lists to JSON string for Apps Script
        flat = {}
        for k, v in data.items():
            if isinstance(v, (dict, list)):
                flat[k] = json.dumps(v)
            else:
                flat[k] = v
        params["data"] = json.dumps(flat)

    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            res = await client.get(script_url, params=params)
            if res.status_code == 200:
                return res.json()
            return {"error": f"HTTP {res.status_code}"}
    except Exception as e:
        return {"error": str(e)}

async def gas_get_all(sheet: str) -> list:
    result = await gas_request("getAll", sheet)
    if isinstance(result, dict) and result.get("success"):
        return result.get("data", [])
    return []

async def gas_insert(sheet: str, data: dict) -> dict:
    return await gas_request("insert", sheet, data=data)

async def gas_update(sheet: str, record_id: str, data: dict) -> dict:
    return await gas_request("update", sheet, data=data, record_id=record_id)

async def gas_delete(sheet: str, record_id: str) -> dict:
    return await gas_request("delete", sheet, record_id=record_id)

async def gas_create_headers() -> dict:
    script_url = get_script_url()
    if not script_url:
        return {"error": "GOOGLE_SCRIPT_URL not configured"}
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            res = await client.get(f"{script_url}?action=createHeaders")
            if res.status_code == 200:
                return res.json()
            return {"error": f"HTTP {res.status_code}"}
    except Exception as e:
        return {"error": str(e)}
