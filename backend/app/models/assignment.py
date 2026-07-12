from app.extensions import db
from app.models.base import TimestampMixin, SerializerMixin
from app.models.enums import AssignmentStatus


class VolunteerAssignment(db.Model, TimestampMixin, SerializerMixin):
    __tablename__ = "volunteer_assignments"

    id = db.Column(db.Integer, primary_key=True)

    donation_id = db.Column(
        db.Integer, db.ForeignKey("donations.id"), nullable=False, unique=True,
    )
    donation = db.relationship("Donation", back_populates="assignment")

    volunteer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    volunteer = db.relationship("User", back_populates="volunteer_assignments")

    status = db.Column(db.String(20), nullable=False, default=AssignmentStatus.ASSIGNED)

    assigned_at = db.Column(db.DateTime, nullable=True)
    picked_up_at = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)

    # Optional notes the volunteer can leave at each step (e.g. "Left with security guard")
    pickup_notes = db.Column(db.String(500), nullable=True)
    delivery_notes = db.Column(db.String(500), nullable=True)

    def serialize_volunteer_info(self):
        return self.volunteer.to_public_dict() if self.volunteer else None

    def __repr__(self):
        return f"<VolunteerAssignment donation={self.donation_id} volunteer={self.volunteer_id} ({self.status})>"
