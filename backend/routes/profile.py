import os
import requests
from flask import Blueprint, jsonify, current_app
from flask_login import login_required, current_user
from models import db, User

profile_bp = Blueprint('profile_bp', __name__, url_prefix='/api/profile')

@profile_bp.route('/sync-subscription', methods=['POST'])
@login_required
def sync_subscription():
    api_key = os.environ.get('LEMONSQUEEZY_API_KEY')
    if not api_key:
        current_app.logger.error("LEMONSQUEEZY_API_KEY environment variable is not set.")
        return jsonify(error={'message': 'The server is not configured for billing.'}), 500

    try:
        user = current_user
        email = user.email

        # Fetch subscriptions from Lemon Squeezy
        url = f"https://api.lemonsqueezy.com/v1/subscriptions?filter[user_email]={email}"
        headers = {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": f"Bearer {api_key}"
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes

        data = response.json()
        subscriptions = data.get('data', [])

        # Check for an active subscription
        is_premium = any(
            sub.get('attributes', {}).get('status') == 'active'
            for sub in subscriptions
        )

        # Update user's premium status in the database
        user.is_premium = is_premium
        db.session.commit()

        return jsonify({'is_premium': user.is_premium})

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Lemon Squeezy API request failed: {e}")
        return jsonify(error={'message': 'Failed to sync subscription status.'}), 502
    except Exception as e:
        current_app.logger.error(f"Subscription sync error: {e}")
        db.session.rollback()
        return jsonify(error={'message': str(e)}), 500
