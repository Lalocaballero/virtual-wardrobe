import os
import stripe
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from models import db, User

billing_bp = Blueprint('billing_bp', __name__, url_prefix='/api/billing')

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

@billing_bp.route('/create-checkout-session', methods=['POST'])
@login_required
def create_checkout_session():
    price_id = os.environ.get('STRIPE_PRICE_ID')
    if not price_id:
        current_app.logger.error("STRIPE_PRICE_ID environment variable is not set.")
        return jsonify(error={'message': 'The server is not configured for billing. Missing STRIPE_PRICE_ID.'}), 500

    try:
        user = current_user
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.display_name
            )
            user.stripe_customer_id = customer.id
            db.session.commit()

        # Get success and cancel URLs from frontend, with defaults
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        success_url = request.json.get('success_url', f'{frontend_url}/profile?stripe_success=true')
        cancel_url = request.json.get('cancel_url', f'{frontend_url}/profile?stripe_cancel=true')

        checkout_session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            allow_promotion_codes=True,
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return jsonify({'id': checkout_session.id})
    except Exception as e:
        current_app.logger.error(f"Stripe checkout session error: {e}")
        return jsonify(error={'message': str(e)}), 500

@billing_bp.route('/stripe-webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        # Invalid payload
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return 'Invalid signature', 400

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            user.is_premium = True
            user.stripe_subscription_id = subscription_id
            db.session.commit()

    if event['type'] == 'customer.subscription.deleted':
        session = event['data']['object']
        customer_id = session.get('customer')
        user = User.query.filter_by(stripe_customer_id=customer_id).first()
        if user:
            user.is_premium = False
            user.stripe_subscription_id = None
            db.session.commit()

    return jsonify({'status': 'success'})
