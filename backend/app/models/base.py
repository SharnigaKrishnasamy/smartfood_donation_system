"""
Common mixin for all models: adds created_at/updated_at timestamps and a
generic to_dict() serializer so routes don't need to hand-roll JSON shaping
for every single model.
"""

from datetime import datetime, timezone
from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class SerializerMixin:
    """
    Generic serializer. Subclasses can override `serialize_exclude` to hide
    sensitive columns (e.g. password_hash) and `serialize_include_extra`
    to add computed/relationship fields.
    """

    serialize_exclude = ()

    def to_dict(self, include=None):
        data = {}
        for column in self.__table__.columns:
            if column.name in self.serialize_exclude:
                continue
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            data[column.name] = value

        if include:
            for key in include:
                getter = getattr(self, f"serialize_{key}", None)
                if callable(getter):
                    data[key] = getter()
        return data
