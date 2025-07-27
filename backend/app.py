import os

from flask import Flask, request, jsonify, send_from_directory, session, current_app, make_response
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_migrate import Migrate
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
from models import db, User, ClothingItem, Outfit

# Initialize extensions globally
login_manager = LoginManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__)

    # --- Application Configuration ---
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a_fallback_secret_key_for_dev_only')
    app.config['UPLOAD_FOLDER'] = 'uploads'

    # --- Session Configuration (CRITICAL for Cross-Site HTTPS) ---
    is_production = os.environ.get('FLASK_ENV') == 'production'

    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

    # Use secure cookies in production, and a more relaxed policy for development
    if is_production:
        print("INFO: Configuring session for PRODUCTION environment.")
        app.config['SESSION_COOKIE_SECURE'] = True
        app.config['SESSION_COOKIE_SAMESITE'] = 'None' # Necessary for cross-domain requests over HTTPS
    else:
        print("INFO: Configuring session for DEVELOPMENT environment.")
        app.config['SESSION_COOKIE_SECURE'] = False
        app.config['SESSION_COOKIE_SAMESITE'] = 'Lax' # 'Lax' is best for localhost development

    @app.before_request
    def make_session_permanent():
        session.permanent = True
        
    print("--- Session Cookie Configuration ---")
    print(f"Production mode: {is_production}")
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
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    login_manager.session_protection = "strong"
    
    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "Unauthorized: Please log in to access this resource."}), 401

    # --- CORS Configuration ---
    # Ensure FRONTEND_URL is set correctly on Render backend environment variables
    frontend_url_base = os.environ.get('FRONTEND_URL') 
    
    allowed_origins_list = []
    if frontend_url_base:
        allowed_origins_list.append(frontend_url_base.rstrip('/'))
    
    # Add localhost for local development only
    if not is_production:
        allowed_origins_list.append('http://localhost:3000')
        allowed_origins_list.append('http://localhost:3001')

    if app.debug:
        print(f"CORS configured for origins: {allowed_origins_list}")

    # Initialize Flask-CORS with basic settings
    CORS(app, 
         origins=allowed_origins_list,
         supports_credentials=True)

    # --- Manual Preflight (OPTIONS) Handler ---
    # This is crucial for some production environments that might not
    # correctly handle the preflight requests via the CORS extension alone.
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            res = make_response()
            res.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin')
            res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
            res.headers['Access-Control-Allow-Credentials'] = 'true'
            return res
        
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

    # --- Initialize services ---
    from utils.ai_service import AIOutfitService
    from utils.weather_service import WeatherService
    from utils.laundry_service import LaundryIntelligenceService
    from utils.wardrobe_intelligence import WardrobeIntelligenceService, AnalyticsService

    ai_service = AIOutfitService(os.environ.get('OPENAI_API_KEY'))
    weather_service = WeatherService(os.environ.get('WEATHER_API_KEY'))
    laundry_service = LaundryIntelligenceService()
    wardrobe_intelligence_service = WardrobeIntelligenceService()
    analytics_service = AnalyticsService()

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
        if current_user.is_authenticated:
            return jsonify({
                'authenticated': True,
                'user_id': current_user.id,
                'email': current_user.email
            })
        else:
            return jsonify({'authenticated': False}), 401

    # ======================
    # AUTHENTICATION ROUTES
    # ======================

    @app.route('/api/register', methods=['POST'])
    def register():
        try:
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
            try:
                db.engine.connect()
            except Exception as e:
                return jsonify({'error': 'Database connection failed. Please try again later.'}), 500
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
            login_user(user, remember=True)
            session.permanent = True
            return jsonify({
                'message': 'User created successfully', 
                'user_id': user.id,
                'email': user.email
            })
        except Exception as e:
            if app.debug:
                print(f"Registration error: {str(e)}")
            db.session.rollback()
            return jsonify({'error': f'Registration failed: {str(e)}'}), 500

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
                session.clear() # Clear any existing session data
                session.permanent = True # Set session as permanent BEFORE login_user
                login_user(user, remember=True) # Login user with remember=True for persistent sessions
                session['user_id'] = user.id # Manually set session data for additional verification
                session['logged_in'] = True
                
                response = jsonify({
                    'message': 'Login successful', 
                    'user_id': user.id,
                    'email': user.email,
                    'session_id': session.get('_id', 'generated') # For debugging
                })
                return response
            return jsonify({'error': 'Invalid credentials'}), 401
        except Exception as e:
            if app.debug:
                print(f"Login error: {str(e)}")
            return jsonify({'error': f'Login failed: {str(e)}'}), 500

    @app.route('/api/logout', methods=['POST'])
    @login_required # Keep this decorator
    def logout():
        try:
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
        try:
            user = current_user
            
            # Calculate wardrobe statistics
            wardrobe_stats = {
                'total_items': ClothingItem.query.filter_by(user_id=user.id).count(),
                'total_outfits': Outfit.query.filter_by(user_id=user.id).count(),
                'items_never_worn': ClothingItem.query.filter_by(user_id=user.id, outfits=None).count()
            }
            
            # Prepare the data to be sent to the frontend
            profile_data = {
                'id': user.id,
                'email': user.email,
                'display_name': user.display_name,
                'profile_image_url': user.profile_image_url,
                'location': user.location,
                'laundry_thresholds': user.get_laundry_thresholds(),
                'theme': user.settings.get('theme', 'light') if user.settings else 'light',
                'wardrobe_stats': wardrobe_stats
            }
            return jsonify(profile_data)
            
        except Exception as e:
            if app.debug:
                print(f"Get profile error: {str(e)}")
            return jsonify({'error': 'Failed to fetch profile data.'}), 500


    @app.route('/api/profile', methods=['PUT'])
    @login_required
    def update_profile():
        """Updates the profile data for the currently logged-in user."""
        try:
            user = current_user
            data = request.get_json()

            # Update basic fields
            user.display_name = data.get('display_name', user.display_name)
            user.profile_image_url = data.get('profile_image_url', user.profile_image_url)
            user.location = data.get('location', user.location)
            
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

            if settings_changed:
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(user, "settings")

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

        if not check_password_hash(current_user.password_hash, current_password):
            return jsonify({'error': 'Your current password does not match.'}), 401

        current_user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return jsonify({'message': 'Password changed successfully!'})


    @app.route('/api/profile/export-data', methods=['GET'])
    @login_required
    def export_data():
        """Generates and returns a JSON file of all the user's data."""
        user = current_user
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
        
        if not check_password_hash(current_user.password_hash, password):
            return jsonify({'error': 'Incorrect password.'}), 401

        try:
            user_to_delete = User.query.get(current_user.id)
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
        
    # ======================
    # WARDROBE ROUTES
    # ======================

    @app.route('/api/add-item', methods=['POST'])
    @login_required
    def add_clothing_item():
        try:
            data = request.get_json()
            item = ClothingItem(
                user_id=current_user.id,
                name=data['name'],
                type=data['type'],
                style=data.get('style', ''),
                color=data.get('color', ''),
                season=data.get('season', 'all'),
                fabric=data.get('fabric', ''),
                mood_tags=json.dumps(data.get('mood_tags', [])),
                brand=data.get('brand', ''),
                condition=data.get('condition', 'good'),
                is_clean=data.get('is_clean', True),
                image_url=data.get('image_url', ''),
                custom_tags=json.dumps(data.get('custom_tags', []))
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
            items = ClothingItem.query.filter_by(user_id=current_user.id).all()
            return jsonify({'items': [item.to_dict() for item in items]})
        except Exception as e:
            if app.debug:
                print(f"Get wardrobe error: {str(e)}")
            return jsonify({'error': f'Failed to get wardrobe: {str(e)}'}), 500

    @app.route('/api/update-item/<int:item_id>', methods=['PUT'])
    @login_required
    def update_clothing_item(item_id):
        try:
            item = ClothingItem.query.get(item_id)
            if not item or item.user_id != current_user.id:
                return jsonify({'error': 'Item not found'}), 404
            data = request.get_json()
            item.name = data.get('name', item.name)
            item.type = data.get('type', item.type)
            item.style = data.get('style', item.style)
            item.color = data.get('color', item.color)
            item.season = data.get('season', item.season)
            item.fabric = data.get('fabric', item.fabric)
            item.mood_tags = json.dumps(data.get('mood_tags', json.loads(item.mood_tags or '[]')))
            item.brand = data.get('brand', item.brand)
            item.condition = data.get('condition', item.condition)
            item.is_clean = data.get('is_clean', item.is_clean)
            item.custom_tags = json.dumps(data.get('custom_tags', json.loads(item.custom_tags or '[]')))
            if 'image_url' in data:
                item.image_url = data['image_url']
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
            item = ClothingItem.query.get(item_id)
            if not item or item.user_id != current_user.id:
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
            item = ClothingItem.query.get(item_id)
            if not item or item.user_id != current_user.id:
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

    @app.route('/api/get-outfit', methods=['POST'])
    @login_required
    def get_outfit_suggestion():
        try:
            data = request.get_json()
            mood = data.get('mood', 'casual')
            wardrobe_items = ClothingItem.query.filter_by(user_id=current_user.id).all()
            wardrobe = [item.to_dict() for item in wardrobe_items]
            if not wardrobe:
                return jsonify({
                    'error': 'No clothes in wardrobe',
                    'message': 'Add some clothes to your wardrobe first!',
                    'suggestion': None,
                    'items': [],
                    'weather': None,
                    'mood': mood
                }), 400
            weather_data = None
            weather_str = "mild weather"
            weather_advice = "General weather conditions"
            if current_user.location:
                weather_data = weather_service.get_current_weather(current_user.location)
                weather_str = weather_service.get_weather_description(weather_data)
                weather_advice = weather_service.get_outfit_weather_advice(weather_data)
            recent_outfits = Outfit.query.filter_by(user_id=current_user.id)\
                                     .filter(Outfit.date >= datetime.utcnow() - timedelta(days=7))\
                                     .order_by(Outfit.date.desc()).all()
            recent_outfits_data = [outfit.to_dict() for outfit in recent_outfits]
            suggestion = ai_service.generate_outfit_suggestion(
                wardrobe=wardrobe,
                weather=weather_str,
                mood=mood,
                recent_outfits=recent_outfits_data
            )
            suggested_items = []
            for item_id in suggestion.get('selected_items', []):
                item = ClothingItem.query.get(item_id)
                if item and item.user_id == current_user.id:
                    suggested_items.append(item.to_dict())
            return jsonify({
                'suggestion': suggestion,
                'items': suggested_items,
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
            return jsonify({'error': f'Failed to generate outfit: {str(e)}'}), 500

    @app.route('/api/save-outfit', methods=['POST'])
    @login_required
    def save_outfit():
        try:
            data = request.get_json()
            outfit = Outfit(
                user_id=current_user.id,
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
                    laundry_service.increment_wear_count(item_id)
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
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            outfits = Outfit.query.filter_by(user_id=current_user.id)\
                                 .order_by(Outfit.date.desc())\
                                 .paginate(page=page, per_page=per_page, error_out=False)
            return jsonify({
                'outfits': [outfit.to_dict() for outfit in outfits.items],
                'total': outfits.total,
                'pages': outfits.pages,
                'current_page': page
            })
        except Exception as e:
            if app.debug:
                print(f"Get outfit history error: {str(e)}")
            return jsonify({'error': f'Failed to get outfit history: {str(e)}'}), 500

    # ======================
    # LAUNDRY ROUTES
    # ======================

    @app.route('/api/laundry/alerts', methods=['GET'])
    @login_required
    def get_laundry_alerts():
        try:
            alerts = laundry_service.get_laundry_alerts(current_user.id)
            return jsonify(alerts)
        except Exception as e:
            if app.debug:
                print(f"Laundry alerts error: {str(e)}")
            return jsonify({'error': f'Failed to get laundry alerts: {str(e)}'}), 500

    @app.route('/api/laundry/health-score', methods=['GET'])
    @login_required
    def get_wardrobe_health():
        try:
            health = laundry_service.get_wardrobe_health_score(current_user.id)
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
            items = ClothingItem.query.filter(
                ClothingItem.id.in_(item_ids),
                ClothingItem.user_id == current_user.id
            ).all()
            if len(items) != len(item_ids):
                return jsonify({'error': 'Some items not found or not owned by user'}), 400
            success = laundry_service.mark_items_washed(item_ids)
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
            item = ClothingItem.query.get(item_id)
            if not item or item.user_id != current_user.id:
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
                'message': f'Item status changed to {item.laundry_status}',
                'item': item.to_dict()
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
            collections = wardrobe_intelligence_service.get_smart_collections(current_user.id)
            return jsonify(collections)
        except Exception as e:
            if app.debug:
                print(f"Smart collections error: {str(e)}")
            return jsonify({'error': f'Failed to get smart collections: {str(e)}'}), 500

    @app.route('/api/intelligence/gaps', methods=['GET'])
    @login_required
    def get_wardrobe_gaps():
        try:
            gaps = wardrobe_intelligence_service.get_wardrobe_gaps(current_user.id)
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
            analytics = analytics_service.get_usage_analytics(current_user.id)
            return jsonify(analytics)
        except Exception as e:
            if app.debug:
                print(f"Usage analytics error: {str(e)}")
            return jsonify({'error': f'Failed to get usage analytics: {str(e)}'}), 500

    @app.route('/api/analytics/style-dna', methods=['GET'])
    @login_required
    def get_style_dna():
        try:
            items = ClothingItem.query.filter_by(user_id=current_user.id).all()
            outfits = Outfit.query.filter_by(user_id=current_user.id).all()
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

    return app

app = create_app()
