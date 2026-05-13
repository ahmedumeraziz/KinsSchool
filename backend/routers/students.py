from fastapi import APIRouter, Depends, HTTPException
from models.schemas import StudentCreate, StudentUpdate
from utils.auth import get_current_user
from utils.sheets import gas_get_all, gas_insert, gas_update, gas_delete
import time

router = APIRouter()

# In-memory fallback store (used when Sheets not configured)
_store: list[dict] = [
    {"id": 1, "name": "Ahmed Raza",   "father": "Muhammad Raza", "admission": "KS-2024-001", "family": "FAM-001", "kinship": "Son",      "fatherCell": "0300-1234567", "motherCell": "0301-1234567", "address": "House 12, Ratta Rd",      "class": "Class 5",  "paperFund": 2000, "monthlyFee": 1500, "admissionDate": "2024-01-15"},
    {"id": 2, "name": "Sara Malik",   "father": "Tariq Malik",   "admission": "KS-2024-002", "family": "FAM-002", "kinship": "Daughter", "fatherCell": "0311-2345678", "motherCell": "0312-2345678", "address": "House 45, Kins St",       "class": "Class 3",  "paperFund": 2000, "monthlyFee": 1500, "admissionDate": "2024-02-01"},
    {"id": 3, "name": "Usman Ali",    "father": "Khalid Ali",    "admission": "KS-2024-003", "family": "FAM-003", "kinship": "Son",      "fatherCell": "0322-3456789", "motherCell": "",             "address": "House 78, Main Bazar",    "class": "Class 7",  "paperFund": 2500, "monthlyFee": 2000, "admissionDate": "2024-01-20"},
    {"id": 4, "name": "Fatima Khan",  "father": "Imran Khan",    "admission": "KS-2024-004", "family": "FAM-004", "kinship": "Daughter", "fatherCell": "0333-4567890", "motherCell": "0334-4567890", "address": "House 90, Garden Town",   "class": "Class 8",  "paperFund": 2500, "monthlyFee": 2000, "admissionDate": "2024-03-10"},
    {"id": 5, "name": "Bilal Hassan", "father": "Asif Hassan",   "admission": "KS-2024-005", "family": "FAM-001", "kinship": "Son",      "fatherCell": "0300-1234567", "motherCell": "0301-1234567", "address": "House 12, Ratta Rd",      "class": "Class 6",  "paperFund": 2000, "monthlyFee": 1500, "admissionDate": "2024-01-15"},
    {"id": 6, "name": "Zainab Iqbal", "father": "Naveed Iqbal",  "admission": "KS-2024-006", "family": "FAM-005", "kinship": "Daughter", "fatherCell": "0344-5678901", "motherCell": "0345-5678901", "address": "House 23, Satellite Town","class": "Class 4",  "paperFund": 2000, "monthlyFee": 1500, "admissionDate": "2024-02-15"},
    {"id": 7, "name": "Ali Hassan",   "father": "Noman Hassan",  "admission": "KS-2024-007", "family": "FAM-006", "kinship": "Son",      "fatherCell": "0355-6789012", "motherCell": "",             "address": "House 56, Civil Lines",   "class": "Class 9",  "paperFund": 3000, "monthlyFee": 2500, "admissionDate": "2024-01-10"},
    {"id": 8, "name": "Hina Shah",    "father": "Waqas Shah",    "admission": "KS-2024-008", "family": "FAM-007", "kinship": "Daughter", "fatherCell": "0366-7890123", "motherCell": "0367-7890123", "address": "House 89, Officers Colony","class": "Class 10", "paperFund": 3000, "monthlyFee": 2500, "admissionDate": "2024-01-12"},
]

@router.get("")
async def get_students(user=Depends(get_current_user)):
    remote = await gas_get_all("Students")
    if remote:
        return {"students": remote}
    return {"students": _store}

@router.post("")
async def create_student(data: StudentCreate, user=Depends(get_current_user)):
    new_id = int(time.time())
    record = {"id": new_id, **data.model_dump(by_alias=True)}
    record["class"] = data.class_
    _store.append(record)
    await gas_insert("Students", record)
    return {"student": record}

@router.put("/{student_id}")
async def update_student(student_id: int, data: StudentUpdate, user=Depends(get_current_user)):
    for i, s in enumerate(_store):
        if s["id"] == student_id:
            _store[i] = {**s, **data.model_dump(by_alias=True), "id": student_id}
            await gas_update("Students", str(student_id), _store[i])
            return {"student": _store[i]}
    raise HTTPException(status_code=404, detail="Student not found")

@router.delete("/{student_id}")
async def delete_student(student_id: int, user=Depends(get_current_user)):
    global _store
    _store = [s for s in _store if s["id"] != student_id]
    await gas_delete("Students", str(student_id))
    return {"deleted": True}

@router.get("/{student_id}")
async def get_student(student_id: int, user=Depends(get_current_user)):
    for s in _store:
        if s["id"] == student_id:
            return {"student": s}
    raise HTTPException(status_code=404, detail="Student not found")
