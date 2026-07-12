from flask import Blueprint, request, jsonify, g

from app.models import User, Donation, Role
from app.models.enums import RoleName
from app.utils.auth_helpers import any_authenticated
from app.utils.geo import haversine_km

search_bp = Blueprint("search", __name__, url_prefix="/api/search")


@search_bp.get("/donations")
@any_authenticated
def search_donations():
    """
    Shared search endpoint usable by donors (their own history), NGOs, and
    admins. Supports free-text search plus filters for status, food type,
    quantity range, and distance from the requesting user (if they have a
    saved location).
    """
    q = request.args.get("q", "").strip()
    status = request.args.get("status")
    category = request.args.get("category")
    min_quantity = request.args.get("min_quantity", type=float)
    max_distance_km = request.args.get("max_distance_km", type=float)

    query = Donation.query
    if q:
        like = f"%{q}%"
        query = query.filter(Donation.food_name.ilike(like))
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)
    if min_quantity is not None:
        query = query.filter(Donation.quantity >= min_quantity)

    donations = query.order_by(Donation.created_at.desc()).all()

    results = []
    user = g.current_user
    for d in donations:
        distance = None
        if user.latitude is not None and user.longitude is not None:
            distance = haversine_km(user.latitude, user.longitude, d.latitude, d.longitude)
        if max_distance_km is not None and (distance is None or distance > max_distance_km):
            continue
        item = d.to_dict(include=["food_items", "images", "donor_info", "ngo_info"])
        item["distance_km"] = distance
        results.append(item)

    return jsonify({"donations": results, "total": len(results)}), 200


@search_bp.get("/ngos")
@any_authenticated
def search_ngos():
    q = request.args.get("q", "").strip()
    query = User.query.join(User.role).filter(Role.name == RoleName.NGO, User.is_approved.is_(True))
    if q:
        like = f"%{q}%"
        query = query.filter(User.organization_name.ilike(like))
    ngos = query.all()
    return jsonify({"ngos": [n.to_public_dict() for n in ngos]}), 200


@search_bp.get("/volunteers")
@any_authenticated
def search_volunteers():
    q = request.args.get("q", "").strip()
    query = User.query.join(User.role).filter(Role.name == RoleName.VOLUNTEER, User.is_active.is_(True))
    if q:
        like = f"%{q}%"
        query = query.filter(User.name.ilike(like))
    volunteers = query.all()
    return jsonify({"volunteers": [v.to_public_dict() for v in volunteers]}), 200
