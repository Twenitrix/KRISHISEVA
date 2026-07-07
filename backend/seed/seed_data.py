"""
KRISHISEVA — Seeding Script.

Seeds the database with a single-village demo setup:
- 1 Village (Wardha)
- 3 Farmers
- 3 Land Parcels (with survey numbers and crop records)
- 3 Crop Insured Sum pricing entries
- 2 Past Disaster Events
- 1 Past Payout Beneficiary record
- 1 NGO (Wardha Seva Samiti)
- 1 Government Official (DM Wardha)
"""

import asyncio
import os
import sys
from datetime import date

# Add parent directory to path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db, engine
from app.core.security import hash_password, hash_aadhaar, mask_aadhaar
from app.models.base import Base
from app.models.village import Village

from app.models.farmer import Farmer
from app.models.land_registry import LandRegistry
from app.models.crop_insured_sum import CropInsuredSum
from app.models.past_event import PastEvent
from app.models.past_beneficiary import PastBeneficiary
from app.models.claim import Claim
from app.models.ngo_verification import NGOVerification
from app.models.claim_status_log import ClaimStatusLog
from app.models.refresh_token import RefreshToken
from app.models.ngo import NGO
from app.models.official import Official


async def seed_data():
    """Seeds reference data into the database."""
    print("Connecting to database...")

    # Set up engine dynamically based on reachability
    from sqlalchemy.ext.asyncio import create_async_engine
    
    current_engine = engine
    db_url = settings.database_url
    
    try:
        # Test connection to the primary database engine
        async with current_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("Connected to primary database successfully.")
    except Exception as e:
        print(f"Failed to connect to primary database URL: {db_url}")
        print(f"Error details: {e}")
        
        if "db:5432" in db_url:
            fallback_url = db_url.replace("db:5432", "localhost:5432")
            print(f"Attempting fallback to localhost database: {fallback_url}")
            try:
                current_engine = create_async_engine(fallback_url)
                async with current_engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
                    db_url = fallback_url
                    print("Connected to localhost fallback database.")
            except Exception as e2:
                print(f"Fallback to localhost failed: {e2}")
                current_engine = None
        else:
            current_engine = None
            
        if current_engine is None:
            sqlite_url = "sqlite+aiosqlite:///krishiseva.db"
            print(f"Falling back to local SQLite database: {sqlite_url}")
            current_engine = create_async_engine(sqlite_url)
            async with current_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                db_url = sqlite_url

    # Create session factory for the selected engine
    from sqlalchemy.ext.asyncio import async_sessionmaker
    session_factory = async_sessionmaker(
        bind=current_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as db:
        # Check if village already exists

        result = await db.execute(select(Village).filter(Village.name == "Wardha"))
        existing_village = result.scalars().first()
        if existing_village:
            print("Database already contains seed data. Skipping seeding.")
            return

        print("Seeding Wardha village...")
        village = Village(
            name="Wardha",
            district="Wardha",
            state="Maharashtra",
            taluka="Wardha",
            latitude=20.8351,
            longitude=78.6015
        )
        db.add(village)
        await db.flush()  # Generate village.id

        print("Seeding crop insured sums...")
        crop_sums = [
            CropInsuredSum(
                crop_name="cotton",
                insured_sum_per_hectare=55000.0,
                season="Kharif",
                year=2026
            ),
            CropInsuredSum(
                crop_name="wheat",
                insured_sum_per_hectare=40000.0,
                season="Rabi",
                year=2026
            ),
            CropInsuredSum(
                crop_name="soyabean",
                insured_sum_per_hectare=35000.0,
                season="Kharif",
                year=2026
            )
        ]
        db.add_all(crop_sums)

        print("Seeding farmers...")
        farmer1 = Farmer(
            village_id=village.id,
            name="Devanand Patil",
            phone="9876543210",
            aadhaar_masked=mask_aadhaar("123456789012"),
            aadhaar_hash=hash_aadhaar("123456789012"),
            bank_account_number="30912345678",
            bank_ifsc="SBIN0000123",
            is_verified=True
        )
        farmer2 = Farmer(
            village_id=village.id,
            name="Ramesh Shinde",
            phone="9876543211",
            aadhaar_masked=mask_aadhaar("123456789013"),
            aadhaar_hash=hash_aadhaar("123456789013"),
            bank_account_number="30912345679",
            bank_ifsc="SBIN0000123",
            is_verified=True
        )
        farmer3 = Farmer(
            village_id=village.id,
            name="Suresh Pawar",
            phone="9876543212",
            aadhaar_masked=mask_aadhaar("123456789014"),
            aadhaar_hash=hash_aadhaar("123456789014"),
            bank_account_number="30912345680",
            bank_ifsc="SBIN0000123",
            is_verified=True
        )
        db.add_all([farmer1, farmer2, farmer3])
        await db.flush()  # Generate farmer IDs

        print("Seeding land registries...")
        land1 = LandRegistry(
            farmer_id=farmer1.id,
            village_id=village.id,
            survey_number="101/A",
            area_hectares=1.5,
            crop_on_record="cotton",
            latitude=20.8351,
            longitude=78.6015,
            polygon_coords={
                "type": "Polygon",
                "coordinates": [
                    [
                        [78.5995, 20.8340],
                        [78.6035, 20.8340],
                        [78.6035, 20.8360],
                        [78.5995, 20.8360],
                        [78.5995, 20.8340]
                    ]
                ]
            }
        )
        land2 = LandRegistry(
            farmer_id=farmer2.id,
            village_id=village.id,
            survey_number="102/B",
            area_hectares=2.0,
            crop_on_record="wheat",
            latitude=20.8360,
            longitude=78.6025,
            polygon_coords={
                "type": "Polygon",
                "coordinates": [
                    [
                        [78.6010, 20.8350],
                        [78.6040, 20.8350],
                        [78.6040, 20.8370],
                        [78.6010, 20.8370],
                        [78.6010, 20.8350]
                    ]
                ]
            }
        )
        land3 = LandRegistry(
            farmer_id=farmer3.id,
            village_id=village.id,
            survey_number="103/C",
            area_hectares=3.2,
            crop_on_record="soyabean",
            latitude=20.8340,
            longitude=78.6005,
            polygon_coords={
                "type": "Polygon",
                "coordinates": [
                    [
                        [78.5985, 20.8330],
                        [78.6025, 20.8330],
                        [78.6025, 20.8350],
                        [78.5985, 20.8350],
                        [78.5985, 20.8330]
                    ]
                ]
            }
        )
        db.add_all([land1, land2, land3])

        print("Seeding past events...")
        event1 = PastEvent(
            village_id=village.id,
            event_type="drought",
            event_date=date(2024, 9, 15),
            severity="high",
            description="Severe lack of seasonal rainfall causing widespread crop wilting."
        )
        event2 = PastEvent(
            village_id=village.id,
            event_type="hailstorm",
            event_date=date(2025, 3, 20),
            severity="medium",
            description="Unexpected pre-monsoon hailstorm damaging maturing winter crops."
        )
        db.add_all([event1, event2])
        await db.flush()  # Generate event IDs

        print("Seeding past beneficiaries...")
        beneficiary1 = PastBeneficiary(
            farmer_id=farmer1.id,
            event_id=event1.id,
            claim_amount=25000.0,
            payout_amount=15000.0,
            payout_date=date(2024, 11, 10)
        )
        db.add(beneficiary1)

        print("Seeding NGO (Wardha Seva Samiti)...")
        ngo = NGO(
            name="Wardha Seva Samiti",
            license_number="NGO-WRD-2026-001",
            contact_person="Shri Vinayak",
            phone="9999888877",
            email="ngo.wardha@ngo.org",
            hashed_password=hash_password("ngo_pass"),
            is_active=True
        )
        db.add(ngo)

        print("Seeding Government Official (DM Wardha)...")
        official = Official(
            name="Collector Wardha",
            designation="DM",
            email="dm.wardha@gov.in",
            hashed_password=hash_password("admin_pass"),
            phone="9999888811",
            assigned_village_id=village.id,
            is_active=True
        )
        db.add(official)

        await db.commit()
        print("SUCCESS: Database successfully seeded with demo Wardha village parameters!")




if __name__ == "__main__":
    asyncio.run(seed_data())
