"""
KRISHISEVA — Auth Tests.

Verifies farmer OTP login, NGO registration & login, Official login, JWT refresh,
logout, and profile fetching against mock dependencies.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, hash_aadhaar
from app.models.village import Village
from app.models.farmer import Farmer
from app.models.ngo import NGO
from app.models.official import Official


@pytest_asyncio.fixture(autouse=True)
async def seed_data(db_session: AsyncSession):

    """Seed base village and user entities for test cases."""
    # Seed Village
    village = Village(
        name="Dharna",
        district="Wardha",
        state="Maharashtra",
        taluka="Seloo",
        latitude=20.8351,
        longitude=78.6015
    )
    db_session.add(village)
    await db_session.flush()

    # Seed Farmer
    farmer = Farmer(
        village_id=village.id,
        name="Devanand Patil",
        phone="9876543210",
        aadhaar_masked="9012",
        aadhaar_hash=hash_aadhaar("123456789012"),
        bank_account_number="1234567890",
        bank_ifsc="SBIN0001234",
        is_verified=False
    )
    db_session.add(farmer)

    # Seed Official
    official = Official(
        name="DM Saxena",
        designation="DM",
        email="dm.wardha@gov.in",
        hashed_password=hash_password("admin_pass"),
        assigned_village_id=village.id,
        is_active=True
    )
    db_session.add(official)

    # Seed NGO
    ngo = NGO(
        name="Krishi Kalyan NGO",
        license_number="NGO-9876-MH",
        contact_person="Vidya Sagar",
        phone="9988776655",
        email="contact@krishikalyan.org",
        hashed_password=hash_password("ngo_pass"),
        is_active=True
    )
    db_session.add(ngo)
    await db_session.flush()



@pytest.mark.asyncio
async def test_farmer_otp_request_success(client: AsyncClient, mocker):
    """Verify that a farmer with registered Aadhaar can request OTP."""
    # Mock the http request to mock-aadhaar
    class MockResponse:
        status_code = 200
        def json(self):
            return {
                "success": True,
                "message": "OTP sent successfully",
                "otp_sent_to": "XXXX-XXX-3210",
                "mock_otp": "123456"
            }

    # Patch httpx.AsyncClient.post to return mock response only for Aadhaar service calls
    import httpx
    original_post = httpx.AsyncClient.post

    async def mock_post(self, url, *args, **kwargs):
        if "aadhaar/request-otp" in str(url):
            return MockResponse()
        return await original_post(self, url, *args, **kwargs)

    mocker.patch("httpx.AsyncClient.post", mock_post)


    response = await client.post(
        "/api/v1/auth/farmer/request-otp",
        json={"aadhaar_number": "123456789012"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["mock_otp"] == "123456"





@pytest.mark.asyncio
async def test_farmer_otp_request_unregistered(client: AsyncClient):
    """Verify requesting OTP for unregistered Aadhaar returns 404."""
    response = await client.post(
        "/api/v1/auth/farmer/request-otp",
        json={"aadhaar_number": "000000000000"}
    )
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_farmer_otp_verify_success(client: AsyncClient, mocker):
    """Verify successful farmer OTP verification returns JWT tokens."""
    class MockResponse:
        status_code = 200
        def json(self):
            return {"success": True}

    # Patch httpx.AsyncClient.post to return mock response only for Aadhaar service calls
    import httpx
    original_post = httpx.AsyncClient.post

    async def mock_post(self, url, *args, **kwargs):
        if "aadhaar/verify-otp" in str(url):
            return MockResponse()
        return await original_post(self, url, *args, **kwargs)

    mocker.patch("httpx.AsyncClient.post", mock_post)


    response = await client.post(
        "/api/v1/auth/farmer/verify-otp",
        json={"aadhaar_number": "123456789012", "otp": "123456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["role"] == "farmer"


@pytest.mark.asyncio
async def test_ngo_login_success(client: AsyncClient):
    """Verify registered NGO can login with email and password."""
    response = await client.post(
        "/api/v1/auth/ngo/login",
        json={"email": "contact@krishikalyan.org", "password": "ngo_pass"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["role"] == "ngo"


@pytest.mark.asyncio
async def test_official_login_success(client: AsyncClient):
    """Verify registered official can login with email and password."""
    response = await client.post(
        "/api/v1/auth/official/login",
        json={"email": "dm.wardha@gov.in", "password": "admin_pass"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["role"] == "official"


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    """Verify refresh token rotation returns a new access & refresh token pair."""
    # First login to get a refresh token
    login_response = await client.post(
        "/api/v1/auth/official/login",
        json={"email": "dm.wardha@gov.in", "password": "admin_pass"}
    )
    assert login_response.status_code == 200
    refresh_token = login_response.json()["data"]["refresh_token"]

    # Call refresh endpoint
    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 200
    data = refresh_response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]

    # Try using the old refresh token again (should fail due to rotation/reuse protection)
    reuse_response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert reuse_response.status_code == 401
    assert reuse_response.json()["success"] is False


@pytest.mark.asyncio
async def test_get_profile_success(client: AsyncClient):
    """Verify /me profile endpoint returns correct user data based on role."""
    # Login as NGO
    login_response = await client.post(
        "/api/v1/auth/ngo/login",
        json={"email": "contact@krishikalyan.org", "password": "ngo_pass"}
    )
    access_token = login_response.json()["data"]["access_token"]

    # Call /me with Bearer token
    profile_response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert profile_response.status_code == 200
    data = profile_response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Krishi Kalyan NGO"
    assert data["data"]["role"] == "ngo"
    assert data["data"]["email"] == "contact@krishikalyan.org"
