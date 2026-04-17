# Recipe Buddy — Basic Documentation

This document helps you **run the app locally** and explains **how it works** and what features it currently has.

## Quick start

Recipe Buddy is a 2-service app:

- **Backend**: FastAPI on `http://localhost:8000`
- **Frontend**: Vite + React on `http://localhost:3000`

### Prerequisites

- **Python**: 3.11 recommended
- **Node.js**: recent LTS recommended
- **(Optional) Groq API key**: required for AI recipe generation features
- **(Optional) Database**: Neon Postgres connection string if you want DB-backed recipes

## First-time setup

### 1) Backend setup (FastAPI)

From the repo root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Backend environment variables

Create `backend/.env` (this file is not committed) and set what you need:

```env
# --- AI (Groq) ---
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

# Optional: configure which vision model(s) to try first for image ingredient detection.
# GROQ_VISION_MODEL=llama-3.2-90b-vision-preview
# GROQ_VISION_MODELS=meta-llama/llama-4-scout-17b-16e-instruct,llama-3.2-90b-vision-preview,llama-3.2-11b-vision-preview

# --- Database (Neon Postgres) ---
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Notes:
- If `GROQ_API_KEY` is not set, the AI endpoints return an error (they are intentionally gated).
- The backend uses SQLAlchemy and reads `DATABASE_URL` from `.env`.

### 2) Frontend setup (Vite + React)

From the repo root:

```bash
cd frontend
npm install
```

#### Frontend environment variables (optional)

The frontend API client uses:

- `VITE_API_URL` if set, otherwise it falls back to `http://<current-hostname>:8000`

You can create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Running the app

### Option A: Manual start (recommended on Linux)

Terminal 1 (backend):

```bash
cd backend
source .venv/bin/activate
python main.py
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Then open:
- Frontend: `http://localhost:3000`
- Backend API docs (Swagger): `http://localhost:8000/docs`

### Option B: Convenience scripts

- `./start.sh` is designed for **macOS Terminal** (it uses `osascript` to open new windows).
- `start.ps1` is for **Windows PowerShell**.

On Linux, use the **manual start** instructions above.

## How the application works

### High-level architecture

- **Frontend (React + TypeScript + Vite)**
  - UI routes are managed by **TanStack Router** (file-based routes under `frontend/src/routes/`).
  - Data/state is managed with **TanStack Query**.
  - The API client lives in `frontend/src/services/api.ts` (Axios).

- **Backend (FastAPI)**
  - Exposes HTTP endpoints, including AI endpoints under `/api/ai/*`.
  - Talks to:
    - **Groq** for LLM text generation and (optionally) vision ingredient detection
    - **Neon Postgres** (via SQLAlchemy) when `DATABASE_URL` is configured

### Key request flows

#### 1) Generate recipes from typed ingredients (AI)

Frontend:
- User enters ingredients in the “AI Recipe Generator” card on the home page.
- The UI calls `POST /api/ai/recipes` with `{ ingredients, max_recipes, ... }`.

Backend:
- Normalizes and de-dupes ingredients.
- Calls Groq chat completions and validates the response as strict JSON.
- Returns structured recipes (name, description, ingredients, steps, optional timing).

#### 2) Generate recipes from an image (AI + vision)

Frontend:
- User uploads a photo or takes a photo (mobile).
- The UI sends multipart form data to `POST /api/ai/recipes/from-image`.

Backend:
- Validates file type + size.
- Sends the image to a configured Groq vision-capable model to get a JSON ingredient list.
- Cleans ingredient names (normalization + de-duping, removes non-food terms).
- Optionally refines the list with Groq again.
- Generates recipes from the detected ingredients and returns both:
  - `detected_ingredients`
  - `recipes`
  - `vision_model` and `recipe_model` used

#### 3) Recipe cards / feed

- The UI renders recipe cards and a “feed” on the home page.
- A lot of the “feed/recipes” data is currently wired through TanStack Query with **initial/dummy data** to support the UI while network-backed endpoints evolve.

## Current features (what a user can do)

- **AI recipe generation from typed ingredients**
  - Enter ingredients manually and generate multiple recipe suggestions.

- **AI ingredient detection from images**
  - Upload a photo or take a photo to auto-detect ingredients, then generate recipes.

- **Mobile-friendly “Take Photo”**
  - Uses a camera capture file input on supported mobile browsers.

- **Backend API docs**
  - Swagger UI available at `http://localhost:8000/docs`.

- **Neon Postgres connectivity (backend)**
  - Backend is set up to connect to a Neon Postgres database via `DATABASE_URL`.

## Troubleshooting

### AI endpoints return 503 / “not configured”

- Set `GROQ_API_KEY` in `backend/.env` and restart the backend.

### Frontend can’t reach the backend

- Make sure the backend is running on port `8000`.
- If you run frontend on another machine/device, set `VITE_API_URL` to a reachable backend URL.

### Database connection errors

- Verify `DATABASE_URL` is correct and includes SSL options if your Neon instance requires it (commonly `?sslmode=require`).

# Recipe Buddy — Basic Documentation

This document helps you **run the app locally** and explains **how it works** and what features it currently has.

## Quick start

Recipe Buddy is a 2-service app:

- **Backend**: FastAPI on `http://localhost:8000`
- **Frontend**: Vite + React on `http://localhost:3000`

### Prerequisites

- **Python**: 3.11 recommended
- **Node.js**: recent LTS recommended
- **(Optional) Groq API key**: required for AI recipe generation features
- **(Optional) Database**: Neon Postgres connection string if you want DB-backed recipes

## First-time setup

### 1) Backend setup (FastAPI)

From the repo root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Backend environment variables

Create `backend/.env` (this file is not committed) and set what you need:

```env
# --- AI (Groq) ---
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

# Optional: configure which vision model(s) to try first for image ingredient detection.
# GROQ_VISION_MODEL=llama-3.2-90b-vision-preview
# GROQ_VISION_MODELS=meta-llama/llama-4-scout-17b-16e-instruct,llama-3.2-90b-vision-preview,llama-3.2-11b-vision-preview

# --- Database (Neon Postgres) ---
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Notes:
- If `GROQ_API_KEY` is not set, the AI endpoints return an error (they are intentionally gated).
- The backend uses SQLAlchemy and reads `DATABASE_URL` from `.env`.

### 2) Frontend setup (Vite + React)

From the repo root:

```bash
cd frontend
npm install
```

#### Frontend environment variables (optional)

The frontend API client uses:

- `VITE_API_URL` if set, otherwise it falls back to `http://<current-hostname>:8000`

You can create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Running the app

### Option A: Manual start (recommended on Linux)

Terminal 1 (backend):

```bash
cd backend
source .venv/bin/activate
python main.py
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Then open:
- Frontend: `http://localhost:3000`
- Backend API docs (Swagger): `http://localhost:8000/docs`

### Option B: Convenience scripts

- `./start.sh` is designed for **macOS Terminal** (it uses `osascript` to open new windows).
- `start.ps1` is for **Windows PowerShell**.

On Linux, use the **manual start** instructions above.

## How the application works

### High-level architecture

- **Frontend (React + TypeScript + Vite)**
  - UI routes are managed by **TanStack Router** (file-based routes under `frontend/src/routes/`).
  - Data/state is managed with **TanStack Query**.
  - The API client lives in `frontend/src/services/api.ts` (Axios).

- **Backend (FastAPI)**
  - Exposes HTTP endpoints, including AI endpoints under `/api/ai/*`.
  - Talks to:
    - **Groq** for LLM text generation and (optionally) vision ingredient detection
    - **Neon Postgres** (via SQLAlchemy) when `DATABASE_URL` is configured

### Key request flows

#### 1) Generate recipes from typed ingredients (AI)

Frontend:
- User enters ingredients in the “AI Recipe Generator” card on the home page.
- The UI calls `POST /api/ai/recipes` with `{ ingredients, max_recipes, ... }`.

Backend:
- Normalizes and de-dupes ingredients.
- Calls Groq chat completions and validates the response as strict JSON.
- Returns structured recipes (name, description, ingredients, steps, optional timing).

#### 2) Generate recipes from an image (AI + vision)

Frontend:
- User uploads a photo or takes a photo (mobile).
- The UI sends multipart form data to `POST /api/ai/recipes/from-image`.

Backend:
- Validates file type + size.
- Sends the image to a configured Groq vision-capable model to get a JSON ingredient list.
- Cleans ingredient names (normalization + de-duping, removes non-food terms).
- Optionally refines the list with Groq again.
- Generates recipes from the detected ingredients and returns both:
  - `detected_ingredients`
  - `recipes`
  - `vision_model` and `recipe_model` used

#### 3) Recipe cards / feed

- The UI renders recipe cards and a “feed” on the home page.
- A lot of the “feed/recipes” data is currently wired through TanStack Query with **initial/dummy data** to support the UI while network-backed endpoints evolve.

## Current features (what a user can do)

- **AI recipe generation from typed ingredients**
  - Enter ingredients manually and generate multiple recipe suggestions.

- **AI ingredient detection from images**
  - Upload a photo or take a photo to auto-detect ingredients, then generate recipes.

- **Mobile-friendly “Take Photo”**
  - Uses a camera capture file input on supported mobile browsers.

- **Backend API docs**
  - Swagger UI available at `http://localhost:8000/docs`.

- **Neon Postgres connectivity (backend)**
  - Backend is set up to connect to a Neon Postgres database via `DATABASE_URL`.

## Troubleshooting

### AI endpoints return 503 / “not configured”

- Set `GROQ_API_KEY` in `backend/.env` and restart the backend.

### Frontend can’t reach the backend

- Make sure the backend is running on port `8000`.
- If you run frontend on another machine/device, set `VITE_API_URL` to a reachable backend URL.

### Database connection errors

- Verify `DATABASE_URL` is correct and includes SSL options if your Neon instance requires it (commonly `?sslmode=require`).

