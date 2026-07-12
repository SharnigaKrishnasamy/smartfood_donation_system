import os

from flask import Flask, jsonify, send_from_directory

from app.config import Config
from app.extensions import db, jwt, socketio, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --- Init extensions ---
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    socketio.init_app(app)

    # Ensure upload directories exist on first run
    os.makedirs(app.config["DONATION_IMAGES_FOLDER"], exist_ok=True)
    os.makedirs(app.config["PROFILE_IMAGES_FOLDER"], exist_ok=True)

    # Ensure the database/ directory exists (for SQLite's default location)
    db_uri = app.config["SQLALCHEMY_DATABASE_URI"]
    if db_uri.startswith("sqlite:///"):
        db_path = db_uri.replace("sqlite:///", "", 1)
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    # --- Register models (so db.create_all() sees every table) ---
    from app import models  # noqa: F401

    # --- Register blueprints ---
    from app.routes.auth import auth_bp
    from app.routes.donor import donor_bp
    from app.routes.ngo import ngo_bp
    from app.routes.volunteer import volunteer_bp
    from app.routes.admin import admin_bp
    from app.routes.notifications import notifications_bp
    from app.routes.search import search_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(donor_bp)
    app.register_blueprint(ngo_bp)
    app.register_blueprint(volunteer_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(search_bp)

    # --- Register Socket.IO handlers ---
    from app.sockets import handlers  # noqa: F401

    # --- Static file serving for uploaded images ---
    # Accessible at http://<host-ip>:5000/uploads/donations/<file>.jpg
    @app.route("/uploads/<path:filepath>")
    def serve_upload(filepath):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filepath)

    # --- Health check (handy for the frontend to detect the backend's IP) ---
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "food-donation-backend"}), 200

    # --- Error handlers ---
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({"error": "Uploaded file is too large (max 8MB)"}), 413

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"error": "Invalid token", "reason": reason}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(reason):
        return jsonify({"error": "Authorization token required", "reason": reason}), 401
    with app.app_context():
        print("=" * 60)
        print("Database URI:", app.config["SQLALCHEMY_DATABASE_URI"])
        print("Creating database tables...")
        db.create_all()
        print("Existing tables:", db.engine.table_names() if hasattr(db.engine, "table_names") else [])
        print("=" * 60)

    return app
