from app.extensions import db
from app.models.base import SerializerMixin


class Role(db.Model, SerializerMixin):
    """
    Normalized roles table. Kept separate from a hardcoded enum on User so
    an admin could in principle add/describe roles without a code change,
    and so User.role_id has a real foreign key with referential integrity.
    """

    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True, nullable=False)  # donor/ngo/volunteer/admin
    description = db.Column(db.String(255), nullable=True)

    users = db.relationship("User", back_populates="role", lazy="dynamic")

    def __repr__(self):
        return f"<Role {self.name}>"
