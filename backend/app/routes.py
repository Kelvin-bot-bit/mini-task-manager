from flask import Blueprint, jsonify, request
from sqlalchemy import select
from app import db
from app.models import Task

api = Blueprint("api", __name__)


@api.get("/health")
def health():
    # Check database connectivity as part of the health endpoint.
    try:
        db.session.execute(select(1))
        return jsonify({"status": "ok", "database": "connected"}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"status": "error", "database": "unavailable"}), 503


@api.get("/tasks")
def list_tasks():
    status = request.args.get("status", "all").lower()
    if status not in {"all", "pending", "completed"}:
        return jsonify({"error": "status must be all, pending, or completed"}), 400

    query = select(Task).order_by(Task.created_at.desc(), Task.id.desc())
    if status == "pending":
        query = query.where(Task.completed.is_(False))
    elif status == "completed":
        query = query.where(Task.completed.is_(True))

    tasks = db.session.execute(query).scalars().all()
    return jsonify([task.to_dict() for task in tasks])


@api.post("/tasks")
def create_task():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    title = data.get("title")
    description = data.get("description", "")
    if not isinstance(title, str) or not title.strip():
        return jsonify({"error": "Title is required"}), 400
    if len(title.strip()) > 120:
        return jsonify({"error": "Title must be 120 characters or fewer"}), 400
    if not isinstance(description, str):
        return jsonify({"error": "Description must be text"}), 400
    if len(description) > 1000:
        return jsonify({"error": "Description must be 1000 characters or fewer"}), 400

    task = Task(title=title.strip(), description=description.strip())
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@api.patch("/tasks/<int:task_id>")
def update_task(task_id):
    task = db.session.get(Task, task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    if "title" in data:
        title = data["title"]
        if not isinstance(title, str) or not title.strip():
            return jsonify({"error": "Title cannot be empty"}), 400
        if len(title.strip()) > 120:
            return jsonify({"error": "Title must be 120 characters or fewer"}), 400
        task.title = title.strip()

    if "description" in data:
        description = data["description"]
        if not isinstance(description, str):
            return jsonify({"error": "Description must be text"}), 400
        if len(description) > 1000:
            return jsonify({"error": "Description must be 1000 characters or fewer"}), 400
        task.description = description.strip()

    if "completed" in data:
        if not isinstance(data["completed"], bool):
            return jsonify({"error": "completed must be true or false"}), 400
        task.completed = data["completed"]

    db.session.commit()
    return jsonify(task.to_dict())


@api.delete("/tasks/<int:task_id>")
def delete_task(task_id):
    task = db.session.get(Task, task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"})
