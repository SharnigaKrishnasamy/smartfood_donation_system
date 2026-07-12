"""
Socket.IO handlers.

The real-time flow works by rooms:
- Every connected, authenticated client joins a private room "user_<id>"
  (used by app.utils.notify.notify_user to push personal notifications).
- Clients also join role-based rooms ("role_ngo", "role_volunteer") so
  broadcast events (e.g. "a new donation just appeared") can be pushed to
  every NGO/volunteer at once without an extra DB query per user.

Authentication on connect: the client sends its JWT access token in the
Socket.IO connection `auth` payload; we decode it the same way Flask-JWT
would to identify the user before letting them join any rooms.
"""

from flask import request
from flask_socketio import join_room, leave_room, emit
from flask_jwt_extended import decode_token

from app.extensions import socketio
from app.models import User

# Track socket_id -> user_id so we can clean up rooms on disconnect
_connected_sockets = {}


@socketio.on("connect")
def handle_connect(auth):
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token")

    if not token:
        # Allow anonymous connection (e.g. public landing page) but they
        # won't be placed in any room and won't receive personal notifications.
        return True

    try:
        decoded = decode_token(token)
        user_id = int(decoded["sub"])
        role = decoded.get("role")
    except Exception:
        return True  # invalid/expired token -> connect anonymously, no rooms

    user = User.query.get(user_id)
    if not user:
        return True

    join_room(f"user_{user_id}")
    if role:
        join_room(f"role_{role}")

    _connected_sockets[request.sid] = user_id
    emit("connected", {"message": "Connected to real-time updates", "user_id": user_id})
    return True


@socketio.on("disconnect")
def handle_disconnect():
    _connected_sockets.pop(request.sid, None)


@socketio.on("join_donation_room")
def handle_join_donation_room(data):
    """
    Clients viewing a specific donation's live tracking page join a
    per-donation room so volunteer location pings / status changes for
    THAT donation reach only interested viewers efficiently.
    """
    donation_id = data.get("donation_id") if isinstance(data, dict) else None
    if donation_id:
        join_room(f"donation_{donation_id}")


@socketio.on("leave_donation_room")
def handle_leave_donation_room(data):
    donation_id = data.get("donation_id") if isinstance(data, dict) else None
    if donation_id:
        leave_room(f"donation_{donation_id}")


@socketio.on("volunteer_location_update")
def handle_volunteer_location(data):
    """
    Volunteer's app periodically emits {donation_id, latitude, longitude}
    while en route; we relay it to anyone watching that donation's room
    (donor + NGO tracking screens) without touching the database.
    """
    if not isinstance(data, dict):
        return
    donation_id = data.get("donation_id")
    lat = data.get("latitude")
    lng = data.get("longitude")
    if donation_id is None or lat is None or lng is None:
        return

    emit(
        "volunteer_location",
        {"donation_id": donation_id, "latitude": lat, "longitude": lng},
        room=f"donation_{donation_id}",
        include_self=False,
    )
