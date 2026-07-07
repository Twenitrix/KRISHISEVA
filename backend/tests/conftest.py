"""
KRISHISEVA — Test Configuration.

Sets up an in-memory SQLite database for running async tests,
overrides the database dependency in the FastAPI application,
and provides a test HTTP client.
"""

import asyncio
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import get_db
from app.main import app
from app.models.base import Base
# Import all models to register them on Base.metadata
from app.models.village import Village  # noqa: F401
from app.models.farmer import Farmer  # noqa: F401
from app.models.ngo import NGO  # noqa: F401
from app.models.official import Official  # noqa: F401
from app.models.land_registry import LandRegistry  # noqa: F401
from app.models.crop_insured_sum import CropInsuredSum  # noqa: F401
from app.models.past_event import PastEvent  # noqa: F401
from app.models.past_beneficiary import PastBeneficiary  # noqa: F401
from app.models.claim import Claim  # noqa: F401
from app.models.ngo_verification import NGOVerification  # noqa: F401
from app.models.claim_status_log import ClaimStatusLog  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401


# Use in-memory SQLite for self-contained, fast testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=True,
)


TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Create all tables in the in-memory SQLite database before running tests."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session bound to the transaction, rolling back after the test."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(autouse=True)
async def override_dependencies(db_session: AsyncSession):
    """Override get_db dependency in FastAPI app for testing."""
    async def _get_test_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest_asyncio.fixture(autouse=True)
async def cleanup_database(db_session: AsyncSession):
    yield
    # Rollback any active transactions
    await db_session.rollback()
    # Delete from all tables in reverse order to respect foreign key constraints
    for table in reversed(Base.metadata.sorted_tables):
        await db_session.execute(table.delete())
    await db_session.commit()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Yield an async client bound to the FastAPI application."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

