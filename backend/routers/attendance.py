from fastapi import APIRouter, Depends
from utils.auth import get_current_user
from utils.sheets import gas_insert, gas_get_all
import time

router = APIRouter()
_attendance: list = []

@router.get("")
async def get_attendance(date: str = "", user=Depends(get_current_user)):
    if date:
        records = [r for r in _attendance if r.get("date") == date]
    else:
        records = _attendance
    return {"attendance": records}

@router.post("")
async def save_attendance(data: dict, user=Depends(get_current_user)):
    """data = { date, records: [{studentId, studentName, class, status}] }"""
    date = data.get("date", "")
    records = data.get("records", [])
    saved = []
    # Remove old records for this date
    global _attendance
    _attendance = [r for r in _attendance if r.get("date") != date]
    for rec in records:
        entry = {**rec, "id": int(time.time() * 1000), "date": date}
        _attendance.append(entry)
        saved.append(entry)
        await gas_insert("Attendance", entry)
    return {"saved": len(saved), "date": date}

@router.get("/monthly/{student_id}")
async def monthly_attendance(student_id: int, month: str = "", year: int = 0, user=Depends(get_current_user)):
    records = [r for r in _attendance if r.get("studentId") == student_id]
    total = len(records)
    present = len([r for r in records if r.get("status") == "present"])
    absent  = len([r for r in records if r.get("status") == "absent"])
    leave   = len([r for r in records if r.get("status") == "leave"])
    pct = round((present / total) * 100, 1) if total else 0
    return {"studentId": student_id, "total": total, "present": present,
            "absent": absent, "leave": leave, "percentage": pct}
