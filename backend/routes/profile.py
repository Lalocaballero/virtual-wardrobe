import os
import requests
from flask import Blueprint, jsonify, current_app, request
from flask_login import login_required, current_user
from models import db, User, NegativePrompt

profile_bp = Blueprint('profile_bp', __name__, url_prefix='/api/profile')

@profile_bp.route('/sync-subscription', methods=['POST'])
@login_required
def sync_subscription():
    # Always get the freshest user data from the database first.
    user = User.query.get(current_user.id)
    if user and user.is_premium:
        return jsonify({'is_premium': True, 'message': 'User is already premium.'})

    api_key = os.environ.get('LEMONSQUEEZY_API_KEY')
    if not api_key:
        current_app.logger.error("LEMONSQUEEZY_API_KEY is not set.")
        return jsonify(error={'message': 'Billing is not configured.'}), 500

    try:
        email = user.email
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
        
        VALID_PREMIUM_STATUSES = {'active', 'on_trial', 'paid'}

        is_premium_on_lemon = any(
            sub.get('attributes', {}).get('status') in VALID_PREMIUM_STATUSES
            for sub in subscriptions
        )

        if is_premium_on_lemon:
            if not user.is_premium:
                user.is_premium = True
                db.session.commit()
                current_app.logger.info(f"Granted premium to {user.email} via manual sync.")
            return jsonify({'is_premium': True})
        else:
            # Explicitly return false if no active subscription was found
            return jsonify({'is_premium': False})

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Lemon Squeezy API request failed: {e}")
        return jsonify(error={'message': 'Could not connect to the billing provider.'}), 502
    except Exception as e:
        current_app.logger.error(f"Subscription sync error: {e}")
        db.session.rollback()
        return jsonify(error={'message': 'An unexpected error occurred.'}), 500
    
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