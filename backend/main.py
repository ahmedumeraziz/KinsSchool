from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from routers import auth, students, fees, receipts, results, attendance, stationary, reports, settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🎓 KINS SCHOOL API starting…")
    yield
    print("🎓 KINS SCHOOL API shutting down…")

app = FastAPI(
    title="KINS SCHOOL Management API",
    description="Backend API for KINS SCHOOL Management System — Gujranwala",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(students.router,   prefix="/api/students",   tags=["Students"])
app.include_router(fees.router,       prefix="/api/fees",       tags=["Fees"])
app.include_router(receipts.router,   prefix="/api/receipts",   tags=["Receipts"])
app.include_router(results.router,    prefix="/api/results",    tags=["Results"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(stationary.router, prefix="/api/stationary", tags=["Stationary"])
app.include_router(reports.router,    prefix="/api/reports",    tags=["Reports"])
app.include_router(settings.router,   prefix="/api/settings",   tags=["Settings"])

@app.get("/")
async def root():
    return {"message": "🎓 KINS SCHOOL API is running", "version": "1.0.0", "school": "KINS SCHOOL, Gujranwala"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
