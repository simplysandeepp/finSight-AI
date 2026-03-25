"""Minimal JWT implementation using HS256 (no external dependency)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict

SECRET = os.getenv('JWT_SECRET', 'dev-secret-change-me')


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip('=')


def _b64url_decode(data: str) -> bytes:
    pad = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def create_token(payload: Dict[str, Any], expires_seconds: int = 3600) -> str:
    header = {'alg': 'HS256', 'typ': 'JWT'}
    body = dict(payload)
    body['exp'] = int(time.time()) + int(expires_seconds)

    h = _b64url(json.dumps(header, separators=(',', ':')).encode())
    b = _b64url(json.dumps(body, separators=(',', ':')).encode())
    signing_input = f'{h}.{b}'.encode()
    sig = hmac.new(SECRET.encode(), signing_input, hashlib.sha256).digest()
    return f'{h}.{b}.{_b64url(sig)}'


def verify_token(token: str) -> Dict[str, Any]:
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError('Invalid token')

    h, b, s = parts
    signing_input = f'{h}.{b}'.encode()
    expected_sig = hmac.new(SECRET.encode(), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(expected_sig, _b64url_decode(s)):
        raise ValueError('Invalid signature')

    payload = json.loads(_b64url_decode(b).decode())
    if int(payload.get('exp', 0)) < int(time.time()):
        raise ValueError('Token expired')
    return payload
