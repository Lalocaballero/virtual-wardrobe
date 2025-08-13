from flask import Blueprint, jsonify, request
from flask_login import current_user
from datetime import datetime, timedelta
from models import User, db, ClothingItem, AdminAction
from utils.decorators import admin_required

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([{'id': user.id, 'email': user.email, 'is_admin': user.is_admin, 'is_premium': user.is_premium, 'is_verified': user.is_verified, 'created_at': user.created_at} for user in users])

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({'id': user.id, 'email': user.email, 'is_admin': user.is_admin, 'is_premium': user.is_premium, 'is_verified': user.is_verified, 'created_at': user.created_at, 'location': user.location, 'display_name': user.display_name})

@admin_bp.route('/users/<int:user_id>/set-premium', methods=['POST'])
@admin_required
def set_premium(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    is_premium = data.get('is_premium')
    if is_premium is None:
        return jsonify({'error': 'Missing is_premium flag'}), 400
    user.is_premium = is_premium
    db.session.commit()
    return jsonify({'message': f'User {user.email} premium status set to {user.is_premium}'})

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f'User {user.email} has been deleted.'})

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    total_users = User.query.count()
    total_items = ClothingItem.query.count()
    premium_users = User.query.filter_by(is_premium=True).count()
    return jsonify({
        'total_users': total_users,
        'total_items': total_items,
        'premium_users': premium_users
    })

@admin_bp.route('/users/<int:user_id>/suspend', methods=['POST'])
@admin_required
def suspend_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    duration_days = data.get('duration', 7)
    reason = data.get('reason', 'No reason provided.')

    user.is_suspended = True
    user.suspension_end_date = datetime.utcnow() + timedelta(days=duration_days)
    
    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=user.id,
        action_type='suspend_user',
        details=f'Suspended for {duration_days} days. Reason: {reason}'
    )
    db.session.add(admin_action)
    db.session.commit()
    
    return jsonify({'message': f'User {user.email} has been suspended until {user.suspension_end_date}.'})

@admin_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@admin_required
def ban_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    reason = data.get('reason', 'No reason provided.')

    user.is_banned = True
    user.is_suspended = False
    user.suspension_end_date = None

    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=user.id,
        action_type='ban_user',
        details=f'Reason: {reason}'
    )
    db.session.add(admin_action)
    db.session.commit()

    return jsonify({'message': f'User {user.email} has been permanently banned.'})

@admin_bp.route('/users/<int:user_id>/impersonate', methods=['POST'])
@admin_required
def impersonate_user(user_id):
    user_to_impersonate = User.query.get_or_404(user_id)
    
    if user_to_impersonate.is_admin:
        return jsonify({'error': 'Cannot impersonate another admin.'}), 403

    impersonation_token = user_to_impersonate.get_token(salt='impersonate-salt', expires_sec=300)
    
    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=user_to_impersonate.id,
        action_type='impersonate_user',
        details=f'Admin impersonated user for 5 minutes.'
    )
    db.session.add(admin_action)
    db.session.commit()
    
    return jsonify({'message': 'Impersonation token generated.', 'impersonation_token': impersonation_token})

@admin_bp.route('/actions/log', methods=['GET'])
@admin_required
def get_admin_log():
    logs = AdminAction.query.order_by(AdminAction.created_at.desc()).all()
    return jsonify([log.to_dict() for log in logs])
