"""
Shared enum-like constants used across models and routes.

Plain string constants (not Python Enum classes) are used deliberately so
that SQLite stores them as simple TEXT columns and they serialize to JSON
without any extra encoder logic.
"""


class RoleName:
    DONOR = "donor"
    NGO = "ngo"
    VOLUNTEER = "volunteer"
    ADMIN = "admin"

    ALL = [DONOR, NGO, VOLUNTEER, ADMIN]


class DonationStatus:
    PENDING = "pending"          # created by donor, waiting for an NGO
    ACCEPTED = "accepted"        # an NGO accepted it
    REJECTED = "rejected"        # an NGO rejected it (goes back to pending pool)
    ASSIGNED = "assigned"        # a volunteer has been assigned for pickup
    PICKED_UP = "picked_up"      # volunteer collected the food from the donor
    DELIVERED = "delivered"      # volunteer delivered the food to the NGO
    EXPIRED = "expired"          # expiry datetime passed with no pickup
    CANCELLED = "cancelled"      # donor cancelled the donation

    ALL = [PENDING, ACCEPTED, REJECTED, ASSIGNED, PICKED_UP, DELIVERED, EXPIRED, CANCELLED]


class AssignmentStatus:
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

    ALL = [ASSIGNED, PICKED_UP, DELIVERED, CANCELLED]


class NotificationType:
    NEW_DONATION = "new_donation"
    DONATION_ACCEPTED = "donation_accepted"
    DONATION_REJECTED = "donation_rejected"
    VOLUNTEER_ASSIGNED = "volunteer_assigned"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    NGO_APPROVED = "ngo_approved"
    SYSTEM = "system"

    ALL = [
        NEW_DONATION, DONATION_ACCEPTED, DONATION_REJECTED,
        VOLUNTEER_ASSIGNED, PICKED_UP, DELIVERED, NGO_APPROVED, SYSTEM,
    ]


class FoodCategory:
    COOKED_MEALS = "cooked_meals"
    RAW_INGREDIENTS = "raw_ingredients"
    PACKAGED = "packaged"
    BAKERY = "bakery"
    FRUITS_VEGETABLES = "fruits_vegetables"
    DAIRY = "dairy"
    BEVERAGES = "beverages"
    OTHER = "other"

    ALL = [
        COOKED_MEALS, RAW_INGREDIENTS, PACKAGED, BAKERY,
        FRUITS_VEGETABLES, DAIRY, BEVERAGES, OTHER,
    ]
