"""MySQL database setup with async SQLAlchemy for user authentication."""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

mysql_engine = create_async_engine(
    settings.MYSQL_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

mysql_async_session = async_sessionmaker(
    mysql_engine, class_=AsyncSession, expire_on_commit=False
)


class MySQLBase(DeclarativeBase):
    """Base class for all MySQL ORM models."""
    pass


async def init_mysql_db():
    """Create all tables in MySQL on startup."""
    async with mysql_engine.begin() as conn:
        await conn.run_sync(MySQLBase.metadata.create_all)


async def get_mysql_db() -> AsyncSession:
    """Dependency: yield a MySQL database session."""
    async with mysql_async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
