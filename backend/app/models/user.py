from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db
from app.models.base import TimestampMixin, SerializerMixin
from app.models.enums import RoleName


class User(db.Model, TimestampMixin, SerializerMixin):
    __tablename__ = "users"

    serialize_exclude = ("password_hash",)

    id = db.Column(db.Integer, primary_key=True)

    # --- Identity ---
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=True)

    # --- Role ---
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    role = db.relationship("Role", back_populates="users")

    # --- NGO-specific ---
    organization_name = db.Column(db.String(255), nullable=True)
    registration_number = db.Column(db.String(100), nullable=True)
    is_approved = db.Column(db.Boolean, default=False, nullable=False)
    # Donors, volunteers and admin are auto-approved; NGOs require admin approval.

    # --- Location (used for "nearby donations" queries) ---
    address = db.Column(db.String(500), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    # --- Profile ---
    profile_image = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # --- Relationships ---
    donations = db.relationship(
        "Donation", back_populates="donor", lazy="dynamic",
        foreign_keys="Donation.donor_id",
    )
    accepted_donations = db.relationship(
        "Donation", back_populates="ngo", lazy="dynamic",
        foreign_keys="Donation.ngo_id",
    )
    volunteer_assignments = db.relationship(
        "VolunteerAssignment", back_populates="volunteer", lazy="dynamic",
    )
    notifications = db.relationship(
        "Notification", back_populates="user", lazy="dynamic",
        cascade="all, delete-orphan",
    )

    # --- Password helpers ---
    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)

    # --- Convenience ---
    @property
    def role_name(self):
        return self.role.name if self.role else None

    def is_role(self, *role_names):
        return self.role_name in role_names

    def serialize_role_name(self):
        return self.role_name

    def to_public_dict(self):
        """Minimal, safe-to-share subset used when one user views another
        (e.g. NGO viewing donor contact info, volunteer viewing NGO)."""
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "organization_name": self.organization_name,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "profile_image": self.profile_image,
            "role": self.role_name,
        }

    def __repr__(self):
        return f"<User {self.email} ({self.role_name})>"
