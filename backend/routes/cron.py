# routes/cron.py
import os
from flask import Blueprint, request, jsonify, current_app
from utils.scheduler_jobs import run_daily_jobs # We will create this next

cron_bp = Blueprint('cron_bp', __name__, url_prefix='/api/cron')

@cron_bp.route('/trigger', methods=['POST'])
def trigger_cron_jobs():
    # This is a simple way to secure your endpoint.
    # The external service must send this secret key to run the jobs.
    secret = request.headers.get('Authorization')
    expected_secret = os.environ.get('CRON_SECRET_KEY')

    if not expected_secret or secret != f'Bearer {expected_secret}':
        return jsonify(error='Unauthorized'), 401

    # Run the jobs
    result = run_daily_jobs(current_app._get_current_object())
    current_app.logger.info(f"Cron jobs triggered successfully. Result: {result}")
    return jsonify(status='success', message=result)
