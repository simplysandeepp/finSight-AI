"""Simple in-memory TTL cache with stats."""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class _Entry:
    value: Any
    expires_at: float


class TTLCache:
    def __init__(self):
        self._data: Dict[str, _Entry] = {}
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        now = time.time()
        item = self._data.get(key)
        if not item:
            self.misses += 1
            return None
        if item.expires_at < now:
            self._data.pop(key, None)
            self.misses += 1
            return None
        self.hits += 1
        return item.value

    def set(self, key: str, value: Any, ttl_seconds: int):
        self._data[key] = _Entry(value=value, expires_at=time.time() + ttl_seconds)

    def stats(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total else 0.0
        return {
            'keys': len(self._data),
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': round(hit_rate, 2),
        }


prediction_cache = TTLCache()
macro_cache = TTLCache()
profile_cache = TTLCache()
