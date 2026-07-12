import csv
import io
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, jsonify, g, send_file
from sqlalchemy import func

from app.extensions import db
from app.models import User, Donation, Report, AuditLog, Role
from app.models.enums import DonationStatus, RoleName
from app.utils.auth_helpers import role_required
from app.utils.notify import log_action, notify_user

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.get("/dashboard")
@role_required(RoleName.ADMIN)
def dashboard():
    total_users = User.query.count()
    total_donors = User.query.join(User.role).filter(Role.name == RoleName.DONOR).count()
    total_ngos = User.query.join(User.role).filter(Role.name == RoleName.NGO, User.is_approved.is_(True)).count()
    total_volunteers = User.query.join(User.role).filter(Role.name == RoleName.VOLUNTEER).count()
    pending_ngo_approvals = User.query.join(User.role).filter(
        Role.name == RoleName.NGO, User.is_approved.is_(False)
    ).count()

    total_donations = Donation.query.count()
    delivered_donations = Donation.query.filter_by(status=DonationStatus.DELIVERED).count()
    pending_donations = Donation.query.filter_by(status=DonationStatus.PENDING).count()
    active_donations = Donation.query.filter(
        Donation.status.in_([DonationStatus.ACCEPTED, DonationStatus.ASSIGNED, DonationStatus.PICKED_UP])
    ).count()

    # "Food saved" approximated as total quantity of delivered donations.
    # Mixed units (kg/servings/pieces) are summed as a rough headline metric;
    # a unit breakdown is also provided for accuracy.
    food_saved_total = db.session.query(func.coalesce(func.sum(Donation.quantity), 0)).filter(
        Donation.status == DonationStatus.DELIVERED
    ).scalar()

    unit_breakdown = dict(
        db.session.query(Donation.quantity_unit, func.sum(Donation.quantity))
        .filter(Donation.status == DonationStatus.DELIVERED)
        .group_by(Donation.quantity_unit)
        .all()
    )

    # Rough "people served" estimate: 1 serving feeds 1 person; other units
    # assume 1 unit ~ 1 meal-equivalent. This is a simplification, clearly
    # labeled as an estimate in the UI.
    people_served_estimate = int(food_saved_total)

    # Last 30 days trend for charts
    since = datetime.now(timezone.utc) - timedelta(days=30)
    daily_counts = (
        db.session.query(
            func.date(Donation.created_at).label("day"),
            func.count(Donation.id).label("count"),
        )
        .filter(Donation.created_at >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )

    status_breakdown = dict(
        db.session.query(Donation.status, func.count(Donation.id)).group_by(Donation.status).all()
    )

    return jsonify({
        "users": {
            "total": total_users,
            "donors": total_donors,
            "ngos": total_ngos,
            "volunteers": total_volunteers,
            "pending_ngo_approvals": pending_ngo_approvals,
        },
        "donations": {
            "total": total_donations,
            "delivered": delivered_donations,
            "pending": pending_donations,
            "active": active_donations,
            "status_breakdown": status_breakdown,
        },
        "impact": {
            "food_saved_total": food_saved_total,
            "unit_breakdown": unit_breakdown,
            "people_served_estimate": people_served_estimate,
        },
        "trend_last_30_days": [{"date": str(day), "count": count} for day, count in daily_counts],
    }), 200


# --- User management ---

@admin_bp.get("/users")
@role_required(RoleName.ADMIN)
def list_users():
    role_filter = request.args.get("role")
    search = request.args.get("search")
    query = User.query.join(User.role)
    if role_filter:
        query = query.filter(Role.name == role_filter)
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(User.name.ilike(like), User.email.ilike(like)))
    users = query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict(include=["role_name"]) for u in users]}), 200


@admin_bp.put("/users/<int:user_id>/toggle-active")
@role_required(RoleName.ADMIN)
def toggle_user_active(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.is_active = not user.is_active
    db.session.commit()
    log_action(g.current_user.id, "USER_STATUS_TOGGLED", "User", user.id, f"is_active={user.is_active}")
    return jsonify({"message": "User status updated", "user": user.to_dict(include=["role_name"])}), 200


@admin_bp.put("/users/<int:user_id>/approve-ngo")
@role_required(RoleName.ADMIN)
def approve_ngo(user_id):
    user = User.query.get(user_id)
    if not user or user.role_name != RoleName.NGO:
        return jsonify({"error": "NGO user not found"}), 404
    user.is_approved = True
    db.session.commit()
    notify_user(user.id, "ngo_approved", "Account Approved",
                "Your NGO account has been approved. You can now log in and accept donations.")
    log_action(g.current_user.id, "NGO_APPROVED", "User", user.id)
    return jsonify({"message": "NGO approved", "user": user.to_dict(include=["role_name"])}), 200


@admin_bp.delete("/users/<int:user_id>")
@role_required(RoleName.ADMIN)
def delete_user(user_id):
    if user_id == g.current_user.id:
        return jsonify({"error": "You cannot delete your own account"}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    log_action(g.current_user.id, "USER_DELETED", "User", user_id)
    return jsonify({"message": "User deleted"}), 200


# --- Donation management ---

@admin_bp.get("/donations")
@role_required(RoleName.ADMIN)
def list_all_donations():
    status = request.args.get("status")
    query = Donation.query
    if status:
        query = query.filter_by(status=status)
    donations = query.order_by(Donation.created_at.desc()).all()
    return jsonify({
        "donations": [d.to_dict(include=["donor_info", "ngo_info", "assignment"]) for d in donations],
    }), 200


@admin_bp.delete("/donations/<int:donation_id>")
@role_required(RoleName.ADMIN)
def admin_delete_donation(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
    db.session.delete(donation)
    db.session.commit()
    log_action(g.current_user.id, "DONATION_DELETED_BY_ADMIN", "Donation", donation_id)
    return jsonify({"message": "Donation deleted"}), 200


# --- Reports / CSV export ---

@admin_bp.get("/reports/donations.csv")
@role_required(RoleName.ADMIN)
def export_donations_csv():
    donations = Donation.query.order_by(Donation.created_at.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "ID", "Food Name", "Category", "Veg", "Quantity", "Unit", "Status",
        "Donor", "NGO", "Pickup Address", "Created At", "Expiry",
    ])
    for d in donations:
        writer.writerow([
            d.id, d.food_name, d.category, "Veg" if d.is_veg else "Non-Veg",
            d.quantity, d.quantity_unit, d.status,
            d.donor.name if d.donor else "",
            d.ngo.organization_name if d.ngo else "",
            d.pickup_address,
            d.created_at.isoformat(),
            d.expiry_datetime.isoformat() if d.expiry_datetime else "",
        ])

    filename = f"donations_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    report = Report(
        generated_by_id=g.current_user.id,
        report_type="donations_csv",
        file_path=filename,
    )
    db.session.add(report)
    db.session.commit()
    log_action(g.current_user.id, "REPORT_GENERATED", "Report", report.id, filename)

    buffer.seek(0)
    mem = io.BytesIO(buffer.getvalue().encode("utf-8"))
    return send_file(
        mem, mimetype="text/csv", as_attachment=True, download_name=filename,
    )


@admin_bp.get("/reports/history")
@role_required(RoleName.ADMIN)
def report_history():
    reports = Report.query.order_by(Report.created_at.desc()).limit(50).all()
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200


@admin_bp.get("/audit-logs")
@role_required(RoleName.ADMIN)
def audit_logs():
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(200).all()
    return jsonify({"logs": [log.to_dict() for log in logs]}), 200
