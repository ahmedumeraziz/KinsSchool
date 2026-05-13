"""fees.py"""
from fastapi import APIRouter, Depends
from utils.auth import get_current_user
from utils.sheets import gas_get_all, gas_insert
from datetime import datetime
import time

router = APIRouter()
_fees: dict = {}

@router.get("/{student_id}")
async def get_fees(student_id: int, user=Depends(get_current_user)):
    return {"fees": _fees.get(student_id, {})}

@router.post("")
async def save_fee(data: dict, user=Depends(get_current_user)):
    sid = data.get("studentId")
    _fees[sid] = data
    await gas_insert("Fees", {**data, "id": int(time.time())})
    return {"saved": True}

@router.get("/defaulters")
async def get_defaulters(month: str = "", year: int = 0, user=Depends(get_current_user)):
    defaulters = []
    for sid, fee in _fees.items():
        months = fee.get("months", {})
        unpaid = [m for m, d in months.items() if d.get("status") == "unpaid"]
        if unpaid:
            defaulters.append({"studentId": sid, "unpaidMonths": unpaid, "remaining": fee.get("remaining", 0)})
    return {"defaulters": defaulters}
