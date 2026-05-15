from fastapi import APIRouter, Depends
from utils.auth import get_current_user
from utils.sheets import gas_get_all, gas_insert, gas_update
from datetime import datetime
import time

router = APIRouter()

# In-memory cache — persists for session, Google Sheets is the real DB
_fees: dict = {}

@router.get("/{student_id}")
async def get_fees(student_id: int, user=Depends(get_current_user)):
    # Try Google Sheets first
    all_fees = await gas_get_all("Fees")
    student_fees = [f for f in all_fees if str(f.get("studentId")) == str(student_id)]
    if student_fees:
        return {"fees": student_fees, "source": "sheets"}
    # Fall back to memory cache
    return {"fees": _fees.get(student_id, {}), "source": "cache"}

@router.post("")
async def save_fee(data: dict, user=Depends(get_current_user)):
    """Save fee record — saves each month as a separate row in Google Sheets."""
    student_id   = data.get("studentId")
    student_name = data.get("studentName", "")
    months       = data.get("months", {})
    paper_fund   = data.get("paperFund", {})
    stationary   = data.get("stationary", [])
    remaining    = data.get("remaining", 0)
    notes        = data.get("notes", "")
    year         = datetime.now().year

    # Save to memory cache
    _fees[student_id] = data

    saved_rows = []

    # Save each month as a row in Fees sheet
    for month, m_data in months.items():
        if m_data.get("status") != "unpaid":
            row = {
                "id":          int(time.time() * 1000) + hash(month) % 1000,
                "studentId":   student_id,
                "studentName": student_name,
                "month":       month,
                "year":        year,
                "agreed":      m_data.get("agreed", 0),
                "paid":        m_data.get("paid", 0),
                "status":      m_data.get("status", "unpaid"),
                "date":        m_data.get("date", ""),
                "notes":       notes,
            }
            result = await gas_insert("Fees", row)
            saved_rows.append({"month": month, "result": result})

    # Save paper fund as a row
    if paper_fund.get("status") != "unpaid":
        pf_row = {
            "id":          int(time.time() * 1000) + 9999,
            "studentId":   student_id,
            "studentName": student_name,
            "month":       "Paper Fund",
            "year":        year,
            "agreed":      paper_fund.get("agreed", 0),
            "paid":        paper_fund.get("paid", 0),
            "status":      paper_fund.get("status", "unpaid"),
            "date":        paper_fund.get("date", ""),
            "notes":       notes,
        }
        await gas_insert("Fees", pf_row)

    # Save stationary items
    for item in stationary:
        if item.get("total", 0) > 0:
            stat_row = {
                "id":          int(time.time() * 1000) + item.get("id", 0) % 1000,
                "studentId":   student_id,
                "studentName": student_name,
                "month":       f"Stationary: {item.get('item', '')}",
                "year":        year,
                "agreed":      item.get("total", 0),
                "paid":        item.get("total", 0),
                "status":      "paid",
                "date":        datetime.now().strftime("%d/%m/%Y"),
                "notes":       f"Qty: {item.get('qty', 1)} x Rs.{item.get('price', 0)}",
            }
            await gas_insert("Fees", stat_row)

    return {
        "saved":     True,
        "rows":      len(saved_rows),
        "remaining": remaining,
    }

@router.get("/defaulters/list")
async def get_defaulters(user=Depends(get_current_user)):
    all_fees = await gas_get_all("Fees")
    students = await gas_get_all("Students")
    student_map = {str(s.get("id")): s for s in students}

    # Group by student
    grouped = {}
    for fee in all_fees:
        sid = str(fee.get("studentId"))
        if fee.get("status") in ("unpaid", "partial"):
            if sid not in grouped:
                grouped[sid] = {
                    "studentId":   sid,
                    "student":     student_map.get(sid, {}),
                    "unpaidMonths": [],
                    "totalDue":    0,
                }
            grouped[sid]["unpaidMonths"].append(fee.get("month", ""))
            grouped[sid]["totalDue"] += float(fee.get("agreed", 0)) - float(fee.get("paid", 0))

    defaulters = list(grouped.values())
    for d in defaulters:
        d["status"] = "strict" if len(d["unpaidMonths"]) >= 2 else "first"

    return {"defaulters": defaulters}
