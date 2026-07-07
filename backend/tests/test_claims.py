"""
KRISHISEVA — Claims Integration Tests.
"""

import io
import uuid
import pytest
from datetime import datetime, date, timezone
from sqlalchemy.future import select

from app.core.security import create_access_token, hash_password
from app.models.village import Village
from app.models.farmer import Farmer
from app.models.land_registry import LandRegistry
from app.models.crop_insured_sum import CropInsuredSum
from app.models.claim import Claim
from app.models.past_event import PastEvent
from app.models.official import Official
from app.models.ngo import NGO
from app.routers.claims import run_async_ai_verification


import pytest_asyncio


@pytest_asyncio.fixture
async def seed_claims_data(db_session):
    """Seed data required for claims testing."""
    # 1. Seed Village
    village = Village(
        name="Wardha",
        district="Wardha",
        state="Maharashtra",
        taluka="Wardha",
        latitude=20.8351,
        longitude=78.6015
    )
    db_session.add(village)
    await db_session.flush()

    # 2. Seed Crop Insured Sums
    crop_sum = CropInsuredSum(
        crop_name="cotton",
        insured_sum_per_hectare=50000.0,
        season="Kharif",
        year=2026
    )
    db_session.add(crop_sum)

    # 3. Seed Farmer
    farmer = Farmer(
        village_id=village.id,
        name="Devanand Patil",
        phone="9876543210",
        aadhaar_masked="9012",
        aadhaar_hash="mocked_hash_123",
        bank_account_number="30912345678",
        bank_ifsc="SBIN0000123",
        is_verified=True
    )
    db_session.add(farmer)
    await db_session.flush()

    # 4. Seed Land Registry
    land = LandRegistry(
        farmer_id=farmer.id,
        village_id=village.id,
        survey_number="101/A",
        area_hectares=2.0,
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
    db_session.add(land)

    # 5. Seed Past Event
    event = PastEvent(
        village_id=village.id,
        event_type="drought",
        event_date=date(2026, 7, 1),
        severity="high",
        description="Dry spell in July."
    )
    db_session.add(event)

    # 6. Seed Official
    official = Official(
        name="Collector Wardha",
        designation="DM",
        email="dm.wardha@gov.in",
        hashed_password=hash_password("admin_pass"),
        assigned_village_id=village.id,
        is_active=True
    )
    db_session.add(official)

    await db_session.commit()
    return {
        "village": village,
        "farmer": farmer,
        "land": land,
        "event": event,
        "official": official
    }


@pytest.mark.asyncio
async def test_submit_claim_success(client, seed_claims_data, db_session, mocker, tmp_path):
    """Test successful claim submission and background AI verification."""
    data = seed_claims_data
    farmer_token = create_access_token(user_id=data["farmer"].id, role="farmer")
    headers = {"Authorization": f"Bearer {farmer_token}"}

    # Mock the AI service
    mock_analyze = mocker.patch("app.ai.service.AIService.analyze_claim_photo", return_value={
        "crop_identified": "cotton",
        "damage_percentage": 50.0,
        "justification": "Cotton crop showing clear leaf damage."
    })

    # Prepare mock file
    file_bytes = b"fake-jpeg-content"
    file_name = "test_crop.jpg"
    files = {"file": (file_name, io.BytesIO(file_bytes), "image/jpeg")}
    
    form_data = {
        "land_registry_id": str(data["land"].id),
        "claimed_event_type": "drought",
        "claimed_event_date": "2026-07-01",
        "description": "Severe drying of leaves",
        "test_latitude": 20.8351,
        "test_longitude": 78.6015
    }

    # Override upload dir settings temporarily to avoid writing to actual uploads directory
    mocker.patch("app.routers.claims.settings.upload_dir", str(tmp_path))

    # Send POST request
    response = await client.post("/api/v1/claims/", files=files, data=form_data, headers=headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["claimed_event_type"] == "drought"
    assert res_json["data"]["status"] == "filed"
    
    claim_id = uuid.UUID(res_json["data"]["id"])

    # Simulate background task execution manually
    # Locate the saved file in tmp_path
    saved_files = list(tmp_path.glob("*.jpg"))
    assert len(saved_files) == 1
    saved_file_path = str(saved_files[0])

    await run_async_ai_verification(claim_id, saved_file_path, db_session)

    # Refresh claim from database
    result = await db_session.execute(select(Claim).filter(Claim.id == claim_id))
    claim_after = result.scalars().first()

    # Assert verification status and payouts
    assert claim_after.status == "verified"
    assert claim_after.ai_identified_crop == "cotton"
    assert claim_after.ai_damage_percentage == 50.0
    
    # Verify calculated payout
    # area (2.0) * sum_per_hectare (50000.0) * damage (0.50) = 50000.0
    assert claim_after.suggested_payout_amount == 50000.0
    assert claim_after.gps_match_score is not None
    assert claim_after.ai_crop_matches_record is True



@pytest.mark.asyncio
async def test_submit_claim_validation_failures(client, seed_claims_data, mocker):
    """Test claim submission validation failures (e.g. wrong format, invalid land ID)."""
    data = seed_claims_data
    farmer_token = create_access_token(user_id=data["farmer"].id, role="farmer")
    headers = {"Authorization": f"Bearer {farmer_token}"}

    # Case 1: Invalid file format
    files = {"file": ("test.pdf", io.BytesIO(b"pdf-content"), "application/pdf")}
    form_data = {
        "land_registry_id": str(data["land"].id),
        "claimed_event_type": "drought",
        "claimed_event_date": "2026-07-01",
        "description": "Failure test"
    }
    response = await client.post("/api/v1/claims/", files=files, data=form_data, headers=headers)
    assert response.status_code == 422
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_official_review_claim(client, seed_claims_data, db_session):
    """Test government official reviewing (approving/adjusting) a claim."""
    data = seed_claims_data
    official_token = create_access_token(user_id=data["official"].id, role="official")
    headers = {"Authorization": f"Bearer {official_token}"}

    # Insert a pre-verified claim
    claim = Claim(
        farmer_id=data["farmer"].id,
        land_registry_id=data["land"].id,
        village_id=data["village"].id,
        photo_url="/static/uploads/dummy.jpg",
        photo_latitude=20.8351,
        photo_longitude=78.6015,
        photo_timestamp=datetime.now(timezone.utc),
        claimed_event_type="drought",
        claimed_event_date="2026-07-01",
        status="verified",
        suggested_payout_amount=50000.0,
        gps_match_score=1.0,
        land_match_score=1.0,
        ai_crop_matches_record=True,
        ai_identified_crop="cotton",
        ai_damage_percentage=50.0,
        ai_call_status="success"
    )
    db_session.add(claim)
    await db_session.commit()

    # Review request body: Approve and release payout
    review_data = {
        "decision": "approved",
        "approved_amount": 45000.0,  # Adjusted down slightly
        "remarks": "Approved with minor adjustments."
    }

    # Send PATCH request
    response = await client.patch(f"/api/v1/claims/{claim.id}/review", json=review_data, headers=headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["status"] == "approved"
    assert res_json["data"]["official_approved_amount"] == 45000.0
    assert res_json["data"]["reviewed_by_official_id"] == str(data["official"].id)
