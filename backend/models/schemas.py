from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# ── Auth ─────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ── Student ──────────────────────────────────────────────
class StudentBase(BaseModel):
    name: str
    father: str
    admission: str
    family: Optional[str] = ""
    kinship: Optional[str] = "Son"
    fatherCell: Optional[str] = ""
    motherCell: Optional[str] = ""
    address: Optional[str] = ""
    class_: Optional[str] = ""
    paperFund: Optional[float] = 2000
    monthlyFee: Optional[float] = 1500
    admissionDate: Optional[str] = ""

    class Config:
        populate_by_name = True
        fields = {"class_": "class"}

class StudentCreate(StudentBase): pass
class StudentUpdate(StudentBase): pass
class Student(StudentBase):
    id: int

# ── Fee ──────────────────────────────────────────────────
class MonthFee(BaseModel):
    month: str
    year: int
    agreed: float
    paid: float
    status: str          # paid | partial | unpaid
    date: Optional[str] = ""
    notes: Optional[str] = ""

class PaperFund(BaseModel):
    agreed: float
    paid: float
    status: str
    date: Optional[str] = ""

class StationaryItem(BaseModel):
    item: str
    qty: int
    price: float
    total: float

class FeeRecord(BaseModel):
    studentId: int
    paperFund: Optional[PaperFund] = None
    months: Optional[dict] = {}
    stationary: Optional[List[StationaryItem]] = []
    remaining: Optional[float] = 0
    notes: Optional[str] = ""

# ── Receipt ──────────────────────────────────────────────
class Receipt(BaseModel):
    studentId: int
    studentName: str
    father: str
    class_: Optional[str] = ""
    admission: Optional[str] = ""
    receiptNo: str
    totalPaid: float
    remaining: float
    paidMonths: Optional[List[str]] = []
    paperFundPaid: Optional[float] = 0
    stationaryTotal: Optional[float] = 0
    date: str
    time: str

# ── Result ───────────────────────────────────────────────
class SubjectMark(BaseModel):
    name: str
    max: float
    obtained: float

class ResultRecord(BaseModel):
    studentId: int
    exam: str
    year: int
    class_: Optional[str] = ""
    subjects: List[SubjectMark]
    remarks: Optional[str] = ""

# ── Attendance ───────────────────────────────────────────
class AttendanceRecord(BaseModel):
    date: str
    studentId: int
    studentName: str
    class_: Optional[str] = ""
    status: str           # present | absent | leave

# ── Stationary ───────────────────────────────────────────
class InventoryItem(BaseModel):
    name: str
    category: str
    stock: int
    price: float
    unit: Optional[str] = "pcs"
    sold: Optional[int] = 0

# ── Settings ─────────────────────────────────────────────
class SheetConfig(BaseModel):
    url: Optional[str] = ""
    scriptUrl: Optional[str] = ""

class TestConnectionRequest(BaseModel):
    url: str
