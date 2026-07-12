"""
Database initialization + sample data seeding.

Run with: python seed.py

Creates all tables (if not already present) and inserts:
- The 4 roles
- One sample account per role (admin, NGO, donor, volunteer)
- A couple of sample donations so the UI isn't empty on first run

Safe to re-run: it checks for existing records before inserting.
"""

from datetime import datetime, timedelta, timezone

from app import create_app
from app.extensions import db
from app.models import Role, User, Donation, FoodItem
from app.models.enums import RoleName, DonationStatus, FoodCategory

app = create_app()


SAMPLE_ACCOUNTS = [
    dict(role=RoleName.ADMIN, name="Platform Admin", email="admin@fooddonation.local",
         password="admin123", phone="9000000001"),
    dict(role=RoleName.NGO, name="Care NGO Coordinator", email="ngo@fooddonation.local",
         password="ngo12345", phone="9000000002", organization_name="Care Foundation NGO",
         registration_number="NGO-REG-0001", address="12 MG Road, Chennai",
         latitude=13.0827, longitude=80.2707, is_approved=True),
    dict(role=RoleName.DONOR, name="Sample Donor", email="donor@fooddonation.local",
         password="donor123", phone="9000000003", address="45 Anna Salai, Chennai",
         latitude=13.0604, longitude=80.2496),
    dict(role=RoleName.VOLUNTEER, name="Sample Volunteer", email="volunteer@fooddonation.local",
         password="volunteer123", phone="9000000004", address="8 T Nagar, Chennai",
         latitude=13.0418, longitude=80.2341),
]


def seed():
    with app.app_context():
        db.create_all()

        # --- Roles ---
        role_map = {}
        for name in RoleName.ALL:
            role = Role.query.filter_by(name=name).first()
            if not role:
                role = Role(name=name, description=f"{name.capitalize()} role")
                db.session.add(role)
                db.session.flush()
            role_map[name] = role
        db.session.commit()
        print(f"Roles ready: {list(role_map.keys())}")

        # --- Sample users ---
        created_users = {}
        for acc in SAMPLE_ACCOUNTS:
            existing = User.query.filter_by(email=acc["email"]).first()
            if existing:
                created_users[acc["role"]] = existing
                print(f"User already exists: {acc['email']}")
                continue

            user = User(
                name=acc["name"],
                email=acc["email"],
                phone=acc.get("phone"),
                role=role_map[acc["role"]],
                organization_name=acc.get("organization_name"),
                registration_number=acc.get("registration_number"),
                is_approved=acc.get("is_approved", True),
                address=acc.get("address"),
                latitude=acc.get("latitude"),
                longitude=acc.get("longitude"),
            )
            user.set_password(acc["password"])
            db.session.add(user)
            db.session.flush()
            created_users[acc["role"]] = user
            print(f"Created user: {acc['email']} / password: {acc['password']} ({acc['role']})")

        db.session.commit()

    
        for acc in SAMPLE_ACCOUNTS:
            print(f"  [{acc['role'].upper():10}] {acc['email']} / {acc['password']}")


if __name__ == "__main__":
    seed()
