import os
import hmac
import hashlib
import json
from flask import Blueprint, request, jsonify, current_app, abort
from models import db, User

webhooks_bp = Blueprint('webhooks_bp', __name__, url_prefix='/api/webhooks')

@webhooks_bp.route('/lemonsqueezy', methods=['POST'])
def lemonsqueezy_webhook():
    secret = os.environ.get('LEMONSQUEEZY_WEBHOOK_SECRET')
    if not secret:
        current_app.logger.error("LEMONSQUEEZY_WEBHOOK_SECRET is not set.")
        abort(400)

    # Verify the signature
    signature = request.headers.get('X-Signature')
    if not signature:
        current_app.logger.warning("Webhook request missing X-Signature header.")
        abort(400)

    # Compute the expected signature
    payload = request.get_data()
    digest = hmac.new(secret.encode('utf-8'), payload, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(digest, signature):
        current_app.logger.warning("Webhook request with invalid signature.")
        abort(400)

    # If signature is valid, process the payload
    try:
        data = json.loads(payload)
        meta = data.get('meta', {})
        event_name = meta.get('event_name')
        attributes = data.get('data', {}).get('attributes', {})
        
        if not event_name or not attributes:
            current_app.logger.warning("Webhook payload missing 'meta' or 'data.attributes'.")
            abort(400)

        user_email = attributes.get('user_email')
        if not user_email:
            current_app.logger.warning(f"Webhook event '{event_name}' missing user_email.")
            return jsonify({'status': 'success', 'message': 'Event ignored, no email.'}), 200

        user = User.query.filter_by(email=user_email).first()
        if not user:
            current_app.logger.warning(f"Webhook received for non-existent user: {user_email}")
            return jsonify({'status': 'success', 'message': 'User not found.'}), 200

        # Define which subscription statuses should grant premium access
        VALID_PREMIUM_STATUSES = {'active', 'on_trial'}
        
        # Determine if this event should grant premium status
        should_grant_premium = (
            event_name == 'subscription_payment_success' or
            (event_name in ['subscription_created', 'subscription_updated'] and attributes.get('status') in VALID_PREMIUM_STATUSES)
        )

        if should_grant_premium:
            # Only perform the update if the user is not already premium to avoid redundant operations
            if not user.is_premium:
                user.is_premium = True
                
                # Initialize user.settings if it's null
                if user.settings is None:
                    user.settings = {}
                
                # Set the 'premium_activated' flag in the user's settings JSON field
                user.settings['premium_activated'] = True
                
                # Mark the user object as modified to ensure the JSON change is saved
                db.session.add(user)
                
                current_app.logger.info(f"Set user {user.email} to premium and flagged 'premium_activated' in settings.")
        
        elif event_name in ['subscription_cancelled', 'subscription_expired']:
            user.is_premium = False
            
            # Clean up the flag from settings if it exists
            if user.settings and 'premium_activated' in user.settings:
                user.settings.pop('premium_activated')
                db.session.add(user)

            current_app.logger.info(f"Revoked premium for user {user.email} via '{event_name}' webhook.")
        
        else:
            current_app.logger.info(f"Received and ignored unhandled Lemon Squeezy webhook event: {event_name}")

        db.session.commit()

    except json.JSONDecodeError:
        current_app.logger.error("Webhook request with invalid JSON payload.")
        abort(400)
    except Exception as e:
        db.session.rollback() # Rollback the session in case of any errors
        current_app.logger.error(f"Error processing webhook: {e}")
        abort(500)

    return jsonify({'status': 'success'}), 200