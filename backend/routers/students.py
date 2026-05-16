from fastapi import APIRouter, Depends, HTTPException
from utils.auth import get_current_user
from utils.sheets import gas_get_all, gas_insert, gas_update, gas_delete
import time

router = APIRouter()

# Empty store — NO demo data. Google Sheets is the real database.
_store: list[dict] = []

@router.get("")
async def get_students(user=Depends(get_current_user)):
    """Always fetch from Google Sheets first. Fall back to memory only if Sheets fails."""
    remote = await gas_get_all("Students")
    if remote and len(remote) > 0:
        # Update memory cache with fresh data
        global _store
        _store = remote
        return {"students": remote, "source": "sheets"}
    # Fall back to memory cache (has any previously added students this session)
    return {"students": _store, "source": "cache"}

@router.post("")
async def create_student(data: dict, user=Depends(get_current_user)):
    new_id = int(time.time())
    record = {**data, "id": new_id}
    # Add to memory cache
    _store.append(record)
    # Save to Google Sheets
    result = await gas_insert("Students", record)
    return {"student": record, "sheets": result}

@router.put("/{student_id}")
async def update_student(student_id: int, data: dict, user=Depends(get_current_user)):
    global _store
    updated = None
    for i, s in enumerate(_store):
        if str(s.get("id")) == str(student_id):
            _store[i] = {**s, **data, "id": student_id}
            updated = _store[i]
            break
    if not updated:
        # Not in cache — still update in Sheets
        updated = {**data, "id": student_id}
    result = await gas_update("Students", str(student_id), updated)
    return {"student": updated, "sheets": result}

@router.delete("/{student_id}")
async def delete_student(student_id: int, user=Depends(get_current_user)):
    global _store
    _store = [s for s in _store if str(s.get("id")) != str(student_id)]
    result = await gas_delete("Students", str(student_id))
    return {"deleted": True, "sheets": result}

@router.get("/{student_id}")
async def get_student(student_id: int, user=Depends(get_current_user)):
    # Try memory first
    for s in _store:
        if str(s.get("id")) == str(student_id):
            return {"student": s}
    # Try Sheets
    remote = await gas_get_all("Students")
    for s in remote:
        if str(s.get("id")) == str(student_id):
            return {"student": s}
    raise HTTPException(status_code=404, detail="Student not found")
