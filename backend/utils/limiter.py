from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from .auth import get_actual_user

limiter = Limiter(
    key_func=lambda: get_actual_user().id if get_actual_user() else get_remote_address(),
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    strategy="fixed-window"
)

def get_user_specific_limit():
    user = get_actual_user()
    if user and hasattr(user, 'is_premium') and user.is_premium:
        return "4 per hour"
    return "2 per day"
