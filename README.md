# Mini Task Manager (Taskmate) — Render + PostgreSQL

A React + Flask task manager prepared for PostgreSQL deployment on Render, with the React/Vite frontend deployable to Vercel.

## Features
- Create, list, edit, complete/uncomplete, and delete tasks
- Filter by all, pending, or completed
- Search visible tasks by title or description
- Responsive dashboard UI
- REST API validation and database health endpoint
- SQLAlchemy models and Flask-Migrate migrations
- PostgreSQL driver (`psycopg`) for production; SQLite fallback for local quick-start

## Run locally
### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```
Check `http://127.0.0.1:5000/api/health`. For a local SQLite quick-start, leave `DATABASE_URL` unset. For local PostgreSQL, set it in `.env` and load it into the shell before Flask CLI commands.

Migrations are already included. Do not run `flask db init` again. To apply the existing migrations locally, load `.env` and run `flask --app run.py db upgrade`. After model changes, run `flask --app run.py db migrate -m "describe change"`, review the file, then `flask --app run.py db upgrade`.

### Frontend
In a second terminal:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open the Vite URL, usually `http://localhost:5173`.

## Deploy to Render + Vercel
### 1. Push to GitHub
Commit the project, including `backend/migrations/`. Do not commit `.env`, virtual environments, local database files, or secrets.

### 2. Create Render PostgreSQL
In Render Dashboard, choose **New → PostgreSQL**. Create the database and copy its **Internal Database URL**. Keep the database and backend in the same region.

### 3. Create the Render Flask Web Service
Connect the GitHub repository and set:
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `flask --app run.py db upgrade && gunicorn --bind 0.0.0.0:$PORT run:app`

Set environment variables in Render:
- `DATABASE_URL` = the PostgreSQL Internal Database URL
- `SECRET_KEY` = a securely generated random secret
- `FLASK_DEBUG` = `0`
- `FRONTEND_ORIGINS` = your exact Vercel frontend origin (initially you may use `http://localhost:5173` for local development)

After deployment, test `https://YOUR-BACKEND.onrender.com/api/health`. It should report the API is healthy and the database is connected.

### 4. Deploy the React frontend to Vercel
Import the same repository and set Root Directory to `frontend`, Framework Preset to Vite, Build Command to `npm run build`, and Output Directory to `dist`. Add this Vercel environment variable:
```env
VITE_API_URL=https://YOUR-BACKEND.onrender.com/api
```
Redeploy the frontend after setting it.

### 5. Finish CORS setup
Set Render `FRONTEND_ORIGINS` to the exact Vercel URL, e.g. `https://your-app.vercel.app`. Multiple origins can be comma-separated. Redeploy the backend if needed. Test create, edit, complete, delete, and refresh persistence.

## Notes
- This is a practice starter, not a multi-user app; it has no authentication or user-specific task ownership.
- Changing database engines does not copy existing MySQL data. Export/import any data you need to preserve.
- Never commit `.env` or production secrets.
- Check Render's current plan, database retention, and backup policies before storing important data.
