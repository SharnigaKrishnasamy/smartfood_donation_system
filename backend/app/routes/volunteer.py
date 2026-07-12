from datetime import datetime, timezone

from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Donation, VolunteerAssignment
from app.models.enums import DonationStatus, AssignmentStatus, RoleName
from app.utils.auth_helpers import role_required, parse_float
from app.utils.geo import haversine_km
from app.utils.notify import log_action, notify_user

volunteer_bp = Blueprint("volunteer", __name__, url_prefix="/api/volunteer")


@volunteer_bp.get("/pickups/available")
@role_required(RoleName.VOLUNTEER)
def available_pickups():
    user = g.current_user
    radius = parse_float(request.args.get("radius", 15), "radius")

    donations = Donation.query.filter_by(status=DonationStatus.ACCEPTED).order_by(
        Donation.accepted_at.asc()
    ).all()

    results = []
    for d in donations:
        distance = None
        if user.latitude is not None and user.longitude is not None:
            distance = haversine_km(user.latitude, user.longitude, d.latitude, d.longitude)
            if distance is not None and distance > radius:
                continue
        item = d.to_dict(include=["food_items", "images", "donor_info", "ngo_info"])
        item["distance_km"] = distance
        results.append(item)

    results.sort(key=lambda x: (x["distance_km"] is None, x["distance_km"] or 0))
    return jsonify({"pickups": results, "total": len(results)}), 200


@volunteer_bp.post("/pickups/<int:donation_id>/accept")
@role_required(RoleName.VOLUNTEER)
def accept_pickup(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
    if donation.status != DonationStatus.ACCEPTED:
        return jsonify({"error": "This pickup is not available"}), 400
    if donation.assignment is not None:
        return jsonify({"error": "This pickup has already been claimed by another volunteer"}), 409

    assignment = VolunteerAssignment(
        donation_id=donation.id,
        volunteer_id=g.current_user.id,
        status=AssignmentStatus.ASSIGNED,
        assigned_at=datetime.now(timezone.utc),
    )
    donation.status = DonationStatus.ASSIGNED
    db.session.add(assignment)
    db.session.commit()

    notify_user(donation.donor_id, "volunteer_assigned", "Volunteer On The Way",
                f"{g.current_user.name} will pick up '{donation.food_name}'.", donation.id)
    if donation.ngo_id:
        notify_user(donation.ngo_id, "volunteer_assigned", "Volunteer Assigned",
                    f"{g.current_user.name} accepted the pickup for '{donation.food_name}'.", donation.id)

    log_action(g.current_user.id, "PICKUP_ACCEPTED", "Donation", donation.id)
    return jsonify({
        "message": "Pickup accepted",
        "donation": donation.to_dict(include=["donor_info", "ngo_info", "assignment"]),
    }), 200


@volunteer_bp.put("/pickups/<int:donation_id>/confirm-pickup")
@role_required(RoleName.VOLUNTEER)
def confirm_pickup(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation or not donation.assignment or donation.assignment.volunteer_id != g.current_user.id:
        return jsonify({"error": "Assignment not found for this volunteer"}), 404
    if donation.status != DonationStatus.ASSIGNED:
        return jsonify({"error": "Donation is not in an assigned state"}), 400

    data = request.get_json(silent=True) or {}
    donation.assignment.status = AssignmentStatus.PICKED_UP
    donation.assignment.picked_up_at = datetime.now(timezone.utc)
    donation.assignment.pickup_notes = data.get("notes")
    donation.status = DonationStatus.PICKED_UP
    db.session.commit()

    notify_user(donation.donor_id, "picked_up", "Food Picked Up",
                f"Your donation '{donation.food_name}' has been picked up.", donation.id)
    if donation.ngo_id:
        notify_user(donation.ngo_id, "picked_up", "Food Picked Up",
                    f"'{donation.food_name}' is on its way to you.", donation.id)

    log_action(g.current_user.id, "PICKUP_CONFIRMED", "Donation", donation.id)
    return jsonify({"message": "Pickup confirmed", "donation": donation.to_dict(include=["assignment"])}), 200


@volunteer_bp.put("/pickups/<int:donation_id>/confirm-delivery")
@role_required(RoleName.VOLUNTEER)
def confirm_delivery(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation or not donation.assignment or donation.assignment.volunteer_id != g.current_user.id:
        return jsonify({"error": "Assignment not found for this volunteer"}), 404
    if donation.status != DonationStatus.PICKED_UP:
        return jsonify({"error": "Donation has not been picked up yet"}), 400

    data = request.get_json(silent=True) or {}
    donation.assignment.status = AssignmentStatus.DELIVERED
    donation.assignment.delivered_at = datetime.now(timezone.utc)
    donation.assignment.delivery_notes = data.get("notes")
    donation.status = DonationStatus.DELIVERED
    db.session.commit()

    notify_user(donation.donor_id, "delivered", "Delivery Complete",
                f"Your donation '{donation.food_name}' was delivered successfully. Thank you!", donation.id)
    if donation.ngo_id:
        notify_user(donation.ngo_id, "delivered", "Delivery Received",
                    f"'{donation.food_name}' has been delivered to you.", donation.id)

    log_action(g.current_user.id, "DELIVERY_CONFIRMED", "Donation", donation.id)
    return jsonify({"message": "Delivery confirmed", "donation": donation.to_dict(include=["assignment"])}), 200


@volunteer_bp.get("/history")
@role_required(RoleName.VOLUNTEER)
def history():
    assignments = VolunteerAssignment.query.filter_by(volunteer_id=g.current_user.id).order_by(
        VolunteerAssignment.created_at.desc()
    ).all()
    results = []
    for a in assignments:
        item = a.to_dict()
        item["donation"] = a.donation.to_dict(include=["donor_info", "ngo_info"]) if a.donation else None
        results.append(item)
    return jsonify({"history": results}), 200
