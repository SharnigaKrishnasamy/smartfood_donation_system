"""
Application configuration.

Values are read from environment variables (see backend/.env.example) with
sensible defaults so the project runs out-of-the-box on a fresh laptop for
demo/capstone purposes. For real production use, override SECRET_KEY and
JWT_SECRET_KEY via a proper .env file that is NOT committed to source control.
"""

import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


class Config:
    # --- Core ---
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me-in-production-32chars")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me-in-production-32chars")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # --- Database ---
    # SQLite by default. Switch to MySQL by setting DATABASE_URL, e.g.:
    # mysql+pymysql://user:password@localhost/food_donation
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'database', 'food_donation.db')}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Uploads ---
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    DONATION_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, "donations")
    PROFILE_IMAGES_FOLDER = os.path.join(UPLOAD_FOLDER, "profiles")
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8 MB max upload size
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

    # --- CORS ---
    # "*" is intentional here: this app is designed to run on a closed LAN
    # (home Wi-Fi / mobile hotspot) where every device on the network is
    # trusted, and the host IP is not known ahead of time.
    CORS_ORIGINS = "*"

    # --- Pagination ---
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

    # --- Geo ---
    # Default search radius (km) NGOs/volunteers use when browsing
    # "nearby" donations if they don't specify one.
    DEFAULT_SEARCH_RADIUS_KM = 10
