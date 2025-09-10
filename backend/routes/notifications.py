import time
import json
from flask import Blueprint, jsonify, request, Response, current_app, session
from flask_login import login_required, current_user
from models import db, Notification, User
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
    user_id = session.get('user_id')
    if not user_id:
        return Response(status=401)
    
    user = User.query.get(user_id)
    if not user:
        return Response(status=401)
    
    app = current_app._get_current_object()

    def event_stream(app_instance):
        last_id = request.headers.get('Last-Event-ID', 0, type=int)

        with app_instance.app_context():
            notifications = Notification.query.filter(
                Notification.user_id == user.id,
                Notification.id > last_id
            ).order_by(Notification.id.asc()).all()

            for notification in notifications:
                data = json.dumps(notification.to_dict())
                yield f"id:{notification.id}\\ndata:{data}\\n\\n"
    
    # --- FIX FOR CORS ---
    # Create the response object from your event stream generator
    response = Response(event_stream(app), mimetype='text/event-stream')
    
    # Manually set the necessary CORS headers for this specific streaming response
    response.headers['Access-Control-Allow-Origin'] = 'https://wewear.app'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    
    return response

