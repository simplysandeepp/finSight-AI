"""
backend/utils/rate_limiter.py
==============================
Simple in-memory rate limiter for FastAPI.
"""

import time
from typing import Dict, Tuple
from collections import defaultdict
from threading import Lock

class RateLimiter:
    """
    Simple sliding window rate limiter.

    Tracks requests per IP address and enforces rate limits.
    """

    def __init__(self):
        # ip -> list of (timestamp, count)
        self.requests: Dict[str, list] = defaultdict(list)
        self.lock = Lock()

    def is_rate_limited(
        self,
        key: str,
        max_requests: int = 10,
        window_seconds: int = 60
    ) -> Tuple[bool, int]:
        """
        Check if a key (IP address) has exceeded the rate limit.

        Args:
            key: Identifier (usually IP address)
            max_requests: Maximum requests allowed in the window
            window_seconds: Time window in seconds

        Returns:
            Tuple of (is_limited, requests_remaining)
        """
        with self.lock:
            now = time.time()
            cutoff = now - window_seconds

            # Remove old requests outside the window
            self.requests[key] = [
                (ts, count) for ts, count in self.requests[key]
                if ts > cutoff
            ]

            # Count requests in current window
            current_count = sum(count for _, count in self.requests[key])

            if current_count >= max_requests:
                # Rate limited
                return True, 0

            # Add current request
            self.requests[key].append((now, 1))

            # Calculate remaining
            remaining = max_requests - (current_count + 1)
            return False, remaining

    def reset(self, key: str) -> None:
        """Reset rate limit for a specific key."""
        with self.lock:
            if key in self.requests:
                del self.requests[key]

    def clear_all(self) -> None:
        """Clear all rate limit data."""
        with self.lock:
            self.requests.clear()


# Global rate limiter instance
rate_limiter = RateLimiter()
