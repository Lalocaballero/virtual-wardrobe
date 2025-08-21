from flask import Blueprint, jsonify, request, make_response, current_app
from sqlalchemy import text, func, case
from flask_login import current_user
from datetime import datetime, timedelta
from models import User, db, ClothingItem, AdminAction, Outfit, AppSettings
from utils.decorators import admin_required
import csv
from io import StringIO

admin_bp = Blueprint('admin_bp', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_direction = request.args.get('sort_direction', 'desc')
    email_filter = request.args.get('email', type=str)
    is_premium_filter = request.args.get('is_premium', type=str)
    is_verified_filter = request.args.get('is_verified', type=str)

    query = User.query

    if email_filter:
        query = query.filter(User.email.ilike(f'%{email_filter}%'))
    if is_premium_filter is not None:
        query = query.filter(User.is_premium == (is_premium_filter.lower() == 'true'))
    if is_verified_filter is not None:
        query = query.filter(User.is_verified == (is_verified_filter.lower() == 'true'))

    if hasattr(User, sort_by):
        if sort_direction == 'desc':
            query = query.order_by(getattr(User, sort_by).desc())
        else:
            query = query.order_by(getattr(User, sort_by).asc())

    paginated_users = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [{
            'id': user.id, 
            'email': user.email, 
            'is_admin': user.is_admin, 
            'is_premium': user.is_premium, 
            'is_verified': user.is_verified, 
            'is_suspended': user.is_suspended,
            'is_banned': user.is_banned,
            'created_at': user.created_at,
            'age': user.age,
            'gender': user.gender
        } for user in paginated_users.items],
        'total': paginated_users.total,
        'pages': paginated_users.pages,
        'current_page': page
    })

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id, 
        'email': user.email, 
        'is_admin': user.is_admin, 
        'is_premium': user.is_premium, 
        'is_verified': user.is_verified, 
        'is_suspended': user.is_suspended,
        'is_banned': user.is_banned,
        'suspension_end_date': user.suspension_end_date.isoformat() if user.suspension_end_date else None,
        'created_at': user.created_at, 
        'location': user.location, 
        'display_name': user.display_name
    })

@admin_bp.route('/users/<int:user_id>/set-premium', methods=['POST'])
@admin_required
def set_premium(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    is_premium = data.get('is_premium')
    if is_premium is None:
        return jsonify({'error': 'Missing is_premium flag'}), 400
    user.is_premium = is_premium
    db.session.commit()
    return jsonify({'message': f'User {user.email} premium status set to {user.is_premium}'})

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f'User {user.email} has been deleted.'})

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    total_users = User.query.count()
    total_items = ClothingItem.query.count()
    premium_users = User.query.filter_by(is_premium=True).count()
    return jsonify({
        'total_users': total_users,
        'total_items': total_items,
        'premium_users': premium_users
    })

@admin_bp.route('/users/<int:user_id>/suspend', methods=['POST'])
@admin_required
def suspend_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    duration_days = data.get('duration', 7)
    reason = data.get('reason', 'No reason provided.')

    user.is_suspended = True
    user.suspension_end_date = datetime.utcnow() + timedelta(days=duration_days)
    
    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=user.id,
        action_type='suspend_user',
        details=f'Suspended for {duration_days} days. Reason: {reason}'
    )
    db.session.add(admin_action)
    db.session.commit()
    
    current_app.email_service.send_suspension_email(user.email, user.suspension_end_date, reason)
    
    return jsonify({'message': f'User {user.email} has been suspended until {user.suspension_end_date}.'})

@admin_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@admin_required
def ban_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    reason = data.get('reason', 'No reason provided.')

    user.is_banned = True
    user.is_suspended = False
    user.suspension_end_date = None

    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=user.id,
        action_type='ban_user',
        details=f'Reason: {reason}'
    )
    db.session.add(admin_action)
    db.session.commit()

    current_app.email_service.send_ban_email(user.email, reason)

    return jsonify({'message': f'User {user.email} has been permanently banned.'})

@admin_bp.route('/users/<int:user_id>/unsuspend', methods=['POST'])
@admin_required
def unsuspend_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_suspended = False
    user.suspension_end_date = None
    
    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=user.id,
        action_type='unsuspend_user',
        details='User suspension has been lifted.'
    )
    db.session.add(admin_action)
    db.session.commit()
    
    return jsonify({'message': f'User {user.email} suspension has been lifted.'})

@admin_bp.route('/users/<int:user_id>/unban', methods=['POST'])
@admin_required
def unban_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_banned = False
    
    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=user.id,
        action_type='unban_user',
        details='User ban has been lifted.'
    )
    db.session.add(admin_action)
    db.session.commit()
    
    return jsonify({'message': f'User {user.email} ban has been lifted.'})

@admin_bp.route('/users/<int:user_id>/impersonate', methods=['POST'])
@admin_required
def impersonate_user(user_id):
    user_to_impersonate = User.query.get_or_404(user_id)
    
    if user_to_impersonate.is_admin:
        return jsonify({'error': 'Cannot impersonate another admin.'}), 403

    impersonation_token = user_to_impersonate.get_token(salt='impersonate-salt', expires_sec=300)
    
    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=user_to_impersonate.id,
        action_type='impersonate_user',
        details=f'Admin impersonated user for 5 minutes.'
    )
    db.session.add(admin_action)
    db.session.commit()
    
    return jsonify({'message': 'Impersonation token generated.', 'impersonation_token': impersonation_token})

@admin_bp.route('/actions/log', methods=['GET'])
@admin_required
def get_admin_log():
    logs = AdminAction.query.order_by(AdminAction.created_at.desc()).all()
    return jsonify([log.to_dict() for log in logs])


# ==================================
# NEW: Analytics & Health Endpoints
# ==================================

@admin_bp.route('/analytics/daily_active_users', methods=['GET'])
@admin_required
def get_daily_active_users():
    days = request.args.get('days', 30, type=int)
    dau_data = current_app.analytics_service.get_daily_active_users(days=days)
    return jsonify(dau_data)

@admin_bp.route('/analytics/mrr', methods=['GET'])
@admin_required
def get_mrr():
    mrr_data = current_app.analytics_service.get_mrr()
    return jsonify(mrr_data)

@admin_bp.route('/analytics/premium_conversion_rate', methods=['GET'])
@admin_required
def get_premium_conversion_rate():
    conversion_data = current_app.analytics_service.get_premium_conversion_rate()
    return jsonify(conversion_data)

@admin_bp.route('/system/health', methods=['GET'])
@admin_required
def system_health():
    # Database connectivity
    try:
        db.session.execute(text('SELECT 1'))
        db_status = 'ok'
    except Exception as e:
        db_status = f'error: {e}'

    # External Services Check
    ai_status = 'ok' if hasattr(current_app, 'ai_service') and current_app.ai_service.client_available else 'error: not configured'
    weather_status = 'ok' if hasattr(current_app, 'weather_service') and hasattr(current_app.weather_service, 'api_key') and current_app.weather_service.api_key else 'error: not configured'
    email_status = 'ok' if hasattr(current_app, 'email_service') and hasattr(current_app.email_service, 'api_key') and current_app.email_service.api_key else 'error: not configured'

    # Database Stats
    try:
        db_stats = {
            'users': User.query.count(),
            'items': ClothingItem.query.count(),
            'outfits': Outfit.query.count()
        }
    except Exception as e:
        db_stats = {'error': str(e)}

    health_status = {
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'database': db_status,
            'ai_service': ai_status,
            'weather_service': weather_status,
            'email_service': email_status
        },
        'database_stats': db_stats
    }
    return jsonify(health_status)

@admin_bp.route('/content/reported', methods=['GET'])
@admin_required
def get_reported_content():
    """
    Fetches content that has been reported (reported_count > 0) and
    has not been rejected.
    Orders by the number of reports.
    """
    reported_items = ClothingItem.query.filter(
        ClothingItem.reported_count > 0,
        ClothingItem.status != 'rejected'
    ).order_by(ClothingItem.reported_count.desc()).all()
    
    return jsonify([item.to_dict() for item in reported_items])

@admin_bp.route('/content/<int:item_id>/moderate', methods=['POST'])
@admin_required
def moderate_content(item_id):
    """
    Allows an admin to moderate a piece of content.
    Actions: 'approve', 'reject', 'delete'
    """
    item = ClothingItem.query.get_or_404(item_id)
    data = request.get_json()
    action = data.get('action')

    if not action in ['approve', 'reject', 'delete']:
        return jsonify({'error': 'Invalid action specified'}), 400

    if action == 'approve':
        item.status = 'approved'
        details = f"Approved item: {item.name} (ID: {item.id})"
    elif action == 'reject':
        item.status = 'rejected'
        details = f"Rejected item: {item.name} (ID: {item.id})"
    elif action == 'delete':
        details = f"Deleted item: {item.name} (ID: {item.id})"
        db.session.delete(item)
    
    admin_action = AdminAction(
        admin_id=current_user.id,
        target_user_id=item.user_id,
        action_type=f'moderate_content_{action}',
        details=details
    )
    db.session.add(admin_action)
    db.session.commit()

    return jsonify({'message': f"Action '{action}' performed successfully on item {item.id}."})

@admin_bp.route('/data/export', methods=['GET'])
@admin_required
def export_data():
    """
    Exports user or content data in CSV or JSON format.
    Query params:
    - format: 'csv' or 'json' (defaults to 'json')
    - data_type: 'users' or 'content' (defaults to 'users')
    """
    data_format = request.args.get('format', 'json')
    data_type = request.args.get('data_type', 'users')

    if data_type == 'users':
        records = User.query.all()
        # Exclude password hash from export
        data = [{'id': r.id, 'email': r.email, 'is_admin': r.is_admin, 'is_premium': r.is_premium, 'is_verified': r.is_verified, 'created_at': r.created_at.isoformat()} for r in records]
        filename = 'users_export'
    elif data_type == 'content':
        records = ClothingItem.query.all()
        data = [r.to_dict() for r in records]
        filename = 'content_export'
    else:
        return jsonify({'error': 'Invalid data_type specified'}), 400

    if data_format == 'json':
        response = jsonify(data)
        response.headers['Content-Disposition'] = f'attachment; filename={filename}.json'
        return response
    elif data_format == 'csv':
        if not data:
            return "No data to export", 200

        si = StringIO()
        cw = csv.DictWriter(si, fieldnames=data[0].keys())
        cw.writeheader()
        cw.writerows(data)
        
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = f"attachment; filename={filename}.csv"
        output.headers["Content-type"] = "text/csv"
        return output
    else:
        return jsonify({'error': 'Invalid format specified'}), 400

@admin_bp.route('/settings', methods=['GET'])
@admin_required
def get_app_settings():
    settings_query = AppSettings.query.all()
    settings = {setting.key: setting.value for setting in settings_query}

    # Ensure a default monetization setting exists and is a proper boolean
    if 'monetization_enabled' not in settings:
        # Save the default in the new, robust object format
        default_setting = AppSettings(key='monetization_enabled', value={'enabled': False})
        db.session.add(default_setting)
        db.session.commit()
        settings['monetization_enabled'] = False # Return the raw boolean
    else:
        # Extract the boolean from the stored object, with a fallback
        if isinstance(settings['monetization_enabled'], dict):
            settings['monetization_enabled'] = settings['monetization_enabled'].get('enabled', False)
        else:
            # Fallback for old data that might be a raw boolean
            settings['monetization_enabled'] = bool(settings['monetization_enabled'])

    return jsonify(settings)

@admin_bp.route('/settings', methods=['POST'])
@admin_required
def update_app_setting():
    data = request.get_json()
    key = data.get('key')
    value = data.get('value')

    if not key:
        return jsonify({'error': 'Key is required'}), 400
    
    final_value = value
    # For the monetization toggle, be explicit and store as a JSON object
    if key == 'monetization_enabled':
        if not isinstance(value, bool):
            return jsonify({'error': 'Invalid value for monetization_enabled, boolean required.'}), 400
        final_value = {'enabled': value}

    setting = AppSettings.query.filter_by(key=key).first()

    if setting:
        setting.value = final_value
    else:
        setting = AppSettings(key=key, value=final_value)
        db.session.add(setting)
    
    db.session.commit()
    
    # Return the raw value for confirmation, not the stored object
    return jsonify({setting.key: value})

@admin_bp.route('/analytics/user_demographics', methods=['GET'])
@admin_required
def get_user_demographics():
    # Gender distribution
    gender_dist = db.session.query(
        User.gender, 
        func.count(User.id)
    ).group_by(User.gender).all()
    
    gender_data = [{'name': gender if gender else 'Not Set', 'value': count} for gender, count in gender_dist]

    # Age distribution
    age_brackets = [
        ('0-17', (0, 17)),
        ('18-24', (18, 24)),
        ('25-34', (25, 34)),
        ('35-44', (35, 44)),
        ('45-54', (45, 54)),
        ('55-64', (55, 64)),
        ('65+', (65, 999))
    ]
    
    age_case_statement = case(
        *[
            (User.age.between(low, high), label)
            for label, (low, high) in age_brackets
        ],
        else_='Not Set'
    )
    
    age_dist = db.session.query(
        age_case_statement,
        func.count(User.id)
    ).group_by(age_case_statement).order_by(age_case_statement).all()

    age_data = [{'name': age_bracket, 'value': count} for age_bracket, count in age_dist]

    return jsonify({
        'gender_distribution': gender_data,
        'age_distribution': age_data
    })
