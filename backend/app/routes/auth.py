from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt, get_jwt_identity,
)

from app.extensions import db
from app.models import User, Role
from app.models.enums import RoleName
from app.utils.auth_helpers import (
    require_fields, ValidationError, is_valid_email, any_authenticated,
)
from app.utils.files import save_image, delete_image
from app.utils.notify import log_action, notify_role

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _issue_tokens(user):
    extra_claims = {"role": user.role_name}
    access_token = create_access_token(identity=str(user.id), additional_claims=extra_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=extra_claims)
    return access_token, refresh_token


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["name", "email", "password", "role"])

        email = data["email"].strip().lower()
        if not is_valid_email(email):
            raise ValidationError("Invalid email address")

        role_name = data["role"].strip().lower()
        if role_name not in RoleName.ALL:
            raise ValidationError(f"Role must be one of {RoleName.ALL}")

        if len(data["password"]) < 6:
            raise ValidationError("Password must be at least 6 characters")

        if User.query.filter_by(email=email).first():
            raise ValidationError("An account with this email already exists")

        role = Role.query.filter_by(name=role_name).first()
        if not role:
            raise ValidationError("Server misconfiguration: role not seeded")

        # NGOs require registration number + admin approval before they can act
        if role_name == RoleName.NGO:
            require_fields(data, ["organization_name"])

        user = User(
            name=data["name"].strip(),
            email=email,
            phone=data.get("phone"),
            role=role,
            organization_name=data.get("organization_name"),
            registration_number=data.get("registration_number"),
            is_approved=(role_name != RoleName.NGO),  # only NGOs need approval
            address=data.get("address"),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()

        log_action(user.id, "REGISTER", "User", user.id, f"Registered as {role_name}")

        if role_name == RoleName.NGO:
            notify_role(
                RoleName.ADMIN, "system", "New NGO Registration",
                f"{user.organization_name} has registered and is awaiting approval.",
            )
            return jsonify({
                "message": "Registration successful. Your NGO account is pending admin approval.",
                "user": user.to_dict(include=["role_name"]),
            }), 201

        access_token, refresh_token = _issue_tokens(user)
        return jsonify({
            "message": "Registration successful",
            "user": user.to_dict(include=["role_name"]),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }), 201

    except ValidationError as e:
        return jsonify({"error": str(e)}), 400


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["email", "password"])
        email = data["email"].strip().lower()

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(data["password"]):
            raise ValidationError("Invalid email or password")

        if not user.is_active:
            raise ValidationError("This account has been deactivated. Contact an admin.")

        if user.role_name == RoleName.NGO and not user.is_approved:
            raise ValidationError("Your NGO account is still pending admin approval")

        access_token, refresh_token = _issue_tokens(user)
        log_action(user.id, "LOGIN", "User", user.id)

        return jsonify({
            "message": "Login successful",
            "user": user.to_dict(include=["role_name"]),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }), 200

    except ValidationError as e:
        return jsonify({"error": str(e)}), 401


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.is_active:
        return jsonify({"error": "Account no longer valid"}), 401

    access_token, _ = _issue_tokens(user)
    return jsonify({"access_token": access_token}), 200


@auth_bp.get("/me")
@any_authenticated
def me():
    return jsonify({"user": g.current_user.to_dict(include=["role_name"])}), 200


@auth_bp.put("/profile")
@any_authenticated
def update_profile():
    user = g.current_user
    data = request.form if request.form else (request.get_json(silent=True) or {})

    if data.get("name"):
        user.name = data["name"].strip()
    if data.get("phone"):
        user.phone = data["phone"].strip()
    if data.get("address"):
        user.address = data["address"].strip()
    if data.get("latitude"):
        user.latitude = float(data["latitude"])
    if data.get("longitude"):
        user.longitude = float(data["longitude"])
    if data.get("organization_name") and user.role_name == RoleName.NGO:
        user.organization_name = data["organization_name"].strip()

    if "profile_image" in request.files:
        try:
            new_path = save_image(request.files["profile_image"], "profiles")
            if new_path:
                delete_image(user.profile_image)
                user.profile_image = new_path
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    db.session.commit()
    log_action(user.id, "PROFILE_UPDATED", "User", user.id)
    return jsonify({"message": "Profile updated", "user": user.to_dict(include=["role_name"])}), 200


@auth_bp.put("/change-password")
@any_authenticated
def change_password():
    user = g.current_user
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["current_password", "new_password"])
        if not user.check_password(data["current_password"]):
            raise ValidationError("Current password is incorrect")
        if len(data["new_password"]) < 6:
            raise ValidationError("New password must be at least 6 characters")

        user.set_password(data["new_password"])
        db.session.commit()
        log_action(user.id, "PASSWORD_CHANGED", "User", user.id)
        return jsonify({"message": "Password changed successfully"}), 200
    except ValidationError as e:
        return jsonify({"error": str(e)}), 400


@auth_bp.post("/logout")
@any_authenticated
def logout():
    # JWTs are stateless; logout is handled client-side by discarding tokens.
    # We still log the event for the audit trail.
    log_action(g.current_user.id, "LOGOUT", "User", g.current_user.id)
    return jsonify({"message": "Logged out"}), 200
