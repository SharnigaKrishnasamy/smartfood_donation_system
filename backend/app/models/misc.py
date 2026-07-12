from app.extensions import db
from app.models.base import TimestampMixin, SerializerMixin


class Report(db.Model, TimestampMixin, SerializerMixin):
    """
    Metadata for generated CSV/analytics reports. The actual file is written
    to disk (backend/reports/) and this row just tracks who generated what
    and when, so admins can see report history.
    """

    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)

    generated_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    generated_by = db.relationship("User")

    report_type = db.Column(db.String(50), nullable=False)  # e.g. "donations_csv", "monthly_analytics"
    file_path = db.Column(db.String(500), nullable=True)

    date_range_start = db.Column(db.DateTime, nullable=True)
    date_range_end = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Report {self.report_type} by user={self.generated_by_id}>"


class Feedback(db.Model, TimestampMixin, SerializerMixin):
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)

    donation_id = db.Column(db.Integer, db.ForeignKey("donations.id"), nullable=False)
    donation = db.relationship("Donation", back_populates="feedback_entries")

    given_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    given_by = db.relationship("User", foreign_keys=[given_by_id])

    # Who the feedback is about (e.g. donor rating the volunteer or NGO). Nullable
    # because some feedback is general platform feedback, not about a specific user.
    given_to_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    given_to = db.relationship("User", foreign_keys=[given_to_id])

    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comments = db.Column(db.String(1000), nullable=True)

    def __repr__(self):
        return f"<Feedback donation={self.donation_id} rating={self.rating}>"


class AuditLog(db.Model, SerializerMixin):
    """
    Append-only log of security-relevant actions (login, role changes, NGO
    approval, donation deletion, etc.) for admin oversight.
    """

    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    user = db.relationship("User")

    action = db.Column(db.String(100), nullable=False)      # e.g. "LOGIN", "NGO_APPROVED", "DONATION_DELETED"
    entity_type = db.Column(db.String(50), nullable=True)    # e.g. "Donation", "User"
    entity_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.String(1000), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)

    created_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, **kwargs):
        from app.models.base import utcnow
        kwargs.setdefault("created_at", utcnow())
        super().__init__(**kwargs)

    def __repr__(self):
        return f"<AuditLog {self.action} by user={self.user_id}>"
