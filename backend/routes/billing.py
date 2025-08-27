import os
import time
import requests
from flask import Blueprint, jsonify, current_app
from flask_login import login_required, current_user
from models import db, User
from utils.auth import get_actual_user

billing_bp = Blueprint('billing_bp', __name__, url_prefix='/api/billing')

@billing_bp.route('/create-portal-session', methods=['POST'])
@login_required
def create_portal_session():
    user = get_actual_user()
    if not user.is_premium or not user.subscription_id:
        return jsonify(error={'message': 'User is not a premium subscriber or subscription ID is missing.'}), 403

    api_key = os.environ.get('LEMONSQUEEZY_API_KEY')
    if not api_key:
        current_app.logger.error("LEMONSQUEEZY_API_KEY environment variable is not set.")
        return jsonify(error={'message': 'The server is not configured for billing.'}), 500

    try:
        # Retrieve the subscription to get a fresh customer_portal URL
        url = f"https://api.lemonsqueezy.com/v1/subscriptions/{user.subscription_id}"
        headers = {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
            "Authorization": f"Bearer {api_key}"
        }
        
        start_time = time.time()
        current_app.logger.info(f"Requesting customer portal URL for user {user.id} from Lemon Squeezy.")
        
        response = requests.get(url, headers=headers, timeout=15) # Add a 15-second timeout
        
        duration = time.time() - start_time
        current_app.logger.info(f"Lemon Squeezy API call for user {user.id} completed in {duration:.2f} seconds.")

        response.raise_for_status()

        data = response.json()
        portal_url = data.get('data', {}).get('attributes', {}).get('urls', {}).get('customer_portal')

        if not portal_url:
            current_app.logger.error(f"Could not retrieve customer_portal_url for subscription {user.subscription_id}")
            return jsonify(error={'message': 'Could not retrieve customer portal URL.'}), 500

        return jsonify({'url': portal_url})

    except requests.exceptions.Timeout:
        duration = time.time() - start_time
        current_app.logger.error(f"Lemon Squeezy API request timed out after {duration:.2f} seconds for user {user.id}.")
        return jsonify(error={'message': 'The request to our billing provider timed out. Please try again in a few moments.'}), 504
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Lemon Squeezy API request failed: {e}")
        return jsonify(error={'message': 'Failed to create customer portal session.'}), 502
    except Exception as e:
        current_app.logger.error(f"Create portal session error: {e}")
        return jsonify(error={'message': str(e)}), 500
