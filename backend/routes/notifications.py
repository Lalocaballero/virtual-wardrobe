import time
import json
from flask import Blueprint, jsonify, request, Response, current_app, session, stream_with_context
from flask_login import login_required, current_user
from models import db, Notification, User
from utils.auth import get_actual_user
from functools import wraps

notifications_bp = Blueprint('notifications', __name__)

def cors_stream(f):
    """A decorator to add CORS headers to a streaming response."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = f(*args, **kwargs)
        response.headers['Access-Control-Allow-Origin'] = 'https://wewear.app'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    return decorated_function


@notifications_bp.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    """
    Fetches all notifications for the current user, with unread first.
    """
    user = get_actual_user()
    try:
        notifications = Notification.query.filter_by(user_id=user.id)\
            .order_by(Notification.is_read.asc(), Notification.created_at.desc())\
            .all()
        return jsonify([n.to_dict() for n in notifications])
    except Exception as e:
        return jsonify({'error': 'Failed to fetch notifications.'}), 500

@notifications_bp.route('/api/notifications/mark-all-read', methods=['POST'])
@login_required
def mark_all_as_read():
    """
    Marks all of a user's notifications as read.
    """
    user = get_actual_user()
    try:
        Notification.query.filter_by(user_id=user.id, is_read=False)\
            .update({'is_read': True})
        db.session.commit()
        return jsonify({'message': 'All notifications marked as read.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to mark notifications as read.'}), 500

@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_as_read(notification_id):
    """
    Marks a single notification as read.
    """
    user = get_actual_user()
    try:
        notification = Notification.query.get(notification_id)
        if not notification or notification.user_id != user.id:
            return jsonify({'error': 'Notification not found.'}), 404
        
        notification.is_read = True
        db.session.commit()
        return jsonify(notification.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to mark notification as read.'}), 500

@notifications_bp.route('/api/notifications/stream')
@login_required
@cors_stream # Apply the CORS decorator
def stream_notifications():
    user_id = session.get('user_id')
    if not user_id:
        return Response(status=401)
    
    user = User.query.get(user_id)
    if not user:
        return Response(status=401)

    def event_stream():
        """
        This generator function will now run within the request context
        provided by stream_with_context, ensuring the DB is available.
        """
        last_id = request.headers.get('Last-Event-ID', 0, type=int)

        notifications = Notification.query.filter(
            Notification.user_id == user.id,
            Notification.id > last_id
        ).order_by(Notification.id.asc()).all()

        for notification in notifications:
            data = json.dumps(notification.to_dict())
            # Correctly format the SSE message with single newlines
            yield f"id:{notification.id}\ndata:{data}\n\n"
    
    # Use Flask's stream_with_context to safely manage the generator's lifecycle.
    # The decorator will then correctly apply the headers to this response.
    return Response(stream_with_context(event_stream()), mimetype='text/event-stream')

