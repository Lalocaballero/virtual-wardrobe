from flask import g
from flask_login import current_user

def get_actual_user():
    """
    Returns the impersonated user if one exists, otherwise returns the current session user.
    """
    if hasattr(g, 'user') and g.user:
        return g.user
    return current_user
