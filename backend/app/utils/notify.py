"""Shared helpers for writing audit logs and creating+emitting notifications."""

from flask import request

from app.extensions import db, socketio
from app.models import AuditLog, Notification


def log_action(user_id, action, entity_type=None, entity_id=None, details=None):
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=request.remote_addr if request else None,
    )
    db.session.add(entry)
    db.session.commit()


def notify_user(user_id, notif_type, title, message, related_donation_id=None):
    """
    Create a Notification row AND push it instantly over Socket.IO to that
    user's private room ("user_<id>"), which they join on connect.
    """
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        related_donation_id=related_donation_id,
    )
    db.session.add(notif)
    db.session.commit()

    socketio.emit(
        "notification",
        notif.to_dict(),
        room=f"user_{user_id}",
    )
    return notif


def notify_role(role_name, notif_type, title, message, related_donation_id=None, exclude_user_id=None):
    """Notify every active (and, for NGOs, approved) user of a given role."""
    from app.models import User

    query = User.query.join(User.role).filter(
        User.is_active.is_(True),
    )
    query = query.filter(User.role.has(name=role_name))
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    if role_name == "ngo":
        query = query.filter(User.is_approved.is_(True))

    for user in query.all():
        notify_user(user.id, notif_type, title, message, related_donation_id)
