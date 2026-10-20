import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.engine import URL

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)

    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Render may provide postgres:// or postgresql:// URLs.
        # Explicitly use the psycopg 3 driver.
        if database_url.startswith("postgres://"):
            database_url = database_url.replace(
                "postgres://", "postgresql+psycopg://", 1
            )
        elif database_url.startswith("postgresql://"):
            database_url = database_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )

    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-only-change-this-secret"),
        SQLALCHEMY_DATABASE_URI=database_url or
            "sqlite:///mini_task_manager_dev.db",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
        JSON_SORT_KEYS=False,
    )

    db.init_app(app)
    migrate.init_app(app, db)

    allowed_origins = [
        origin.strip() for origin in
        os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    from app.routes import api
    app.register_blueprint(api, url_prefix="/api")

    @app.get("/")
    def index():
        return jsonify({
            "name": "Mini Task Manager API",
            "status": "ok",
            "health": "/api/health",
        })

    return app
