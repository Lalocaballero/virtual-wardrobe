from flask import request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from .auth import get_actual_user

def safe_key_func():
    """
    Custom key function for the rate limiter that is safe for OPTIONS requests
    and handles both authenticated and anonymous users.
    """
    # For OPTIONS requests, rate limit by IP to avoid crashes on auth checks
    if request.method == 'OPTIONS':
        return get_remote_address()

    user = get_actual_user()
    # If we have an authenticated user, use their ID
    if user and user.is_authenticated:
        return str(user.id)
    
    # Otherwise, fall back to the remote address for anonymous users
    return get_remote_address()

limiter = Limiter(
    key_func=safe_key_func,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    strategy="fixed-window"
)

def get_user_specific_limit():
    user = get_actual_user()
    if user and hasattr(user, 'is_premium') and user.is_premium:
        return "4 per hour"
    return "2 per day"
