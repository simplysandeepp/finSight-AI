"""
database/mongodb.py
===================
Async MongoDB connection using Motor.
Provides access to FinSight collections:
  - org_profiles
  - org_financials
  - org_analysis_results
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger

_client: AsyncIOMotorClient | None = None
_db = None


async def connect_mongo():
    """Initialise the Motor client and return the database handle."""
    global _client, _db

    mongo_url = os.getenv("MONGODB_URL", "")
    if not mongo_url:
        logger.warning("MONGODB_URL not set — MongoDB features will be unavailable.")
        return None

    try:
        _client = AsyncIOMotorClient(mongo_url)
        _db = _client["finsight"]
        # Quick ping to verify connectivity
        await _client.admin.command("ping")
        logger.info("Connected to MongoDB Atlas (finsight database).")
        return _db
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        _client = None
        _db = None
        return None


async def close_mongo():
    """Gracefully close the Motor client."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")


def get_db():
    """Return the current database handle (may be None if not connected)."""
    return _db


# ----- convenience accessors -----

def org_profiles():
    """Return the org_profiles collection."""
    return _db["org_profiles"] if _db is not None else None


def org_financials():
    """Return the org_financials collection."""
    return _db["org_financials"] if _db is not None else None


def org_analysis_results():
    """Return the org_analysis_results collection."""
    return _db["org_analysis_results"] if _db is not None else None
