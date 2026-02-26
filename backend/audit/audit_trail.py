"""
audit/audit_trail.py
====================
SQLite persistence for audit trails.
"""

import aiosqlite
import json
from datetime import datetime

DB_PATH = "audit_trail.sqlite"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS requests (
                request_id TEXT PRIMARY KEY,
                trace_id TEXT,
                timestamp TEXT,
                model_version TEXT,
                status TEXT,
                latency_ms INTEGER,
                agents_called TEXT,
                degraded_agents TEXT,
                final_output_json TEXT
            )
        ''')
        await db.commit()

async def persist_request(data: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            INSERT INTO requests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['request_id'],
            data.get('trace_id'),
            datetime.utcnow().isoformat(),
            data.get('model_version'),
            data.get('status'),
            data.get('latency_ms'),
            json.dumps(data.get('agents_called')),
            json.dumps(data.get('degraded_agents')),
            json.dumps(data.get('result'))
        ))
        await db.commit()

async def get_audit_trail(limit: int = 50):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM requests ORDER BY timestamp DESC LIMIT ?", (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]
