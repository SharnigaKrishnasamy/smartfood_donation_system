"""
Role-based access decorators and small manual validators.

Manual validators (not a schema library) are used deliberately to keep the
dependency list short for a LAN/capstone deployment while still giving
clear, specific error messages.
"""

from functools import wraps
from datetime import datetime

from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt

from app.models import User


def role_required(*allowed_roles):
    """
    Usage: @role_required("donor", "admin")
    Must be stacked UNDER @jwt_required-equivalent logic; this decorator
    calls verify_jwt_in_request() itself so routes don't need to double-apply.
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if role not in allowed_roles:
                return jsonify({"error": "Forbidden: insufficient role permissions"}), 403

            user = User.query.get(int(claims["sub"]))
            if not user or not user.is_active:
                return jsonify({"error": "Account is inactive or no longer exists"}), 403
            if user.role_name == "ngo" and not user.is_approved:
                return jsonify({"error": "NGO account pending admin approval"}), 403

            g.current_user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def any_authenticated(fn):
    """Any logged-in, active user (role not restricted)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        user = User.query.get(int(claims["sub"]))
        if not user or not user.is_active:
            return jsonify({"error": "Account is inactive or no longer exists"}), 403
        g.current_user = user
        return fn(*args, **kwargs)
    return wrapper


# --- Validation helpers ---

class ValidationError(Exception):
    pass


def require_fields(data, fields):
    missing = [f for f in fields if data.get(f) in (None, "")]
    if missing:
        raise ValidationError(f"Missing required field(s): {', '.join(missing)}")


def parse_datetime(value, field_name="datetime"):
    if not value:
        return None
    try:
        # Accepts ISO 8601, e.g. "2026-07-05T18:30:00"
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        raise ValidationError(f"Invalid {field_name} format; expected ISO 8601")


def parse_float(value, field_name):
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{field_name} must be a number")


def is_valid_email(email):
    return isinstance(email, str) and "@" in email and "." in email.split("@")[-1]
