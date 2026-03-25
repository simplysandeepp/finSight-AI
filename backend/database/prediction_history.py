"""SQLite persistence for predictions and auth users."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / 'out' / 'finsight.db'


def _conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_history_db() -> None:
    with _conn() as conn:
        conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS prediction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                user_id TEXT,
                ticker TEXT NOT NULL,
                as_of_date TEXT NOT NULL,
                revenue_p50 REAL,
                ebitda_p50 REAL,
                recommendation TEXT,
                sector TEXT,
                raw_json TEXT NOT NULL
            )
            '''
        )
        conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TEXT NOT NULL
            )
            '''
        )
        conn.commit()


def save_prediction_record(ticker: str, as_of_date: str, result: Dict[str, Any], user_id: Optional[str] = None) -> int:
    forecast = (result.get('result') or {}).get('final_forecast') or {}
    recommendation = ((result.get('result') or {}).get('recommendation') or {}).get('action')
    sector = (result.get('company_profile') or {}).get('sector')

    with _conn() as conn:
        cur = conn.execute(
            '''
            INSERT INTO prediction_history (
                created_at, user_id, ticker, as_of_date, revenue_p50, ebitda_p50, recommendation, sector, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                datetime.utcnow().isoformat() + 'Z',
                user_id,
                ticker,
                as_of_date,
                float(forecast.get('revenue_p50') or 0),
                float(forecast.get('ebitda_p50') or 0),
                recommendation,
                sector,
                json.dumps(result),
            ),
        )
        conn.commit()
        return int(cur.lastrowid)


def get_prediction_history(ticker: str, limit: int = 50, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = 'SELECT * FROM prediction_history WHERE ticker = ?'
    params: List[Any] = [ticker]
    if user_id:
        query += ' AND user_id = ?'
        params.append(user_id)
    query += ' ORDER BY id DESC LIMIT ?'
    params.append(limit)

    with _conn() as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


def get_recent_predictions(limit: int = 20) -> List[Dict[str, Any]]:
    with _conn() as conn:
        rows = conn.execute('SELECT * FROM prediction_history ORDER BY id DESC LIMIT ?', (limit,)).fetchall()
    return [dict(r) for r in rows]


def create_user(email: str, password_hash: str, role: str = 'user') -> Dict[str, Any]:
    with _conn() as conn:
        cur = conn.execute(
            'INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)',
            (email, password_hash, role, datetime.utcnow().isoformat() + 'Z'),
        )
        conn.commit()
        user_id = int(cur.lastrowid)
        row = conn.execute('SELECT id, email, role, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
    return dict(row)


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with _conn() as conn:
        row = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with _conn() as conn:
        row = conn.execute('SELECT id, email, role, created_at FROM users WHERE id = ?', (user_id,)).fetchone()
    return dict(row) if row else None
