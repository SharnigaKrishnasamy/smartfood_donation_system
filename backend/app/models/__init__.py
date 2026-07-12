"""
Import every model here so that `db.create_all()` (called from run.py /
seed.py) discovers all tables, and so other modules can do
`from app.models import User, Donation, ...`.
"""

from app.models.role import Role
from app.models.user import User
from app.models.donation import Donation, FoodItem, DonationImage
from app.models.assignment import VolunteerAssignment
from app.models.notification import Notification
from app.models.misc import Report, Feedback, AuditLog

__all__ = [
    "Role",
    "User",
    "Donation",
    "FoodItem",
    "DonationImage",
    "VolunteerAssignment",
    "Notification",
    "Report",
    "Feedback",
    "AuditLog",
]
