import time
import json
from flask import Blueprint, jsonify, request, Response, current_app, session
from flask_login import login_required, current_user
from models import db, Notification
from utils.auth import get_actual_user

notifications_bp = Blueprint('notifications', __name__)

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
@login_required # Keep this as a first-line defense
def stream_notifications():
    # --- THE FIX ---
    # Manually load the user from the session ID for reliability in a streaming context.
    user_id = session.get('user_id')
    if not user_id:
        # If there's no user_id in the session, the user is not properly logged in.
        return Response(status=401)
    
    # Fetch the user directly from the database using the ID from the session.
    user = User.query.get(user_id)
    if not user:
        # If the user_id from the session doesn't match a real user in the database.
        return Response(status=401)
    # --- END OF FIX ---

    # The rest of the function can now proceed, confident that 'user' is a valid object.
    app = current_app._get_current_object()

    def event_stream(app_instance):
        last_sent_id = 0
        while True:
            with app_instance.app_context():
                new_notifications = Notification.query.filter(
                    Notification.user_id == user.id, # This line will now work
                    Notification.id > last_sent_id
                ).order_by(Notification.id.asc()).all()

                for notification in new_notifications:
                    data = json.dumps(notification.to_dict())
                    yield f"data: {data}\\n\\n"
                    last_sent_id = notification.id
            
            time.sleep(5)
    
    return Response(event_stream(app), mimetype='text/event-stream')