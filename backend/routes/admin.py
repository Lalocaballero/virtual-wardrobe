from flask import Blueprint, jsonify, request
from models import User
from utils.decorators import admin_required

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/admin')

from models import db, ClothingItem

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
