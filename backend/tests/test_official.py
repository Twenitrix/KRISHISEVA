"""
KRISHISEVA — Official Integration Tests.
"""

import pytest
from datetime import datetime, date, timezone

from app.core.security import create_access_token, hash_password
from app.models.village import Village
from app.models.farmer import Farmer
from app.models.land_registry import LandRegistry
from app.models.claim import Claim
from app.models.official import Official


import pytest_asyncio


@pytest_asyncio.fixture
async def seed_official_data(db_session):
    """Seed data required for Official testing."""
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

    # 4. Seed Claim
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

    # 5. Seed Official
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
        "claim": claim,
        "official": official
    }


@pytest.mark.asyncio
async def test_official_get_dashboard_stats_and_claims(client, seed_official_data, db_session):
    """Test retrieving official dashboard, claims list, and statistics."""
    data = seed_official_data
    official_token = create_access_token(user_id=data["official"].id, role="official")
    headers = {"Authorization": f"Bearer {official_token}"}

    # 1. Get Official Dashboard
    response = await client.get("/api/v1/official/dashboard", headers=headers)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["village"]["name"] == "Wardha"
    assert res_json["data"]["official"]["designation"] == "DM"
    assert res_json["data"]["statistics"]["total_claims"] == 1

    # 2. List Village Claims
    claims_response = await client.get("/api/v1/official/claims", headers=headers)
    assert claims_response.status_code == 200
    claims_json = claims_response.json()
    assert claims_json["success"] is True
    assert len(claims_json["data"]["items"]) == 1
    assert claims_json["data"]["items"][0]["id"] == str(data["claim"].id)

    # 3. Get Village Statistics
    stats_response = await client.get("/api/v1/official/statistics", headers=headers)
    assert stats_response.status_code == 200
    stats_json = stats_response.json()
    assert stats_json["success"] is True
    assert stats_json["data"]["total_claims"] == 1
    assert stats_json["data"]["total_suggested_payout"] == 50000.0
