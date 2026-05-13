# 🎓 KINS SCHOOL Management System

**KINS SCHOOL** — Ratta Rd, Kins St, Gujranwala  
Full-stack School Management Software with Google Sheets as Database.

---

## 🗂️ Project Structure

```
kins-school/
├── frontend/          # React + Vite + Tailwind PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Reusable UI components
│   │   │   ├── layout/       # Sidebar, TopBar, Layout
│   │   │   └── pages/        # All page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Helpers, API, DB
│   │   └── store/            # Zustand state management
│   ├── public/
│   └── index.html
├── backend/           # FastAPI Python backend
│   ├── routers/       # API route handlers
│   ├── models/        # Pydantic models
│   ├── services/      # Business logic
│   └── utils/         # Google Sheets, helpers
├── apps-script/       # Google Apps Script (GAS)
│   └── Code.gs
└── docs/
    └── DEPLOY.md
```

---

## ⚡ Quick Start

### Frontend
```bash
cd frontend
npm install
cp .env.example .env        # Set VITE_API_URL
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # Set credentials
uvicorn main:app --reload
```

---

## 🚀 Deploy to Railway

### Backend
1. Push to GitHub
2. New Railway project → Deploy from GitHub → select `backend/`
3. Add environment variables (see `.env.example`)
4. Railway auto-deploys on push

### Frontend
1. New Railway project → select `frontend/`
2. Set `VITE_API_URL` = your backend Railway URL
3. Build command: `npm run build`
4. Start command: `npx serve dist`

---

## 🔧 Google Sheets Setup

1. Create a new Google Sheet
2. Go to **Settings** page in the app
3. Paste your Sheet URL → click **Test Connection**
4. Click **Auto Create Headers** (creates all 7 sheets)
5. Go to **Extensions → Apps Script** in your Sheet
6. Paste content from `apps-script/Code.gs`
7. Deploy as Web App → Copy URL → paste in Settings

---

## 🔑 Default Login
```
Username: admin
Password: admin123
```
Change in Settings after first login.

---

## 📋 Features
- ✅ Login System (JWT)
- ✅ Dashboard Analytics
- ✅ Fee Collection (Monthly + Paper Fund + Stationary)
- ✅ Receipt Generator (Print / PDF / WhatsApp)
- ✅ Students Management (CRUD)
- ✅ Result Management
- ✅ WhatsApp Integration (wa.me links)
- ✅ 10th-of-Month Defaulter List (Auto)
- ✅ Reports & Excel Export
- ✅ Daily Attendance
- ✅ Stationary Shop
- ✅ Offline Support (IndexedDB)
- ✅ Auto Sync every 10 seconds
- ✅ PWA Installable
- ✅ Dark Mode

---

## 🛠️ Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State | Zustand |
| Offline DB | Dexie.js (IndexedDB) |
| PWA | vite-plugin-pwa |
| Backend | FastAPI (Python 3.11) |
| Database | Google Sheets via gspread |
| PDF | ReportLab + WeasyPrint |
| Excel | OpenPyXL |
| Scheduler | APScheduler |
| Auth | JWT (python-jose) |
| Deploy | Railway |
