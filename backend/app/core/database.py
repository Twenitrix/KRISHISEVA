"""
KRISHISEVA — Async Database Engine and Session Factory.

Uses SQLAlchemy 2.0 async with asyncpg driver for PostgreSQL.
All database access goes through the AsyncSession provided by get_db().
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# ── Engine ──
# pool_pre_ping=True: test connections before checkout (handles stale connections)
# pool_size=10: max persistent connections in the pool
# max_overflow=20: additional connections allowed beyond pool_size under load
is_sqlite = settings.database_url.startswith("sqlite")
engine_kwargs = {
    "echo": settings.database_echo,
}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_async_engine(
    settings.database_url,
    **engine_kwargs
)

# ── Session Factory ──
# expire_on_commit=False: prevents lazy-load issues after commit in async context
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """
    FastAPI dependency that yields an async database session.

    Usage in routers:
        async def my_endpoint(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
