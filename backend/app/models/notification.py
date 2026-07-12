from app.extensions import db
from app.models.base import TimestampMixin, SerializerMixin


class Notification(db.Model, TimestampMixin, SerializerMixin):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    user = db.relationship("User", back_populates="notifications")

    type = db.Column(db.String(30), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.String(1000), nullable=False)

    related_donation_id = db.Column(db.Integer, db.ForeignKey("donations.id"), nullable=True)

    is_read = db.Column(db.Boolean, default=False, nullable=False)

    def __repr__(self):
        return f"<Notification user={self.user_id} type={self.type} read={self.is_read}>"
