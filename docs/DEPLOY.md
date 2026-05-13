# 🚀 KINS SCHOOL — Deployment Guide

## Step 1: Upload to GitHub

```bash
cd kins-school
git init
git add .
git commit -m "🎓 Initial commit — KINS SCHOOL Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kins-school.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your `kins-school` repo
3. Set **Root Directory** → `backend`
4. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `ADMIN_USERNAME` | admin |
| `ADMIN_PASSWORD` | your-secure-password |
| `JWT_SECRET` | random-32-char-string |
| `GOOGLE_SHEET_ID` | your-sheet-id |
| `GOOGLE_SCRIPT_URL` | your-gas-url |

5. Railway auto-deploys. Copy the Railway URL (e.g. `https://kins-api.railway.app`)

---

## Step 3: Deploy Frontend to Railway

1. New Project → Deploy from GitHub → same repo
2. Set **Root Directory** → `frontend`
3. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | https://kins-api.railway.app |

4. Build Command: `npm install && npm run build`
5. Start Command: `npx serve dist --listen $PORT`

---

## Step 4: Google Sheets Setup

1. Create new Google Sheet at https://sheets.google.com
2. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
3. Open Sheet → **Extensions → Apps Script**
4. Paste the code from `apps-script/Code.gs`
5. Save → **Deploy → New Deployment**
   - Type: Web App
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy** → Copy the Web App URL
7. In KINS SCHOOL Settings page → paste both URLs → Test Connection → Create Headers

---

## Step 5: Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
uvicorn main:app --reload
# API runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
# App runs at http://localhost:5173
```

---

## 🔑 Default Login
```
Username: admin
Password: admin123
```
Change `ADMIN_PASSWORD` in backend `.env` after first deployment.

---

## 📱 PWA Installation

### Mobile (Android/iOS)
1. Open the app in Chrome/Safari
2. Tap the share button
3. "Add to Home Screen"

### Desktop (Chrome)
1. Open the app
2. Click the install icon in the address bar
3. "Install KINS SCHOOL"

---

## 🔄 Google Sheets Sheet Structure

After running **Create Headers**, these sheets are created:

| Sheet | Purpose |
|-------|---------|
| Students | All student records |
| Fees | Monthly fee payments |
| Receipts | Generated receipts log |
| Results | Exam results |
| Attendance | Daily attendance |
| Stationary | Shop inventory |
| WhatsappLogs | Message history |

---

## 🗂️ Project File Tree

```
kins-school/
├── README.md
├── .gitignore
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── railway.toml
│   ├── .env.example
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── store/
│       │   └── appStore.js
│       ├── hooks/
│       │   ├── useSync.js
│       │   └── useToast.js
│       ├── utils/
│       │   ├── api.js
│       │   ├── db.js
│       │   └── helpers.js
│       └── components/
│           ├── common/
│           │   └── UI.jsx
│           ├── layout/
│           │   ├── Sidebar.jsx
│           │   └── TopBar.jsx
│           └── pages/
│               ├── LoginPage.jsx
│               ├── DashboardPage.jsx
│               ├── FeeCollectionPage.jsx
│               ├── StudentsPage.jsx
│               ├── ResultsPage.jsx
│               ├── WhatsAppPage.jsx
│               ├── DefaultersPage.jsx
│               ├── ReportsPage.jsx
│               ├── StationaryPage.jsx
│               ├── AttendancePage.jsx
│               └── SettingsPage.jsx
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── scheduler.py
│   ├── requirements.txt
│   ├── railway.toml
│   ├── .env.example
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── students.py
│   │   ├── fees.py
│   │   ├── receipts.py
│   │   ├── results.py
│   │   ├── attendance.py
│   │   ├── stationary.py
│   │   ├── reports.py
│   │   └── settings.py
│   └── utils/
│       ├── __init__.py
│       ├── auth.py
│       └── sheets.py
└── apps-script/
    └── Code.gs
```
