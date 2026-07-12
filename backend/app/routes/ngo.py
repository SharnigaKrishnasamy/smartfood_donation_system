from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Donation
from app.models.enums import DonationStatus, RoleName
from app.utils.auth_helpers import role_required, parse_float
from app.utils.geo import haversine_km
from app.utils.notify import log_action, notify_user

ngo_bp = Blueprint("ngo", __name__, url_prefix="/api/ngo")


@ngo_bp.get("/donations/nearby")
@role_required(RoleName.NGO)
def nearby_donations():

    user = g.current_user

    radius = parse_float(request.args.get("radius", 10), "radius")
    category = request.args.get("category")
    veg_only = request.args.get("veg_only")

    query = Donation.query.filter_by(status=DonationStatus.PENDING)

    if category:
        query = query.filter_by(category=category)

    if veg_only and veg_only.lower() in ("true", "1"):
        query = query.filter_by(is_veg=True)

    donations = query.order_by(Donation.created_at.desc()).all()

    results = []

    for d in donations:

        distance = None

        if (
            user.latitude is not None
            and user.longitude is not None
            and d.latitude is not None
            and d.longitude is not None
        ):
            distance = haversine_km(
                user.latitude,
                user.longitude,
                d.latitude,
                d.longitude,
            )

            if distance > radius:
                continue

        item = d.to_dict(include=["food_items", "images", "donor_info"])
        item["distance_km"] = distance
        results.append(item)

    results.sort(key=lambda x: (x["distance_km"] is None, x["distance_km"] or 0))

    return jsonify(
        {
            "donations": results,
            "total": len(results),
        }
    ), 200


@ngo_bp.put("/donations/<int:donation_id>/accept")
@role_required(RoleName.NGO)
def accept_donation(donation_id):

    

    donation = Donation.query.get(donation_id)

    if donation is None:
        return jsonify({"error": "Donation not found"}), 404

    if donation.status != DonationStatus.PENDING:
        return jsonify({"error": "Donation already processed"}), 400

    donation.status = DonationStatus.ACCEPTED
    donation.ngo_id = g.current_user.id
    donation.accepted_at = datetime.now(timezone.utc)

    db.session.commit()

    try:
        notify_user(
            donation.donor_id,
            "donation_accepted",
            "Donation Accepted",
            f"{g.current_user.organization_name or g.current_user.name} accepted your donation.",
            donation.id,
        )
    except Exception:
        pass

    try:
        log_action(
            g.current_user.id,
            "DONATION_ACCEPTED",
            "Donation",
            donation.id,
        )
    except Exception:
        pass

    return jsonify(
        {
            "message": "Donation accepted successfully",
            "donation": donation.to_dict(include=["donor_info"]),
        }
    ), 200


@ngo_bp.put("/donations/<int:donation_id>/reject")
@role_required(RoleName.NGO)
def reject_donation():

    donation_id = request.view_args["donation_id"]

    donation = Donation.query.get(donation_id)

    if donation is None:
        return jsonify({"error": "Donation not found"}), 404

    donation.rejected_at = datetime.now(timezone.utc)

    db.session.commit()

    try:
        log_action(
            g.current_user.id,
            "DONATION_REJECTED",
            "Donation",
            donation.id,
        )
    except Exception:
        pass

    return jsonify({"message": "Donation rejected"}), 200


@ngo_bp.get("/donations")
@role_required(RoleName.NGO)
def my_donations():

    donations = (
        Donation.query.filter_by(ngo_id=g.current_user.id)
        .order_by(Donation.created_at.desc())
        .all()
    )

    return jsonify(
        {
            "donations": [
                d.to_dict(
                    include=[
                        "food_items",
                        "images",
                        "donor_info",
                        "assignment",
                    ]
                )
                for d in donations
            ]
        }
    ), 200


@ngo_bp.get("/donations/<int:donation_id>")
@role_required(RoleName.NGO)
def donation_details():

    donation_id = request.view_args["donation_id"]

    donation = Donation.query.filter_by(
        id=donation_id,
        ngo_id=g.current_user.id,
    ).first()

    if donation is None:
        return jsonify({"error": "Donation not found"}), 404

    return jsonify(
        {
            "donation": donation.to_dict(
                include=[
                    "food_items",
                    "images",
                    "donor_info",
                    "assignment",
                ]
            )
        }
    ), 200