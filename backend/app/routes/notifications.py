from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Notification
from app.utils.auth_helpers import any_authenticated

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.get("")
@any_authenticated
def list_notifications():
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    query = Notification.query.filter_by(user_id=g.current_user.id)
    if unread_only:
        query = query.filter_by(is_read=False)
    notifs = query.order_by(Notification.created_at.desc()).limit(100).all()
    unread_count = Notification.query.filter_by(user_id=g.current_user.id, is_read=False).count()
    return jsonify({
        "notifications": [n.to_dict() for n in notifs],
        "unread_count": unread_count,
    }), 200


@notifications_bp.put("/<int:notif_id>/read")
@any_authenticated
def mark_read(notif_id):
    notif = Notification.query.filter_by(id=notif_id, user_id=g.current_user.id).first()
    if not notif:
        return jsonify({"error": "Notification not found"}), 404
    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200


@notifications_bp.put("/read-all")
@any_authenticated
def mark_all_read():
    Notification.query.filter_by(user_id=g.current_user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200
