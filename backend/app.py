import os

from flask import Flask, request, jsonify, send_from_directory, session, current_app, make_response, redirect, g
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_migrate import Migrate
from flask_socketio import SocketIO
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from urllib.parse import urlparse
from datetime import datetime, timedelta
from collections import Counter
import json
import traceback
import uuid
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Import db, User, ClothingItem, Outfit from models.
from models import db, User, ClothingItem, Outfit, UserActivity, Notification
from utils.auth import get_actual_user
from sqlalchemy.orm import selectinload
from utils.limiter import limiter, get_user_specific_limit

# Initialize extensions globally
login_manager = LoginManager()
socketio = SocketIO()
migrate = Migrate()

def create_app():
    print("--- [1] STARTING APP FACTORY ---")
    app = Flask(__name__)

    # --- Application Configuration ---
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a_fallback_secret_key_for_dev_only')
    app.config['UPLOAD_FOLDER'] = 'uploads'

    # --- Session Configuration (CRITICAL for Cross-Site HTTPS) ---
    # Default to production/secure settings. Only use relaxed settings if FLASK_ENV is explicitly 'development'.
    # This is safer for deployed environments where FLASK_ENV might not be set.
    is_development = os.environ.get('FLASK_ENV') == 'development'

    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

    if is_development:
        print("INFO: Configuring session for DEVELOPMENT environment.")
        app.config['SESSION_COOKIE_SECURE'] = False
        app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    else:
        print("INFO: Configuring session for PRODUCTION environment.")
        app.config['SESSION_COOKIE_SECURE'] = True
        app.config['SESSION_COOKIE_SAMESITE'] = 'None' # Necessary for cross-domain requests over HTTPS
        
        # Set cookie domain for cross-subdomain authentication
        session_domain = os.environ.get('SESSION_COOKIE_DOMAIN')
        if session_domain:
            app.config['SESSION_COOKIE_DOMAIN'] = session_domain
            print(f"INFO: Session cookie domain set to '{session_domain}'")

    @app.before_request
    def make_session_permanent():
        session.permanent = True
        
    @app.before_request
    def before_request_impersonation():
        g.user = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user = User.verify_token(token, salt='impersonate-salt')
            if user:
                g.user = user

    print("--- Session Cookie Configuration ---")
    print(f"Production mode: {not is_development}")
    print(f"SESSION_COOKIE_SECURE: {app.config['SESSION_COOKIE_SECURE']}")
    print(f"SESSION_COOKIE_SAMESITE: '{app.config['SESSION_COOKIE_SAMESITE']}'")
    print("------------------------------------")


    # --- Database configuration ---
    try:
        database_url = os.environ.get('DATABASE_URL')
        if database_url:
            if database_url.startswith('postgres://'):
                database_url = database_url.replace('postgres://', 'postgresql://', 1)
            app.config['SQLALCHEMY_DATABASE_URI'] = database_url
            if app.debug:
                print("✅ PostgreSQL database configured")
        else:
            local_db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'wardrobe.db')
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + local_db_path
            print(f"✅ SQLite database configured for local development at: {local_db_path}")
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    except Exception as e:
        if app.debug:
            print(f"⚠️ Database configuration error: {e}")
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wardrobe.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions with the app instance
    print("--- [2] CONFIGURING DATABASE ---")
    db.init_app(app)
    migrate.init_app(app, db)
    print("--- [3] DATABASE CONFIGURED ---")
    print("--- [4] INITIALIZING EXTENSIONS (LOGIN, LIMITER) ---")
    login_manager.init_app(app)
    limiter.init_app(app)
    print("--- [5] EXTENSIONS INITIALIZED ---")
    login_manager.session_protection = "strong"

    @app.teardown_appcontext
    def shutdown_session(exception=None):
          db.session.remove()
        
    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "Unauthorized: Please log in to access this resource."}), 401

    # --- CORS Configuration ---
    origins = [
        "https://wewear.app",
        "https://api.wewear.app",
        "https://virtual-wardrobe-frontend-qvoh.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    CORS(app,
         origins=origins,
         supports_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])

    print("--- [6] CONFIGURING SOCKET.IO ---")
    socketio.init_app(
        app, 
        cors_allowed_origins=origins,
        async_mode='eventlet',
        ping_timeout=60,
        ping_interval=25,
        logger=True if app.debug else False,
        engineio_logger=True if app.debug else False,
        # Allow both polling and websocket, let the client upgrade
        transports=['polling', 'websocket']
    )
    print("--- [7] SOCKET.IO CONFIGURED ---")

    if app.debug:
        print(f"CORS configured with origins: {origins}")

    # --- Cloudinary Configuration ---
    # This is the new, more robust configuration block.
    cloudinary_url = os.environ.get('CLOUDINARY_URL')
    if cloudinary_url:
        print("✅ CLOUDINARY_URL found, configuring...")
        try:
            # Parse the URL to extract the components
            parsed_url = urlparse(cloudinary_url)
            cloudinary.config(
                cloud_name = parsed_url.hostname,
                api_key = parsed_url.username,
                api_secret = parsed_url.password,
                secure=True
            )
            print("✅ Cloudinary configured successfully!")
        except Exception as e:
            print(f"⚠️ Failed to configure Cloudinary from URL: {e}")
    else:
        print("⚠️ CLOUDINARY_URL environment variable not found. Image uploads will fail.")    

    @socketio.on('connect')
    def handle_connect():
        if current_user.is_authenticated:
            from flask_socketio import join_room
            join_room(str(current_user.id))
            current_app.logger.info(f"SocketIO: Client connected and joined room: {current_user.id}")

    @socketio.on('disconnect')
    def handle_disconnect():
        if current_user.is_authenticated:
            from flask_socketio import leave_room
            leave_room(str(current_user.id))
            current_app.logger.info(f"SocketIO: Client disconnected and left room: {current_user.id}")

    # --- Initialize services ---
    print("--- [8] REGISTERING BLUEPRINTS ---")
    from routes.admin import admin_bp
    app.register_blueprint(admin_bp)

    from routes.trips import trips_bp
    app.register_blueprint(trips_bp)

    from routes.laundry import laundry_bp
    app.register_blueprint(laundry_bp)

    from routes.notifications import notifications_bp
    app.register_blueprint(notifications_bp)

    from routes.profile import profile_bp
    app.register_blueprint(profile_bp)

    from routes.billing import billing_bp
    app.register_blueprint(billing_bp)

    from routes.webhooks import webhooks_bp
    app.register_blueprint(webhooks_bp)
    print("--- [9] BLUEPRINTS REGISTERED ---")

    from utils.ai_service import AIOutfitService
    from utils.weather_service import WeatherService
    from utils.laundry_service import LaundryIntelligenceService
    from utils.wardrobe_intelligence import WardrobeIntelligenceService, AnalyticsService
    from utils.email_service import EmailService
    from utils.scheduler import init_scheduler

    app.ai_service = AIOutfitService(os.environ.get('OPENAI_API_KEY'))
    app.weather_service = WeatherService(os.environ.get('WEATHER_API_KEY'))
    app.laundry_service = LaundryIntelligenceService()
    app.email_service = EmailService(os.environ.get('BREVO_API_KEY'))
    app.wardrobe_intelligence_service = WardrobeIntelligenceService()
    app.analytics_service = AnalyticsService()

    # Initialize and start the scheduler
    print("--- [10] INITIALIZING SCHEDULER ---")
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        with app.app_context():
            init_scheduler(app)
    print("--- [11] SCHEDULER INITIALIZED ---")
    print("--- [12] APP CREATION COMPLETE ---")

    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    except Exception as e:
        if app.debug:
            print(f"Error creating upload folder: {e}")

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ======================
    # BASIC ROUTES
    # ======================

    @app.route('/')
    def home():
        return jsonify({'message': 'Virtual Wardrobe API is running!', 'status': 'ok'})

    @app.route('/api/')
    def api_root():
        return jsonify({'message': 'Virtual Wardrobe API', 'status': 'ok', 'version': '1.0'})

    @app.route('/api/test', methods=['GET'])
    def test():
        return jsonify({
            'message': 'Backend is working!', 
            'timestamp': datetime.now().isoformat(),
            'status': 'ok'
        })

    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'}), 200

    @app.route('/api/db-status', methods=['GET'])
    def db_status():
        try:
            db.engine.connect()
            try:
                users_count = User.query.count()
                tables_exist = True
            except:
                users_count = 0
                tables_exist = False
            return jsonify({
                'database_connected': True,
                'tables_exist': tables_exist,
                'users_count': users_count,
                'database_type': 'PostgreSQL' if 'postgresql' in str(db.engine.url) else 'SQLite'
            })
        except Exception as e:
            return jsonify({
                'database_connected': False,
                'error': str(e),
                'database_type': 'Unknown'
            }), 500

    @app.route('/api/init-db', methods=['POST'])
    def init_database():
        try:
            if app.debug:
                print("🔄 Initializing database tables...")
            with app.app_context():
                db.create_all()
            with app.app_context():
                users_count = User.query.count()
                items_count = ClothingItem.query.count()
                outfits_count = Outfit.query.count()
            if app.debug:
                print("✅ Database initialized successfully!")
            return jsonify({
                'success': True,
                'message': 'Database initialized successfully!',
                'tables_created': True,
                'users': users_count,
                'items': items_count,
                'outfits': outfits_count
            })
        except Exception as e:
            if app.debug:
                print(f"❌ Database initialization failed: {e}")
            return jsonify({
                'success': False,
                'error': str(e),
                'message': 'Database initialization failed'
            }), 500

    @app.route('/api/check-auth', methods=['GET'])
    def check_auth():
        user = get_actual_user()
        if user and user.is_authenticated:
            return jsonify({
                'authenticated': True,
                'user_id': user.id,
                'email': user.email,
                'is_admin': user.is_admin
            })
        else:
            # Check for session-based user if no impersonation
            if not g.user and current_user.is_authenticated:
                 return jsonify({
                    'authenticated': True,
                    'user_id': current_user.id,
                    'email': current_user.email,
                    'is_admin': current_user.is_admin
                })
            return jsonify({'authenticated': False}), 401

    # ======================
    # AUTHENTICATION ROUTES
    # ======================

    @app.route('/api/register', methods=['POST'])
    def register():
        try:
            session.clear() # Ensure no previous session data leaks
            if app.debug:
                print("=== REGISTRATION REQUEST ===")
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            email = data.get('email')
            password = data.get('password')
            location = data.get('location', '')
            if not email or not password:
                return jsonify({'error': 'Email and password are required'}), 400
            
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return jsonify({'error': 'Email already exists'}), 400
                
            user = User(
                email=email,
                password_hash=generate_password_hash(password),
                location=location
            )
            db.session.add(user)
            db.session.commit()

            try:
                token = user.get_token(salt='email-verification-salt', expires_sec=86400) # 24 hours
                current_app.email_service.send_verification_email(user.email, token)
            except Exception as e:
                if app.debug:
                    print(f"Email sending failed after registration for {user.email}: {e}")
                # Don't block registration if email fails. User can request another verification email.
            
            return jsonify({
                'message': 'User created successfully. Please check your email to verify your account.', 
                'user_id': user.id,
                'email': user.email
            }), 201

        except Exception as e:
            if app.debug:
                print(f"Registration error: {str(e)}")
                traceback.print_exc()
            db.session.rollback()
            return jsonify({'error': f'Registration failed: {str(e)}'}), 500

    @app.route('/api/verify-email', methods=['GET'])
    def verify_email():
        token = request.args.get('token')
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

        if not token:
            # Redirect to a frontend page that can display the error
            return redirect(f"{frontend_url}/verify-email?status=invalid_token")

        user = User.verify_token(token, salt='email-verification-salt', max_age=86400)
        
        if not user:
            return redirect(f"{frontend_url}/verify-email?status=invalid_token")
            
        if user.is_verified:
            return redirect(f"{frontend_url}/verify-email?status=already_verified")

        user.is_verified = True
        db.session.commit()
        
        return redirect(f"{frontend_url}/verify-email?status=verified")

    @app.route('/api/resend-verification', methods=['POST'])
    def resend_verification():
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        user = User.query.filter_by(email=email).first()
        if user:
            if user.is_verified:
                return jsonify({'message': 'This account has already been verified.'}), 400
            
            try:
                token = user.get_token(salt='email-verification-salt', expires_sec=86400)
                current_app.email_service.send_verification_email(user.email, token)
            except Exception as e:
                if app.debug:
                    print(f"Resend verification email failed for {user.email}: {e}")
                # Do not reveal that the email failed.
        
        # Always return a success message to prevent user enumeration.
        return jsonify({'message': 'If an account with that email exists and is not verified, a new verification link has been sent.'})

    @app.route('/api/login', methods=['POST'])
    def login():
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            email = data.get('email')
            password = data.get('password')
            if not email or not password:
                return jsonify({'error': 'Email and password are required'}), 400
            user = User.query.filter_by(email=email).first()
            if user and check_password_hash(user.password_hash, password):
                
                if not user.is_verified:
                    return jsonify({'error': 'Please verify your email to log in.', 'code': 'EMAIL_NOT_VERIFIED'}), 403
                
                if user.is_banned:
                    return jsonify({'error': 'This account has been permanently banned.'}), 403
                
                if user.is_suspended:
                    if user.suspension_end_date and user.suspension_end_date > datetime.utcnow():
                        return jsonify({'error': f"This account is suspended until {user.suspension_end_date.strftime('%B %d, %Y')}"}), 403
                    else:
                        user.is_suspended = False
                        db.session.commit()

                session.clear() 
                session.permanent = True 
                login_user(user, remember=True)
                session['user_id'] = user.id 
                session['logged_in'] = True

                # Record user activity
                user.last_login_at = datetime.utcnow()
                activity = UserActivity(user_id=user.id)
                db.session.add(activity)
                db.session.commit()
                
                response = jsonify({
                    'message': 'Login successful', 
                    'user_id': user.id,
                    'email': user.email,
                'is_admin': user.is_admin,
                    'session_id': session.get('_id', 'generated')
                })
                return response
            return jsonify({'error': 'Invalid credentials'}), 401
        except Exception as e:
            if app.debug:
                print(f"Login error: {str(e)}")
            return jsonify({'error': f'Login failed: {str(e)}'}), 500

    @app.route('/api/forgot-password', methods=['POST'])
    def forgot_password():
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        if user:
            try:
                token = user.get_token(salt='password-reset-salt', expires_sec=1800) # 30 minutes
                current_app.email_service.send_password_reset_email(user.email, token)
            except Exception as e:
                if app.debug:
                    print(f"Password reset email failed for {user.email}: {e}")
                # Don't reveal that the email failed to send.
        
        # Always return a success message to prevent user enumeration.
        return jsonify({'message': 'If an account with that email exists, a password reset link has been sent.'})

    @app.route('/api/reset-password', methods=['POST'])
    def reset_password():
        data = request.get_json()
        token = data.get('token')
        password = data.get('password')

        if not token or not password:
            return jsonify({'error': 'Token and new password are required'}), 400

        user = User.verify_token(token, salt='password-reset-salt', max_age=1800)
        
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 400
            
        user.password_hash = generate_password_hash(password)
        db.session.commit()
        
        return jsonify({'message': 'Your password has been successfully updated.'})

    @app.route('/api/logout', methods=['POST'])
    @login_required # Keep this decorator
    def logout():
        try:
            # Logout should always act on the session user, not the impersonated one.
            if current_user.is_authenticated:
                logout_user()
            session.clear()
            response = jsonify({'message': 'Logged out successfully'})
            return response
        except Exception as e:
            if app.debug:
                print(f"Logout error: {str(e)}")
            return jsonify({'error': 'Logout failed'}), 500
        
    # ======================
    # USER PROFILE ROUTES
    # ======================

    @app.route('/api/profile', methods=['GET'])
    @login_required
    def get_profile():
        """Fetches all profile data for the currently logged-in user."""
        user = get_actual_user()
        try:
            profile_data = {
                'id': user.id,
                'email': user.email,
                'is_admin': user.is_admin,
                'is_premium': user.is_premium,
                'display_name': user.display_name,
                'profile_image_url': user.profile_image_url,
                'location': user.location,
                'age': user.age,
                'gender': user.gender,
                'laundry_thresholds': user.get_laundry_thresholds(),
                'notification_settings': user.get_notification_settings(),
                'theme': (user.settings or {}).get('theme', 'light')
            }

            return jsonify(profile_data)
            
        except Exception as e:
            traceback.print_exc()
            return jsonify({'error': 'Failed to fetch profile data.'}), 500

    @app.route('/api/profile/stats', methods=['GET'])
    @login_required
    def get_profile_stats():
        """Fetches wardrobe statistics for the currently logged-in user."""
        user = get_actual_user()
        try:
            total_items = ClothingItem.query.filter_by(user_id=user.id).count()
            total_outfits = Outfit.query.filter_by(user_id=user.id).count()
            items_never_worn = ClothingItem.query.filter_by(user_id=user.id, outfits=None).count()

            wardrobe_stats = {
                'total_items': total_items,
                'total_outfits': total_outfits,
                'items_never_worn': items_never_worn
            }
            return jsonify(wardrobe_stats)
        except Exception as e:
            traceback.print_exc()
            return jsonify({'error': 'Failed to fetch wardrobe stats.'}), 500

    @app.route('/api/profile', methods=['PUT'])
    @login_required
    def update_profile():
        """Updates the profile data for the currently logged-in user."""
        try:
            user = get_actual_user()
            data = request.get_json()

            # Update basic fields
            user.display_name = data.get('display_name', user.display_name)
            user.profile_image_url = data.get('profile_image_url', user.profile_image_url)
            user.location = data.get('location', user.location)
            user.age = data.get('age', user.age)
            user.gender = data.get('gender', user.gender)
            
            # Handle all nested settings
            settings_changed = False
            if user.settings is None:
                user.settings = {}
                
            if 'laundry_thresholds' in data:
                user.settings['laundry_thresholds'] = data['laundry_thresholds']
                settings_changed = True
                
            if 'theme' in data:
                user.settings['theme'] = data.get('theme')
                settings_changed = True
            
            if 'notification_settings' in data:
                user.settings['notification_settings'] = data['notification_settings']
                settings_changed = True

            if settings_changed:
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(user, "settings")
            
            # Create a notification for the user
            notification = Notification(
                user_id=user.id,
                message="Your profile has been updated successfully.",
                link="/dashboard/profile"
            )
            db.session.add(notification)
            db.session.flush() # Flush to get the notification ID before committing

            socketio.emit('new_notification', {'message': notification.message, 'link': notification.link}, room=str(user.id))

            db.session.commit()
            return jsonify({'message': 'Profile updated successfully!'})

        except Exception as e:
            db.session.rollback()
            if app.debug:
                print(f"Update profile error: {str(e)}")
            return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500


    @app.route('/api/profile/change-password', methods=['POST'])
    @login_required
    def change_password():
        """Changes the password for the currently logged-in user."""
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password:
            return jsonify({'error': 'Current and new passwords are required.'}), 400
        
        user = get_actual_user()

        if not check_password_hash(user.password_hash, current_password):
            return jsonify({'error': 'Your current password does not match.'}), 401

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({'message': 'Password changed successfully!'})


    @app.route('/api/profile/export-data', methods=['GET'])
    @login_required
    def export_data():
        """Generates and returns a JSON file of all the user's data."""
        user = get_actual_user()
        items = ClothingItem.query.filter_by(user_id=user.id).all()
        outfits = Outfit.query.filter_by(user_id=user.id).all()
        
        data_export = {
            "user_email": user.email,
            "export_date": datetime.utcnow().isoformat(),
            "profile_settings": user.settings,
            "wardrobe_items": [item.to_dict() for item in items],
            "outfit_history": [outfit.to_dict() for outfit in outfits]
        }
        
        response = jsonify(data_export)
        response.headers['Content-Disposition'] = f'attachment; filename=wewear_export_{user.id}_{datetime.utcnow().strftime("%Y%m%d")}.json'
        return response


    @app.route('/api/profile/delete-account', methods=['POST'])
    @login_required
    def delete_account():
        """Deletes the account for the currently logged-in user."""
        data = request.get_json()
        password = data.get('password')

        if not password:
            return jsonify({'error': 'Password is required to delete your account.'}), 400

        user = get_actual_user()
        
        if not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Incorrect password.'}), 401

        try:
            user_to_delete = User.query.get(user.id)
            if user_to_delete:
                # Manually delete related items first if cascade is not fully trusted
                Outfit.query.filter_by(user_id=user_to_delete.id).delete()
                ClothingItem.query.filter_by(user_id=user_to_delete.id).delete()
                
                db.session.delete(user_to_delete)
                db.session.commit()
                logout_user()
                return jsonify({'message': 'Your account and all associated data have been permanently deleted.'})
            else:
                return jsonify({'error': 'User not found.'}), 404
                
        except Exception as e:
            db.session.rollback()
            if app.debug:
                print(f"Delete account error: {str(e)}")
            return jsonify({'error': f'Failed to delete account: {str(e)}'}), 500


    @app.route('/api/profile/reset-outfit-history', methods=['POST'])
    @login_required
    def reset_outfit_history():
        """Deletes all outfit history for the currently logged-in user."""
        try:
            user = get_actual_user()
            # Use bulk delete for efficiency
            Outfit.query.filter_by(user_id=user.id).delete()
            db.session.commit()
            return jsonify({'message': 'Your outfit history and AI personalization have been successfully reset.'})
        except Exception as e:
            db.session.rollback()
            if app.debug:
                print(f"Reset outfit history error: {str(e)}")
            return jsonify({'error': f'Failed to reset outfit history: {str(e)}'}), 500
        
    # ======================
    # WARDROBE ROUTES
    # ======================

    @app.route('/api/add-item', methods=['POST'])
    @login_required
    def add_clothing_item():
        try:
            user = get_actual_user()
            data = request.get_json()

            # --- Validation for mandatory fields ---
            required_fields = ['name', 'type', 'color', 'style']
            for field in required_fields:
                if not data.get(field) or not data.get(field).strip():
                    return jsonify({'error': f'The "{field}" field is required and cannot be empty.'}), 400
            
            purchase_date_str = data.get('purchase_date')
            purchase_date = None
            if purchase_date_str:
                try:
                    purchase_date = datetime.fromisoformat(purchase_date_str.replace('Z', '+00:00'))
                except (ValueError, TypeError):
                    purchase_date = None

            cost = data.get('purchase_cost')
            purchase_cost = float(cost) if cost is not None and cost != '' else None

            item = ClothingItem(
                user_id=user.id,
                name=data['name'],
                type=data['type'],
                style=data['style'],
                color=data['color'],
                pattern=data.get('pattern'),
                fit=data.get('fit'),
                season=data.get('season', 'all'),
                fabric=data.get('fabric', ''),
                mood_tags=json.dumps(data.get('mood_tags', [])),
                brand=data.get('brand', ''),
                condition=data.get('condition', 'good'),
                is_clean=data.get('is_clean', True),
                image_url=data.get('image_url', ''),
                custom_tags=json.dumps(data.get('custom_tags', [])),
                # New fields
                purchase_date=purchase_date,
                purchase_cost=purchase_cost,
                care_instructions=json.dumps(data.get('care_instructions', {})),
                wash_temperature=data.get('wash_temperature'),
                dry_clean_only=data.get('dry_clean_only', False),
                needs_repair=data.get('needs_repair', False),
                repair_notes=data.get('repair_notes'),
                retirement_candidate=data.get('retirement_candidate', False)
            )
            db.session.add(item)
            db.session.commit()
            return jsonify({'message': 'Item added successfully', 'item': item.to_dict()})
        except Exception as e:
            if app.debug:
                print(f"Add item error: {str(e)}")
            db.session.rollback()
            return jsonify({'error': f'Failed to add item: {str(e)}'}), 500

    @app.route('/api/get-wardrobe', methods=['GET'])
    @login_required
    def get_wardrobe():
        try:
            user = get_actual_user()
            items = ClothingItem.query.options(selectinload(ClothingItem.owner)).filter_by(user_id=user.id).all()
            return jsonify({'items': [item.to_dict() for item in items]})
        except Exception as e:
            if app.debug:
                print(f"Get wardrobe error: {str(e)}")
            return jsonify({'error': f'Failed to get wardrobe: {str(e)}'}), 500

    @app.route('/api/update-item/<int:item_id>', methods=['PUT'])
    @login_required
    def update_clothing_item(item_id):
        try:
            user = get_actual_user()
            item = ClothingItem.query.get(item_id)
            if not item or item.user_id != user.id:
                return jsonify({'error': 'Item not found'}), 404
            data = request.get_json()

            # --- Validation for mandatory fields ---
            # Ensure mandatory fields are not updated to be empty
            for field in ['name', 'type', 'color', 'style']:
                if field in data and (data[field] is None or not str(data[field]).strip()):
                    return jsonify({'error': f'The "{field}" field cannot be empty.'}), 400

            item.name = data.get('name', item.name)
            item.type = data.get('type', item.type)
            item.style = data.get('style', item.style)
            item.color = data.get('color', item.color)
            item.pattern = data.get('pattern', item.pattern)
            item.fit = data.get('fit', item.fit)
            item.season = data.get('season', item.season)
            item.fabric = data.get('fabric', item.fabric)
            item.mood_tags = json.dumps(data.get('mood_tags', json.loads(item.mood_tags or '[]')))
            item.brand = data.get('brand', item.brand)
            item.condition = data.get('condition', item.condition)
            item.is_clean = data.get('is_clean', item.is_clean)
            item.custom_tags = json.dumps(data.get('custom_tags', json.loads(item.custom_tags or '[]')))
            if 'image_url' in data:
                item.image_url = data['image_url']

            # Update new fields
            if 'purchase_date' in data:
                purchase_date_str = data.get('purchase_date')
                if purchase_date_str:
                    try:
                        item.purchase_date = datetime.fromisoformat(purchase_date_str.replace('Z', '+00:00'))
                    except (ValueError, TypeError):
                        item.purchase_date = None
                else:
                    item.purchase_date = None
            
            cost = data.get('purchase_cost')
            if 'purchase_cost' in data:
                # Allow setting cost to null/0
                item.purchase_cost = float(cost) if cost is not None and cost != '' else None


            if 'care_instructions' in data:
                item.care_instructions = json.dumps(data.get('care_instructions', {}))
            
            if 'wash_temperature' in data:
                item.wash_temperature = data.get('wash_temperature')

            if 'dry_clean_only' in data:
                item.dry_clean_only = data.get('dry_clean_only', False)

            if 'needs_repair' in data:
                item.needs_repair = data.get('needs_repair', False)

            if 'repair_notes' in data:
                item.repair_notes = data.get('repair_notes')

            if 'retirement_candidate' in data:
                item.retirement_candidate = data.get('retirement_candidate', False)

            db.session.commit()
            return jsonify({'message': 'Item updated successfully', 'item': item.to_dict()})
        except Exception as e:
            if app.debug:
                print(f"Update item error: {str(e)}")
            db.session.rollback()
            return jsonify({'error': f'Failed to update item: {str(e)}'}), 500

    @app.route('/api/delete-item/<int:item_id>', methods=['DELETE'])
    @login_required
    def delete_clothing_item(item_id):
        try:
            user = get_actual_user()
            item = ClothingItem.query.get(item_id)
            if not item or item.user_id != user.id:
                return jsonify({'error': 'Item not found'}), 404
            if item.image_url and not item.image_url.startswith('http'):
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], os.path.basename(item.image_url))
                if os.path.exists(image_path):
                    try:
                        os.remove(image_path)
                    except:
                        pass
            db.session.delete(item)
            db.session.commit()
            return jsonify({'message': 'Item deleted successfully'})
        except Exception as e:
            if app.debug:
                print(f"Delete item error: {str(e)}")
            db.session.rollback()
            return jsonify({'error': f'Failed to delete item: {str(e)}'}), 500

    @app.route('/api/toggle-clean/<int:item_id>', methods=['PATCH'])
    @login_required
    def toggle_item_clean_status(item_id):
        try:
            user = get_actual_user()
            item = ClothingItem.query.get(item_id)
            if not item or item.user_id != user.id:
                return jsonify({'error': 'Item not found'}), 404
            status_cycle = ['clean', 'dirty', 'in_laundry', 'drying']
            current_index = status_cycle.index(item.laundry_status) if item.laundry_status in status_cycle else 0
            next_index = (current_index + 1) % len(status_cycle)
            item.laundry_status = status_cycle[next_index]
            if item.laundry_status == 'clean':
                item.is_clean = True
                item.needs_washing = False
                item.wash_urgency = 'none'
            elif item.laundry_status == 'dirty':
                item.is_clean = False
                item.needs_washing = True
            db.session.commit()
            return jsonify({
                'message': f'Item status changed to {"clean" if item.is_clean else "dirty"}',
                'item': item.to_dict()
            })
        except Exception as e:
            if app.debug:
                print(f"Toggle laundry status error: {str(e)}")
            db.session.rollback()
            return jsonify({'error': f'Failed to update item status: {str(e)}'}), 500

    # ======================
    # OUTFIT ROUTES
    # ======================

    def _get_current_season():
        """Determine current season based on date"""
        month = datetime.now().month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'fall'

    def _validate_and_correct_outfit(suggestion, wardrobe, mood):
        """
        Validates the AI's outfit suggestion and corrects it if necessary.
        Ensures shoes are always present and the outfit has a base layer.
        """
        import random
        
        suggested_item_ids = suggestion.get('selected_items', [])
        
        # Create a lookup for all items in the wardrobe for quick access
        wardrobe_dict = {item['id']: item for item in wardrobe}
        
        # Get the full item details for the suggested items
        suggested_items = [wardrobe_dict[i] for i in suggested_item_ids if i in wardrobe_dict]
        
        # Get the types of items in the suggestion
        suggested_types = {item['type'].lower() for item in suggested_items}
        
        # --- 1. Check for Shoes ---
        shoe_types = {'shoes', 'sneakers', 'boots', 'sandals', 'heels'}
        has_shoes = any(t in shoe_types for t in suggested_types)

        if not has_shoes:
            # AI failed to add shoes, let's add some.
            available_shoes = [item for item in wardrobe if item['type'].lower() in shoe_types and item.get('is_clean', True)]
            
            if available_shoes:
                # Try to find shoes that match the mood/style
                mood_matching_shoes = [s for s in available_shoes if s.get('style', '').lower() == mood.lower()]
                
                if mood_matching_shoes:
                    chosen_shoe = random.choice(mood_matching_shoes)
                else:
                    chosen_shoe = random.choice(available_shoes)
                
                # Add the chosen shoe to the suggestion
                suggestion['selected_items'].append(chosen_shoe['id'])
                suggested_items.append(chosen_shoe)
                
                # Add a note to the reasoning
                if 'reasoning' in suggestion:
                    suggestion['reasoning'] += f" We've also added the {chosen_shoe['name']} to complete the look."

        # --- 2. Check for Base Layer (Top + Bottom or Dress) ---
        top_types = {'shirt', 't-shirt', 'blouse', 'sweater', 'tank-top'}
        bottom_types = {'pants', 'jeans', 'shorts', 'skirt', 'leggings'}
        dress_types = {'dress'}

        has_top = any(t in top_types for t in suggested_types)
        has_bottom = any(t in bottom_types for t in suggested_types)
        has_dress = any(t in dress_types for t in suggested_types)
        
        is_complete = (has_top and has_bottom) or has_dress

        if not is_complete:
            # The base is incomplete, this is a more complex failure.
            # For now, we'll just log it. A more advanced correction could be added later.
            print(f"WARNING: AI generated an incomplete outfit base for mood '{mood}'. Suggestion: {suggestion['selected_items']}")

        return suggestion, suggested_items


    @app.route('/api/get-outfit', methods=['POST'])
    @login_required
    @limiter.limit(get_user_specific_limit)
    def get_outfit_suggestion():
        try:
            data = request.get_json()
            mood = data.get('mood', 'casual')
            exclude_ids = data.get('exclude_ids', []) # Get the list of IDs to exclude
            
            # Let the backend determine the season for reliability
            season = _get_current_season()

            user = get_actual_user()
            wardrobe_items = ClothingItem.query.filter_by(user_id=user.id, is_clean=True).all()
            wardrobe = [item.to_dict() for item in wardrobe_items]
            if not wardrobe:
                return jsonify({
                    'error': 'No clean clothes in wardrobe',
                    'message': 'Add some clothes to your wardrobe first or do some laundry!',
                    'suggestion': None,
                    'items': [],
                    'weather': None,
                    'mood': mood
                }), 400
            weather_data = None
            weather_str = "mild weather"
            weather_advice = "General weather conditions"
            
            if user.location:
                weather_data = current_app.weather_service.get_current_weather(user.location)
                weather_str = current_app.weather_service.get_weather_description(weather_data)
                weather_advice = current_app.weather_service.get_outfit_weather_advice(weather_data)
            
            # Fetch recent "liked" outfits to help the AI learn
            outfit_history = Outfit.query.filter_by(user_id=user.id, was_actually_worn=True)\
                                       .order_by(Outfit.date.desc())\
                                       .limit(20).all()
            outfit_history_data = [outfit.to_dict() for outfit in outfit_history]

            # --- AI Suggestion Call ---
            suggestion = current_app.ai_service.generate_outfit_suggestion(
                wardrobe=wardrobe,
                weather=weather_str,
                mood=mood,
                season=season,
                outfit_history=outfit_history_data,
                exclude_ids=exclude_ids
            )

            # --- Post-AI Validation and Correction ---
            # This is the new logic to ensure the outfit is complete
            suggestion, suggested_items_list = _validate_and_correct_outfit(suggestion, wardrobe, mood)
            
            return jsonify({
                'suggestion': suggestion,
                'items': suggested_items_list,
                'weather': weather_str,
                'weather_data': weather_data,
                'weather_advice': weather_advice,
                'mood': mood,
                'wardrobe_count': len(wardrobe),
                'clean_items_count': len([item for item in wardrobe if item.get('is_clean', True)])
            })
        except Exception as e:
            if app.debug:
                print(f"Get outfit error: {str(e)}")
                traceback.print_exc()
            return jsonify({'error': f'Failed to generate outfit: {str(e)}'}), 500

    @app.route('/api/save-outfit', methods=['POST'])
    @login_required
    def save_outfit():
        try:
            user = get_actual_user()
            data = request.get_json()
            outfit = Outfit(
                user_id=user.id,
                weather=data.get('weather', ''),
                mood=data.get('mood', ''),
                reason_text=data.get('reason_text', ''),
                was_actually_worn=data.get('was_actually_worn', True),
                rating=data.get('rating'),
                notes=data.get('notes', '')
            )
            for item_id in data.get('item_ids', []):
                item = ClothingItem.query.get(item_id)
                if item and item.user_id == current_user.id:
                    outfit.clothing_items.append(item)
                    current_app.laundry_service.increment_wear_count(item_id)
            db.session.add(outfit)
            db.session.commit()
            return jsonify({'message': 'Outfit saved successfully', 'outfit': outfit.to_dict()})
        except Exception as e:
            if app.debug:
                print(f"Save outfit error: {str(e)}")
            db.session.rollback()
            return jsonify({'error': f'Failed to save outfit: {str(e)}'}), 500

    @app.route('/api/outfit-history', methods=['GET'])
    @login_required
    def get_outfit_history():
        try:
            # Get filter parameters from request arguments
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            year = request.args.get('year', type=int)
            month = request.args.get('month', type=int)

            user = get_actual_user()
            query = Outfit.query.options(
                selectinload(Outfit.clothing_items).selectinload(ClothingItem.owner)
            ).filter_by(user_id=user.id)

            # Date range filter (for list view)
            if start_date_str:
                start_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d')
                query = query.filter(Outfit.date >= start_date)
            
            if end_date_str:
                end_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d')
                end_of_day = end_date + timedelta(days=1)
                query = query.filter(Outfit.date < end_of_day)
            
            # Month and Year filter (for calendar view)
            if year and month:
                from sqlalchemy import extract
                query = query.filter(
                    extract('year', Outfit.date) == year,
                    extract('month', Outfit.date) == month
                )

            query = query.order_by(Outfit.date.desc())

            # If any filter is applied, return all results without pagination
            if start_date_str or end_date_str or (year and month):
                outfits = query.all()
                return jsonify({
                    'outfits': [outfit.to_dict() for outfit in outfits],
                    'total': len(outfits),
                    'pages': 1,
                    'current_page': 1
                })
            else:
                # Default paginated view
                page = request.args.get('page', 1, type=int)
                per_page = request.args.get('per_page', 10, type=int)
                paginated_outfits = query.paginate(page=page, per_page=per_page, error_out=False)
                return jsonify({
                    'outfits': [outfit.to_dict() for outfit in paginated_outfits.items],
                    'total': paginated_outfits.total,
                    'pages': paginated_outfits.pages,
                    'current_page': page
                })

        except Exception as e:
            if app.debug:
                print(f"Get outfit history error: {str(e)}")
                traceback.print_exc()
            return jsonify({'error': f'Failed to get outfit history: {str(e)}'}), 500

    # ======================
    # LAUNDRY ROUTES
    # ======================

    @app.route('/api/laundry/alerts', methods=['GET'])
    @login_required
    def get_laundry_alerts():
        try:
            user = get_actual_user()
            alerts = current_app.laundry_service.get_laundry_alerts(user.id)
            return jsonify(alerts)
        except Exception as e:
            if app.debug:
                print(f"Laundry alerts error: {str(e)}")
            return jsonify({'error': f'Failed to get laundry alerts: {str(e)}'}), 500

    @app.route('/api/laundry/health-score', methods=['GET'])
    @login_required
    def get_wardrobe_health():
        try:
            user = get_actual_user()
            health = current_app.laundry_service.get_wardrobe_health_score(user.id)
            return jsonify(health)
        except Exception as e:
            if app.debug:
                print(f"Wardrobe health error: {str(e)}")
            return jsonify({'error': f'Failed to get wardrobe health: {str(e)}'}), 500

    @app.route('/api/laundry/mark-washed', methods=['POST'])
    @login_required
    def mark_items_washed():
        try:
            data = request.get_json()
            item_ids = data.get('item_ids', [])
            if not item_ids:
                return jsonify({'error': 'No items specified'}), 400
            user = get_actual_user()
            items = ClothingItem.query.filter(
                ClothingItem.id.in_(item_ids),
                ClothingItem.user_id == user.id
            ).all()
            if len(items) != len(item_ids):
                return jsonify({'error': 'Some items not found or not owned by user'}), 400
            success = current_app.laundry_service.mark_items_washed(item_ids)
            if success:
                return jsonify({'message': f'Marked {len(item_ids)} items as washed'})
            else:
                return jsonify({'error': 'Failed to mark items as washed'}), 500
        except Exception as e:
            if app.debug:
                print(f"Mark washed error: {str(e)}")
            return jsonify({'error': f'Failed to mark items as washed: {str(e)}'}), 500

    @app.route('/api/laundry/toggle-status/<int:item_id>', methods=['PATCH'])
    @login_required
    def toggle_laundry_status(item_id):
        try:
            user = get_actual_user()
            item = ClothingItem.query.get(item_id)
            if not item or item.user_id != user.id:
                return jsonify({'error': 'Item not found'}), 404

            if item.is_clean:
                # Mark as dirty
                current_app.laundry_service.increment_wear_count(item_id)
            else:
                # Mark as clean
                current_app.laundry_service.mark_items_washed([item_id])
            
            # Refetch the item to get the updated state
            updated_item = ClothingItem.query.get(item_id)
            return jsonify({
                'message': f'Item status updated.',
                'item': updated_item.to_dict()
            })
        except Exception as e:
            if app.debug:
                print(f"Toggle laundry status error: {str(e)}")
            db.session.rollback()
            return jsonify({'error': f'Failed to update item status: {str(e)}'}), 500

    # ======================
    # INTELLIGENCE ROUTES
    # ======================

    @app.route('/api/intelligence/collections', methods=['GET'])
    @login_required
    def get_smart_collections():
        try:
            user = get_actual_user()
            collections = current_app.wardrobe_intelligence_service.get_smart_collections(user.id)
            return jsonify(collections)
        except Exception as e:
            if app.debug:
                print(f"Smart collections error: {str(e)}")
            return jsonify({'error': f'Failed to get smart collections: {str(e)}'}), 500

    @app.route('/api/intelligence/gaps', methods=['GET'])
    @login_required
    def get_wardrobe_gaps():
        try:
            user = get_actual_user()
            gaps = current_app.wardrobe_intelligence_service.get_wardrobe_gaps(user.id)
            return jsonify(gaps)
        except Exception as e:
            if app.debug:
                print(f"Wardrobe gaps error: {str(e)}")
            return jsonify({'error': f'Failed to analyze wardrobe gaps: {str(e)}'}), 500

    # ======================
    # ANALYTICS ROUTES
    # ======================

    @app.route('/api/analytics/usage', methods=['GET'])
    @login_required
    def get_usage_analytics():
        try:
            user = get_actual_user()
            analytics = current_app.analytics_service.get_usage_analytics(user.id)
            return jsonify(analytics)
        except Exception as e:
            if app.debug:
                print(f"Usage analytics error: {str(e)}")
            return jsonify({'error': f'Failed to get usage analytics: {str(e)}'}), 500

    @app.route('/api/analytics/style-dna', methods=['GET'])
    @login_required
    def get_style_dna():
        try:
            user = get_actual_user()
            items = ClothingItem.query.filter_by(user_id=user.id).all()
            outfits = Outfit.query.filter_by(user_id=user.id).all()
            style_counts = Counter(item.style for item in items if item.style)
            color_counts = Counter(item.color for item in items if item.color)
            brand_counts = Counter(item.brand for item in items if item.brand)
            outfit_combos = []
            for outfit in outfits[-10:]:
                combo = {
                    'mood': outfit.mood,
                    'items': [item.type for item in outfit.clothing_items],
                    'colors': [item.color for item in outfit.clothing_items if item.color],
                    'date': outfit.date.isoformat()
                }
                outfit_combos.append(combo)
            style_dna = {
                'dominant_style': style_counts.most_common(1)[0] if style_counts else None,
                'color_personality': dict(color_counts.most_common(5)),
                'brand_loyalty': dict(brand_counts.most_common(5)),
                'style_diversity': len(style_counts),
                'recent_combinations': outfit_combos,
                'risk_tolerance': 'conservative' if len(style_counts) < 3 else 'adventurous'
            }
            return jsonify(style_dna)
        except Exception as e:
            if app.debug:
                print(f"Style DNA error: {str(e)}")
            return jsonify({'error': f'Failed to analyze style DNA: {str(e)}'}), 500

    # ======================
    # IMAGE UPLOAD
    # ======================

    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024

    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @app.route('/api/upload-image', methods=['POST'])
    def upload_image():
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        try:
            # Upload the file to Cloudinary
            upload_result = cloudinary.uploader.upload(
                file,
                folder="virtual-wardrobe", # Optional: organizes uploads in Cloudinary
                transformation=[
                    {'width': 1000, 'height': 1000, 'crop': 'limit'}, # Resize to max 1000x1000
                    {'quality': 'auto'} # Automatically adjust quality to save space
                ]
            )
            
            # Cloudinary returns a secure URL (https://...)
            secure_url = upload_result.get('secure_url')

            return jsonify({
                'message': 'Image uploaded successfully to Cloudinary',
                # IMPORTANT: We now return the full, absolute URL from Cloudinary
                'image_url': secure_url, 
                'filename': upload_result.get('public_id')
            })

        except Exception as e:
            if app.debug:
                print(f"Cloudinary Upload error: {e}")
            return jsonify({'error': f'Upload failed: {str(e)}'}), 500

    return app, socketio