from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from models import db, ClothingItem
from utils.laundry_service import LaundryIntelligenceService

laundry_bp = Blueprint('laundry', __name__)

@laundry_bp.route('/api/laundry/suggestions', methods=['GET'])
@login_required
def get_laundry_suggestions():
    """
    Endpoint to get laundry load suggestions (e.g., whites, darks, delicates).
    """
    try:
        # The laundry service already has a method that generates suggestions.
        # We can reuse the get_laundry_alerts method for this.
        alerts = LaundryIntelligenceService.get_laundry_alerts(current_user.id)
        suggestions = alerts.get('laundry_suggestions', [])
        return jsonify(suggestions)
    except Exception as e:
        current_app.logger.error(f"Error getting laundry suggestions: {e}")
        return jsonify({'error': 'Failed to get laundry suggestions.'}), 500

@laundry_bp.route('/api/laundry/wash-load', methods=['POST'])
@login_required
def wash_load():
    """
    Endpoint to mark a list of clothing items as washed.
    """
    data = request.get_json()
    item_ids = data.get('item_ids')

    if not item_ids or not isinstance(item_ids, list):
        return jsonify({'error': 'A list of item_ids is required.'}), 400

    try:
        success = LaundryIntelligenceService.mark_items_washed(item_ids)
        if success:
            return jsonify({'message': 'Items marked as washed successfully.'})
        else:
            return jsonify({'error': 'Failed to mark items as washed.'}), 500
    except Exception as e:
        current_app.logger.error(f"Error washing load: {e}")
        return jsonify({'error': 'An unexpected error occurred.'}), 500
