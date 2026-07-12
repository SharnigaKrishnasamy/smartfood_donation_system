"""
Central place for Flask extension instances.

Keeping these separate from `app/__init__.py` avoids circular imports:
models and routes can import `db`, `jwt`, `socketio` here without needing
to import the app factory itself.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
# async_mode="threading" works well for LAN/demo use without extra
# dependencies like eventlet/gevent. cors_allowed_origins="*" is required
# so phones/laptops on the same Wi-Fi (with different IPs) can connect.
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")
cors = CORS()
