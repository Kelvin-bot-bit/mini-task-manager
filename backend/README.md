# Mini Task Manager — Flask API

## Requirements
- Python 3.10+
- PostgreSQL in production (SQLite is used locally if DATABASE_URL is unset)

## Local setup (Linux/macOS)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

For a quick local run, leave `DATABASE_URL` unset to use SQLite. Start the API with:
```bash
python run.py
```
Check `http://127.0.0.1:5000/api/health`.

For local PostgreSQL, set `DATABASE_URL` in `.env` to a PostgreSQL URL such as `postgresql+psycopg://username:password@localhost:5432/mini_task_manager`. Load `.env` for Flask CLI commands:
```bash
set -a
source .env
set +a
```

## Migrations
The project includes a migration history in `migrations/`. Do not run `flask db init` again. After changing a model, generate and review a migration, then apply it:
```bash
flask --app run.py db migrate -m "describe the schema change"
flask --app run.py db upgrade
```
Commit the `migrations/` folder to GitHub. Review migrations before applying them to production.

## API
- `GET /api/health` — API and database health
- `GET /api/tasks?status=all|pending|completed` — list tasks
- `POST /api/tasks` — create `{ "title": "...", "description": "..." }`
- `PATCH /api/tasks/<id>` — update `title`, `description`, and/or `completed`
- `DELETE /api/tasks/<id>` — delete a task

## Render production settings
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `flask --app run.py db upgrade && gunicorn --bind 0.0.0.0:$PORT run:app`
- Environment variables: `DATABASE_URL` (Render PostgreSQL Internal Database URL), `SECRET_KEY` (strong random secret), `FLASK_DEBUG=0`, and `FRONTEND_ORIGINS` (exact Vercel frontend origin).

Do not commit `.env` or production secrets. Use HTTPS and backups for important data.
