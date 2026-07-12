from flask import Blueprint, request, jsonify, g

from app.extensions import db
from app.models import Donation, FoodItem, DonationImage
from app.models.enums import DonationStatus, RoleName, FoodCategory
from app.utils.auth_helpers import (
    role_required, require_fields, ValidationError, parse_datetime, parse_float,
)
from app.utils.files import save_image, delete_image
from app.utils.notify import log_action, notify_role, notify_user

donor_bp = Blueprint("donor", __name__, url_prefix="/api/donor")


def _donation_or_404(donation_id, donor_id=None):
    query = Donation.query.filter_by(id=donation_id)
    if donor_id is not None:
        query = query.filter_by(donor_id=donor_id)
    return query.first()


@donor_bp.post("/donations")
@role_required(RoleName.DONOR)
def create_donation():
    user = g.current_user
    # multipart/form-data because images are uploaded alongside fields
    data = request.form

    try:
        require_fields(data, [
            "food_name", "category", "quantity", "quantity_unit",
            "expiry_datetime", "pickup_address", "latitude", "longitude",
            "contact_phone",
        ])

        if data["category"] not in FoodCategory.ALL:
            raise ValidationError(f"category must be one of {FoodCategory.ALL}")

        expiry = parse_datetime(data["expiry_datetime"], "expiry_datetime")
        cooking_time = parse_datetime(data.get("cooking_time"), "cooking_time")

        donation = Donation(
            donor_id=user.id,
            food_name=data["food_name"].strip(),
            category=data["category"],
            is_veg=str(data.get("is_veg", "true")).lower() in ("true", "1", "yes"),
            quantity=parse_float(data["quantity"], "quantity"),
            quantity_unit=data["quantity_unit"].strip(),
            description=data.get("description", "").strip() or None,
            cooking_time=cooking_time,
            expiry_datetime=expiry,
            pickup_address=data["pickup_address"].strip(),
            latitude=parse_float(data["latitude"], "latitude"),
            longitude=parse_float(data["longitude"], "longitude"),
            contact_phone=data["contact_phone"].strip(),
            status=DonationStatus.PENDING,
        )
        db.session.add(donation)
        db.session.flush()  # get donation.id before commit

        # Optional itemized food items, sent as items[0][name], items[0][quantity], items[0][unit] ...
        idx = 0
        while f"items[{idx}][name]" in data:
            donation.food_items.append(FoodItem(
                donation_id=donation.id,
                name=data[f"items[{idx}][name]"].strip(),
                quantity=parse_float(data.get(f"items[{idx}][quantity]", 0), "item quantity"),
                unit=data.get(f"items[{idx}][unit]", "units"),
            ))
            idx += 1

        # Multiple images: request.files.getlist("images")
        for file_storage in request.files.getlist("images"):
            path = save_image(file_storage, "donations")
            if path:
                donation.images.append(DonationImage(donation_id=donation.id, image_path=path))

        db.session.commit()
        log_action(user.id, "DONATION_CREATED", "Donation", donation.id)

        notify_role(
            RoleName.NGO, "new_donation", "New Donation Available",
            f"{user.name} listed '{donation.food_name}' ({donation.quantity} {donation.quantity_unit}) near {donation.pickup_address}.",
            related_donation_id=donation.id,
        )

        return jsonify({
            "message": "Donation created",
            "donation": donation.to_dict(include=["food_items", "images"]),
        }), 201

    except ValidationError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@donor_bp.get("/donations")
@role_required(RoleName.DONOR)
def list_my_donations():
    user = g.current_user
    status = request.args.get("status")
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)

    query = Donation.query.filter_by(donor_id=user.id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Donation.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "donations": [d.to_dict(include=["food_items", "images", "ngo_info", "assignment"]) for d in pagination.items],
        "total": pagination.total,
        "page": page,
        "pages": pagination.pages,
    }), 200


@donor_bp.get("/donations/<int:donation_id>")
@role_required(RoleName.DONOR)
def get_donation(donation_id):
    donation = _donation_or_404(donation_id, g.current_user.id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
    return jsonify({
        "donation": donation.to_dict(include=["food_items", "images", "ngo_info", "assignment"]),
    }), 200


@donor_bp.put("/donations/<int:donation_id>")
@role_required(RoleName.DONOR)
def update_donation(donation_id):
    donation = _donation_or_404(donation_id, g.current_user.id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
    if donation.status != DonationStatus.PENDING:
        return jsonify({"error": "Only pending donations can be edited"}), 400

    data = request.form if request.form else (request.get_json(silent=True) or {})
    try:
        if data.get("food_name"):
            donation.food_name = data["food_name"].strip()
        if data.get("category"):
            if data["category"] not in FoodCategory.ALL:
                raise ValidationError(f"category must be one of {FoodCategory.ALL}")
            donation.category = data["category"]
        if "is_veg" in data:
            donation.is_veg = str(data["is_veg"]).lower() in ("true", "1", "yes")
        if data.get("quantity"):
            donation.quantity = parse_float(data["quantity"], "quantity")
        if data.get("quantity_unit"):
            donation.quantity_unit = data["quantity_unit"].strip()
        if data.get("description") is not None:
            donation.description = data["description"].strip() or None
        if data.get("expiry_datetime"):
            donation.expiry_datetime = parse_datetime(data["expiry_datetime"], "expiry_datetime")
        if data.get("cooking_time"):
            donation.cooking_time = parse_datetime(data["cooking_time"], "cooking_time")
        if data.get("pickup_address"):
            donation.pickup_address = data["pickup_address"].strip()
        if data.get("latitude"):
            donation.latitude = parse_float(data["latitude"], "latitude")
        if data.get("longitude"):
            donation.longitude = parse_float(data["longitude"], "longitude")
        if data.get("contact_phone"):
            donation.contact_phone = data["contact_phone"].strip()

        for file_storage in request.files.getlist("images"):
            path = save_image(file_storage, "donations")
            if path:
                donation.images.append(DonationImage(donation_id=donation.id, image_path=path))

        db.session.commit()
        log_action(g.current_user.id, "DONATION_UPDATED", "Donation", donation.id)
        return jsonify({"message": "Donation updated", "donation": donation.to_dict(include=["food_items", "images"])}), 200

    except ValidationError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@donor_bp.delete("/donations/<int:donation_id>")
@role_required(RoleName.DONOR)
def delete_donation(donation_id):
    donation = _donation_or_404(donation_id, g.current_user.id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
    if donation.status not in (DonationStatus.PENDING, DonationStatus.REJECTED, DonationStatus.EXPIRED):
        return jsonify({"error": "Cannot delete a donation that is already accepted or in progress"}), 400

    for image in donation.images:
        delete_image(image.image_path)

    db.session.delete(donation)
    db.session.commit()
    log_action(g.current_user.id, "DONATION_DELETED", "Donation", donation_id)
    return jsonify({"message": "Donation deleted"}), 200


@donor_bp.put("/donations/<int:donation_id>/cancel")
@role_required(RoleName.DONOR)
def cancel_donation(donation_id):
    donation = _donation_or_404(donation_id, g.current_user.id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
    if donation.status in (DonationStatus.PICKED_UP, DonationStatus.DELIVERED):
        return jsonify({"error": "Cannot cancel a donation that has already been picked up"}), 400

    donation.status = DonationStatus.CANCELLED
    db.session.commit()

    if donation.ngo_id:
        notify_user(donation.ngo_id, "system", "Donation Cancelled",
                    f"The donor cancelled '{donation.food_name}'.", donation.id)

    log_action(g.current_user.id, "DONATION_CANCELLED", "Donation", donation.id)
    return jsonify({"message": "Donation cancelled", "donation": donation.to_dict()}), 200
