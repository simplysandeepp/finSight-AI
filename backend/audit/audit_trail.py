"""
audit/audit_trail.py
====================
MongoDB persistence for audit trails with per-user isolation.
"""

from datetime import datetime
from typing import Optional
from database.mongodb import get_db
from loguru import logger

async def init_db():
    """Initialize MongoDB indexes for audit collection."""
    db = get_db()
    if db is None:
        logger.warning("MongoDB not available - audit trail disabled")
        return
    
    try:
        # Create indexes for efficient queries
        await db["audit_trail"].create_index("user_id")
        await db["audit_trail"].create_index("timestamp")
        await db["audit_trail"].create_index([("user_id", 1), ("timestamp", -1)])
        logger.info("Audit trail indexes created")
    except Exception as e:
        logger.error(f"Failed to create audit indexes: {e}")

async def persist_request(data: dict, user_id: Optional[str] = None):
    """
    Persist audit trail to MongoDB with user isolation.
    
    Args:
        data: Request data to persist
        user_id: Firebase UID for user isolation (optional for backward compatibility)
    """
    db = get_db()
    if db is None:
        logger.warning("MongoDB not available - skipping audit trail")
        return
    
    try:
        audit_record = {
            "user_id": user_id or "anonymous",
            "request_id": data.get('request_id'),
            "trace_id": data.get('trace_id'),
            "timestamp": datetime.utcnow(),
            "model_version": data.get('model_version'),
            "company_id": data.get('company_id'),
            "status": data.get('status'),
            "latency_ms": data.get('latency_ms'),
            "agents_called": data.get('agents_called', []),
            "degraded_agents": data.get('degraded_agents', []),
            "result": data.get('result'),
        }
        
        await db["audit_trail"].insert_one(audit_record)
        logger.info(f"Audit trail persisted for user {user_id or 'anonymous'}")
    except Exception as e:
        logger.error(f"Failed to persist audit trail: {e}")

async def get_audit_trail(user_id: Optional[str] = None, limit: int = 50):
    """
    Retrieve audit trail from MongoDB.
    
    Args:
        user_id: Firebase UID to filter by user (None returns all for backward compatibility)
        limit: Maximum number of records to return
    
    Returns:
        List of audit records
    """
    db = get_db()
    if db is None:
        logger.warning("MongoDB not available - returning empty audit trail")
        return []
    
    try:
        query = {"user_id": user_id} if user_id else {}
        cursor = db["audit_trail"].find(query).sort("timestamp", -1).limit(limit)
        records = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for JSON serialization
        for record in records:
            if "_id" in record:
                record["_id"] = str(record["_id"])
            if "timestamp" in record:
                record["timestamp"] = record["timestamp"].isoformat()
        
        return records
    except Exception as e:
        logger.error(f"Failed to retrieve audit trail: {e}")
        return []

