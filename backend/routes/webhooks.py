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
        # Abort, but don't reveal the specific reason to the outside world.
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
            # We can't process this, but return 200 so Lemon Squeezy doesn't retry.
            return jsonify({'status': 'success', 'message': 'Event ignored, no email.'}), 200

        user = User.query.filter_by(email=user_email).first()
        if not user:
            current_app.logger.warning(f"Webhook received for non-existent user: {user_email}")
            return jsonify({'status': 'success', 'message': 'User not found.'}), 200

        # Handle subscription events
        if event_name == 'subscription_payment_success':
            # This event is a strong indicator that the user should be premium.
            user.is_premium = True
            current_app.logger.info(f"Set user {user_email} to premium via '{event_name}' webhook.")

        elif event_name in ['subscription_created', 'subscription_updated']:
            # Only grant premium if the status is active. Ignore other statuses like 'on_trial', 'past_due', etc.
            if attributes.get('status') == 'active':
                user.is_premium = True
                current_app.logger.info(f"Set user {user_email} to premium via '{event_name}' (status: active) webhook.")
            # IMPORTANT: No 'else' block here. We don't want to downgrade users based on intermediate statuses.
        
        elif event_name in ['subscription_cancelled', 'subscription_expired']:
            user.is_premium = False
            current_app.logger.info(f"Revoked premium for user {user_email} via '{event_name}' webhook.")
        
        else:
            current_app.logger.info(f"Received and ignored unhandled Lemon Squeezy webhook event: {event_name}")

        db.session.commit()

    except json.JSONDecodeError:
        current_app.logger.error("Webhook request with invalid JSON payload.")
        abort(400)
    except Exception as e:
        current_app.logger.error(f"Error processing webhook: {e}")
        # Return a 500 error, but don't expose internal error details.
        abort(500)

    return jsonify({'status': 'success'}), 200
