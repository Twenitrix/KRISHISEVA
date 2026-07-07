"""
KRISHISEVA — Alembic Environment Configuration.

Configures async migrations with SQLAlchemy 2.0.
Imports all models so Alembic can detect schema changes for autogenerate.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings

# ── Import ALL models so Alembic sees them ──
from app.models.base import Base
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

# Alembic Config object
config = context.config

# Set the SQLAlchemy URL from our Pydantic settings
config.set_main_option("sqlalchemy.url", settings.database_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for 'autogenerate'
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without connecting."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Run migrations using a live connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for online migrations — delegates to async runner."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
