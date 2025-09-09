import os
import requests
from flask import Blueprint, jsonify, current_app, request
from flask_login import login_required, current_user
from models import db, User, NegativePrompt

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

@profile_bp.route('/negative-prompts', methods=['GET'])
@login_required
def get_negative_prompts():
    """Fetches all negative prompts for the current user."""
    prompts = NegativePrompt.query.filter_by(user_id=current_user.id).order_by(NegativePrompt.created_at.desc()).all()
    return jsonify([prompt.to_dict() for prompt in prompts])

@profile_bp.route('/negative-prompts', methods=['POST'])
@login_required
def add_negative_prompt():
    """Adds a new negative prompt for the current user."""
    data = request.get_json()
    prompt_text = data.get('prompt_text')

    if not prompt_text or not prompt_text.strip():
        return jsonify({'error': 'Prompt text cannot be empty.'}), 400

    new_prompt = NegativePrompt(
        user_id=current_user.id,
        prompt_text=prompt_text
    )
    db.session.add(new_prompt)
    db.session.commit()

    return jsonify(new_prompt.to_dict()), 201

@profile_bp.route('/negative-prompts/<int:prompt_id>', methods=['DELETE'])
@login_required
def delete_negative_prompt(prompt_id):
    """Deletes a specific negative prompt for the current user."""
    prompt = NegativePrompt.query.get_or_404(prompt_id)

    if prompt.user_id != current_user.id:
        return jsonify({'error': 'You do not have permission to delete this prompt.'}), 403

    db.session.delete(prompt)
    db.session.commit()

    return jsonify({'message': 'Prompt deleted successfully.'}), 200

@profile_bp.route('/onboarding-status', methods=['POST'])
@login_required
def update_onboarding_status():
    """Updates the user's onboarding and app tour status."""
    data = request.get_json()
    user = current_user

    if 'has_completed_onboarding' in data:
        user.has_completed_onboarding = bool(data['has_completed_onboarding'])
    
    if 'has_seen_app_tour' in data:
        user.has_seen_app_tour = bool(data['has_seen_app_tour'])
    
    db.session.commit()
    return jsonify({'message': 'Onboarding status updated successfully.'})


@profile_bp.route('/status', methods=['GET'])
@login_required
def get_user_status():
    """
    Returns the premium status of the currently logged-in user.
    Used for polling on the welcome page after checkout.
    """
    response = jsonify({'is_premium': current_user.is_premium})
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response
