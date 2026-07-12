from app.extensions import db
from app.models.base import TimestampMixin, SerializerMixin
from app.models.enums import DonationStatus


class Donation(db.Model, TimestampMixin, SerializerMixin):
    __tablename__ = "donations"

    id = db.Column(db.Integer, primary_key=True)

    # --- Ownership ---
    donor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    donor = db.relationship("User", back_populates="donations", foreign_keys=[donor_id])

    ngo_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    ngo = db.relationship("User", back_populates="accepted_donations", foreign_keys=[ngo_id])

    # --- Food details (summary; itemized breakdown lives in FoodItem) ---
    food_name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    is_veg = db.Column(db.Boolean, nullable=False, default=True)
    quantity = db.Column(db.Float, nullable=False)
    quantity_unit = db.Column(db.String(20), nullable=False, default="servings")
    description = db.Column(db.Text, nullable=True)

    # --- Timing ---
    cooking_time = db.Column(db.DateTime, nullable=True)
    expiry_datetime = db.Column(db.DateTime, nullable=False)

    # --- Pickup location ---
    pickup_address = db.Column(db.String(500), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    contact_phone = db.Column(db.String(20), nullable=False)

    # --- Status tracking ---
    status = db.Column(db.String(20), nullable=False, default=DonationStatus.PENDING, index=True)
    accepted_at = db.Column(db.DateTime, nullable=True)
    rejected_at = db.Column(db.DateTime, nullable=True)

    # --- Relationships ---
    food_items = db.relationship(
        "FoodItem", back_populates="donation", lazy="joined",
        cascade="all, delete-orphan",
    )
    images = db.relationship(
        "DonationImage", back_populates="donation", lazy="joined",
        cascade="all, delete-orphan",
    )
    assignment = db.relationship(
        "VolunteerAssignment", back_populates="donation", uselist=False,
        cascade="all, delete-orphan",
    )
    feedback_entries = db.relationship(
        "Feedback", back_populates="donation", lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def serialize_food_items(self):
        return [item.to_dict() for item in self.food_items]

    def serialize_images(self):
        return [img.to_dict() for img in self.images]

    def serialize_donor_info(self):
        return self.donor.to_public_dict() if self.donor else None

    def serialize_ngo_info(self):
        return self.ngo.to_public_dict() if self.ngo else None

    def serialize_assignment(self):
        return self.assignment.to_dict() if self.assignment else None

    def __repr__(self):
        return f"<Donation {self.id} {self.food_name} ({self.status})>"


class FoodItem(db.Model, SerializerMixin):
    """
    Itemized breakdown of a donation, e.g. a single donation of
    'Wedding leftovers' might contain multiple FoodItem rows:
    'Rice - 5 kg', 'Curry - 3 kg', 'Bread - 40 pieces'.
    """

    __tablename__ = "food_items"

    id = db.Column(db.Integer, primary_key=True)
    donation_id = db.Column(db.Integer, db.ForeignKey("donations.id"), nullable=False)
    donation = db.relationship("Donation", back_populates="food_items")

    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False, default="units")

    def __repr__(self):
        return f"<FoodItem {self.name} ({self.quantity}{self.unit})>"


class DonationImage(db.Model, SerializerMixin):
    __tablename__ = "donation_images"

    id = db.Column(db.Integer, primary_key=True)
    donation_id = db.Column(db.Integer, db.ForeignKey("donations.id"), nullable=False)
    donation = db.relationship("Donation", back_populates="images")

    # Relative path served via the /uploads static route, e.g.
    # "donations/3f9a1c2e.jpg" -> http://<host-ip>:5000/uploads/donations/3f9a1c2e.jpg
    image_path = db.Column(db.String(500), nullable=False)

    def serialize_url(self):
        return f"/uploads/{self.image_path}"

    def __repr__(self):
        return f"<DonationImage {self.image_path}>"
