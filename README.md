# Recipe Buddy 🍳

AI-powered recipe suggestion app - **Clean Slate Template**

## 🚀 Quick Start

Choose the script for your operating system:

### macOS / Linux

```bash
./start.sh
```

### Windows (PowerShell)

```powershell
.\start.ps1
```

Both servers will start automatically!

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000

---

## 📦 First Time Setup

### Backend Setup
Python 3.11 is recommended: https://www.python.org/downloads/release/python-3118/
```bash
cd backend
python3 -m venv .venv              # macOS/Linux
# OR
python -m venv .venv               # Windows

# Activate virtual environment:
source .venv/bin/activate          # macOS/Linux
# OR
.venv\Scripts\activate             # Windows

pip install -r requirements.txt
```

### Configure AI Provider (Groq)

Add this in `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

You can change `GROQ_MODEL` to any Groq-supported model.

### Frontend Setup
Node.js required: https://nodejs.org/en/download
```bash
cd frontend
npm install
```

---

## 📁 Project Structure

```
Recipe-Buddy/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── create_tables.py
│   │   ├── models.py
│   │   └── database.py          # Database config template
│   ├── main.py                  # FastAPI app (minimal)
│   ├── requirements.txt
│   └── .env                     # Neon connection string
│
└── frontend/
    ├── src/
    │   ├── App.tsx              # Main app
    │   ├── App.css
    │   └── main.tsx
    └── package.json
```

---

## 🛠️ Start Building

### Backend (Python/FastAPI)

1. Create API endpoints in `backend/main.py`
2. Add database models when ready
3. Use the Neon connection in `.env`

### Frontend (React/TypeScript)

1. Add components in `frontend/src/`
2. Style with CSS or add a UI library
3. Connect to backend via `fetch()` or axios

---

## 🗄️ Database (Neon Postgres)

Your Neon database is configured:

- Connection string in `backend/.env`
- Database setup template in `backend/app/database.py`
- ~~Uncomment code when you're ready to use it~~

**Neon Dashboard**: https://console.neon.tech

---

## 📚 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Python + FastAPI
- **Database**: Neon (Serverless Postgres)

---

## 🔧 Manual Start (Optional)

### Backend

```bash
cd backend
.venv/bin/python main.py           # macOS/Linux
# OR
.venv\Scripts\python.exe main.py   # Windows
```

→ http://localhost:8000 | [API Docs](http://localhost:8000/docs)

### Frontend

```bash
cd frontend
npm run dev
```

→ http://localhost:3000

---

## 📖 Resources

- **FastAPI**: https://fastapi.tiangolo.com
- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Neon**: https://neon.tech/docs

---

Built using Neon, FastAPI, and React
