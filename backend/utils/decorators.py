from functools import wraps
from flask import jsonify
from .auth import get_actual_user

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_actual_user()
        if not user or not user.is_authenticated or not getattr(user, 'is_admin', False):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function
