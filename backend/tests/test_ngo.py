"""
KRISHISEVA — NGO Integration Tests.
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
from app.models.claim import Claim
from app.models.ngo import NGO
from app.models.ngo_verification import NGOVerification


import pytest_asyncio


@pytest_asyncio.fixture
async def seed_ngo_data(db_session):
    """Seed data required for NGO testing."""
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

    # 2. Seed Farmer
    farmer = Farmer(
        village_id=village.id,
        name="Devanand Patil",
        phone="9876543210",
        aadhaar_masked="9012",
        aadhaar_hash="mocked_hash_123",
        is_verified=True
    )
    db_session.add(farmer)
    await db_session.flush()

    # 3. Seed Land Registry
    land = LandRegistry(
        farmer_id=farmer.id,
        village_id=village.id,
        survey_number="101/A",
        area_hectares=2.0,
        crop_on_record="cotton",
        latitude=20.8351,
        longitude=78.6015
    )
    db_session.add(land)
    await db_session.flush()

    # 4. Seed Claim in 'filed' status (pending verification)
    claim = Claim(
        farmer_id=farmer.id,
        land_registry_id=land.id,
        village_id=village.id,
        photo_url="/static/uploads/claim.jpg",
        photo_latitude=20.8351,
        photo_longitude=78.6015,
        photo_timestamp=datetime.now(timezone.utc),
        claimed_event_type="drought",
        claimed_event_date="2026-07-01",
        status="filed"
    )
    db_session.add(claim)

    # 5. Seed NGO
    ngo = NGO(
        name="Wardha Seva Samiti",
        license_number="NGO-WRD-2026-001",
        contact_person="Shri Vinayak",
        phone="9999888877",
        email="ngo.wardha@ngo.org",
        hashed_password=hash_password("ngo_pass"),
        is_active=True
    )
    db_session.add(ngo)

    await db_session.commit()
    return {
        "village": village,
        "farmer": farmer,
        "land": land,
        "claim": claim,
        "ngo": ngo
    }


@pytest.mark.asyncio
async def test_ngo_submit_verification(client, seed_ngo_data, db_session, mocker, tmp_path):
    """Test NGO submitting field verification evidence."""
    data = seed_ngo_data
    ngo_token = create_access_token(user_id=data["ngo"].id, role="ngo")
    headers = {"Authorization": f"Bearer {ngo_token}"}

    # Prepare file upload
    files = {"file": ("field_visit.jpg", io.BytesIO(b"fake-image"), "image/jpeg")}
    form_data = {
        "claim_id": str(data["claim"].id),
        "farmer_id": str(data["farmer"].id),
        "remarks": "NGO verified: cotton field indeed looks dry.",
        "verification_type": "field_visit"
    }

    mocker.patch("app.routers.ngo.settings.upload_dir", str(tmp_path))

    response = await client.post("/api/v1/ngo/verifications", files=files, data=form_data, headers=headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["remarks"] == "NGO verified: cotton field indeed looks dry."
    assert res_json["data"]["ngo_id"] == str(data["ngo"].id)


@pytest.mark.asyncio
async def test_ngo_get_dashboard_and_history(client, seed_ngo_data, db_session):
    """Test retrieving NGO dashboard and upload history."""
    data = seed_ngo_data
    ngo_token = create_access_token(user_id=data["ngo"].id, role="ngo")
    headers = {"Authorization": f"Bearer {ngo_token}"}

    # Get NGO dashboard for village
    response = await client.get(f"/api/v1/ngo/dashboard?village_id={data['village'].id}", headers=headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert len(res_json["data"]["items"]) == 1
    assert res_json["data"]["items"][0]["id"] == str(data["claim"].id)

    # Insert a verification record
    verification = NGOVerification(
        ngo_id=data["ngo"].id,
        claim_id=data["claim"].id,
        farmer_id=data["farmer"].id,
        verification_type="field_visit",
        remarks="Pre-existing check",
        photo_url="/static/uploads/field.jpg"
    )
    db_session.add(verification)
    await db_session.commit()

    # Get history
    history_response = await client.get("/api/v1/ngo/verifications", headers=headers)
    assert history_response.status_code == 200
    history_json = history_response.json()
    assert history_json["success"] is True
    assert len(history_json["data"]["items"]) == 1
    assert history_json["data"]["items"][0]["remarks"] == "Pre-existing check"
