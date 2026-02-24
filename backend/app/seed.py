"""Seed script to populate the database with initial data for development."""
import asyncio
import json
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.infrastructure.database.session import async_session_factory, engine
from app.infrastructure.database.base import Base
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.client_orm import ClientORM
from app.infrastructure.database.models.workflow_orm import WorkflowDefinitionORM

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Workflow definition with all 10 steps
WORKFLOW_STEPS = [
    {
        "step_id": "licensing",
        "order": 1,
        "name": "Licensing/Appointment",
        "allowed_roles": ["BROKER", "GA", "TPA"],
        "required": True,
    },
    {
        "step_id": "company_info",
        "order": 2,
        "name": "Company Information",
        "allowed_roles": ["BROKER", "GA", "TPA", "EMPLOYER"],
        "required": True,
    },
    {
        "step_id": "risk_assessment",
        "order": 3,
        "name": "Risk Assessment",
        "allowed_roles": ["BROKER", "GA", "TPA", "EMPLOYER"],
        "required": True,
    },
    {
        "step_id": "commission_ack",
        "order": 4,
        "name": "Commission Agreement",
        "allowed_roles": ["BROKER", "GA", "TPA"],
        "required": True,
    },
    {
        "step_id": "renewal_period",
        "order": 5,
        "name": "Renewal Period",
        "allowed_roles": ["BROKER", "GA", "TPA", "EMPLOYER"],
        "required": True,
    },
    {
        "step_id": "group_structure",
        "order": 6,
        "name": "Group Structure",
        "allowed_roles": ["BROKER", "GA", "TPA", "EMPLOYER"],
        "required": True,
    },
    {
        "step_id": "billing_setup",
        "order": 7,
        "name": "Billing Setup",
        "allowed_roles": ["BROKER", "GA", "TPA", "EMPLOYER"],
        "required": True,
    },
    {
        "step_id": "authorization",
        "order": 8,
        "name": "Authorization",
        "allowed_roles": ["EMPLOYER"],
        "required": True,
    },
    {
        "step_id": "finalize",
        "order": 9,
        "name": "Finalize",
        "allowed_roles": ["BROKER", "GA", "TPA", "EMPLOYER"],
        "required": True,
    },
    {
        "step_id": "master_app",
        "order": 10,
        "name": "Master Application",
        "allowed_roles": ["EMPLOYER"],
        "required": True,
    },
]

SAMPLE_USERS = [
    {"email": "broker@example.com", "first_name": "John", "last_name": "Broker", "role": "BROKER", "password": "password123"},
    {"email": "employer@example.com", "first_name": "Jane", "last_name": "Smith", "role": "EMPLOYER", "password": "password123"},
    {"email": "admin@example.com", "first_name": "Admin", "last_name": "User", "role": "BROKER_TPA_GA_ADMIN", "password": "password123"},
    {"email": "ga@example.com", "first_name": "George", "last_name": "Agent", "role": "GA", "password": "password123"},
    {"email": "tpa@example.com", "first_name": "Tina", "last_name": "Parker", "role": "TPA", "password": "password123"},
]

SAMPLE_CLIENTS = [
    {
        "client_name": "Acme Corporation",
        "primary_address_street": "123 Main St",
        "primary_address_city": "Springfield",
        "primary_address_state": "IL",
        "primary_address_zip": "62701",
        "unique_id": "PR35150035",
        "eligible_employees": 150,
        "status": "APPLICATION_NOT_STARTED",
    },
    {
        "client_name": "TechStart Inc.",
        "primary_address_street": "456 Innovation Blvd",
        "primary_address_city": "San Jose",
        "primary_address_state": "CA",
        "primary_address_zip": "95112",
        "unique_id": "PR35150036",
        "eligible_employees": 75,
        "status": "APPLICATION_NOT_STARTED",
    },
    {
        "client_name": "Green Valley Healthcare",
        "primary_address_street": "789 Health Way",
        "primary_address_city": "Denver",
        "primary_address_state": "CO",
        "primary_address_zip": "80202",
        "unique_id": "PR35150037",
        "eligible_employees": 320,
        "status": "APPLICATION_IN_PROGRESS",
    },
    {
        "client_name": "Midwest Manufacturing Co.",
        "primary_address_street": "101 Factory Rd",
        "primary_address_city": "Detroit",
        "primary_address_state": "MI",
        "primary_address_zip": "48201",
        "unique_id": "PR35150038",
        "eligible_employees": 500,
        "status": "APPLICATION_NOT_STARTED",
    },
    {
        "client_name": "Sunrise Education Group",
        "primary_address_street": "202 School Ln",
        "primary_address_city": "Austin",
        "primary_address_state": "TX",
        "primary_address_zip": "73301",
        "unique_id": "PR35150039",
        "eligible_employees": 200,
        "status": "APPLICATION_NOT_STARTED",
    },
    {
        "client_name": "Pacific Retail Solutions",
        "primary_address_street": "303 Commerce Dr",
        "primary_address_city": "Portland",
        "primary_address_state": "OR",
        "primary_address_zip": "97201",
        "unique_id": "PR35150040",
        "eligible_employees": 90,
        "status": "ACTIVE",
    },
    {
        "client_name": "Eastern Financial Services",
        "primary_address_street": "404 Wall St",
        "primary_address_city": "New York",
        "primary_address_state": "NY",
        "primary_address_zip": "10005",
        "unique_id": "PR35150041",
        "eligible_employees": 250,
        "status": "APPLICATION_NOT_STARTED",
    },
    {
        "client_name": "Summit Construction LLC",
        "primary_address_street": "505 Builder Ave",
        "primary_address_city": "Phoenix",
        "primary_address_state": "AZ",
        "primary_address_zip": "85001",
        "unique_id": "PR35150042",
        "eligible_employees": 180,
        "status": "APPLICATION_NOT_STARTED",
    },
]


async def seed():
    async with async_session_factory() as session:
        # Seed workflow definition
        wf_def = WorkflowDefinitionORM(
            name="group_setup",
            version=1,
            steps=WORKFLOW_STEPS,
            is_active=True,
        )
        session.add(wf_def)

        # Seed users
        for user_data in SAMPLE_USERS:
            user = UserORM(
                email=user_data["email"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                hashed_password=pwd_context.hash(user_data["password"]),
                role=user_data["role"],
            )
            session.add(user)

        # Seed clients
        for client_data in SAMPLE_CLIENTS:
            client = ClientORM(**client_data)
            session.add(client)

        await session.commit()
        print("Seed data inserted successfully!")
        print(f"  - {len(SAMPLE_USERS)} users created")
        print(f"  - {len(SAMPLE_CLIENTS)} clients created")
        print(f"  - 1 workflow definition with {len(WORKFLOW_STEPS)} steps created")
        print("\nTest credentials:")
        for u in SAMPLE_USERS:
            print(f"  {u['email']} / {u['password']} ({u['role']})")


if __name__ == "__main__":
    asyncio.run(seed())
