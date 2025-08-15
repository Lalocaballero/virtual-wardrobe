from flask import Blueprint, jsonify, request
from flask_login import login_required
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
