import os
import requests
from flask import Blueprint, jsonify, current_app
from flask_login import login_required, current_user
from models import db, User

profile_bp = Blueprint('profile_bp', __name__, url_prefix='/api/profile')

@profile_bp.route('/sync-subscription', methods=['POST'])
@login_required
def sync_subscription():
    # This endpoint is designed to be non-destructive.
    # It can grant premium, but it will never revoke it.
    # Revocation should only happen via explicit webhook events (e.g., subscription_cancelled).
    user = current_user
    if user.is_premium:
        return jsonify({'is_premium': True, 'message': 'User is already premium.'})

    api_key = os.environ.get('LEMONSQUEEZY_API_KEY')
    if not api_key:
        current_app.logger.error("LEMONSQUEEZY_API_KEY environment variable is not set.")
        return jsonify(error={'message': 'The server is not configured for billing.'}), 500

    try:
        email = user.email
        # Fetch subscriptions from Lemon Squeezy
        url = f"https://api.lemonsqueezy.com/v1/subscriptions?filter[user_email]={email}"
        headers = {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": f"Bearer {api_key}"
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        subscriptions = data.get('data', [])

        # Check if any subscription is active
        is_premium_on_lemon = any(
            sub.get('attributes', {}).get('status') == 'active'
            for sub in subscriptions
        )

        if is_premium_on_lemon:
            user.is_premium = True
            db.session.commit()
            current_app.logger.info(f"Granted premium to {user.email} via manual profile sync.")

        return jsonify({'is_premium': user.is_premium})

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Lemon Squeezy API request failed: {e}")
        return jsonify(error={'message': 'Failed to sync subscription status.'}), 502
    except Exception as e:
        current_app.logger.error(f"Subscription sync error: {e}")
        db.session.rollback()
        return jsonify(error={'message': str(e)}), 500
