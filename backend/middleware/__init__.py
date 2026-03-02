"""
middleware/firebase_auth.py
===========================
Phase 9: Firebase token verification middleware.
Verifies the Firebase ID-token sent via Authorization: Bearer <token>.

When FIREBASE_PROJECT_ID env-var is unset the middleware is a no-op
(lets all requests through) so local development works without Firebase.
"""

import os
from typing import Optional

from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger

# Lazy-init Firebase Admin SDK
_firebase_app = None


def _init_firebase():
    """Initialise the Firebase Admin SDK once from env vars."""
    global _firebase_app
    if _firebase_app is not None:
        return

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not project_id:
        logger.warning("FIREBASE_PROJECT_ID not set — auth middleware disabled (dev mode).")
        return

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL", ""),
            "token_uri": "https://oauth2.googleapis.com/token",
        })
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialised.")
    except Exception as e:
        logger.error(f"Firebase Admin init failed: {e}")


def verify_firebase_token(token: str) -> Optional[dict]:
    """Return decoded token dict or None."""
    _init_firebase()
    if _firebase_app is None:
        return {"uid": "dev-user", "email": "dev@localhost"}  # dev fallback

    try:
        from firebase_admin import auth
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        return None


_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency — extracts and verifies the Firebase bearer token.
    Returns the decoded user dict (contains uid, email, etc.).
    """
    creds: Optional[HTTPAuthorizationCredentials] = await _bearer_scheme(request)

    # If no FIREBASE_PROJECT_ID, run in open/dev mode
    if not os.getenv("FIREBASE_PROJECT_ID"):
        # Check if uid was sent in query or body (for dev convenience)
        uid = request.query_params.get("uid") or "dev-user"
        return {"uid": uid, "email": "dev@localhost"}

    if creds is None:
        raise HTTPException(status_code=401, detail="Missing authorization token.")

    user = verify_firebase_token(creds.credentials)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    return user
