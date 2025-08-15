from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from datetime import datetime
import json
from flask import current_app
from itsdangerous import URLSafeTimedSerializer as Serializer

db = SQLAlchemy()

# Association table for many-to-many relationship between outfits and clothing items
outfit_items = db.Table('outfit_items',
    db.Column('outfit_id', db.Integer, db.ForeignKey('outfit.id'), primary_key=True),
    db.Column('clothing_item_id', db.Integer, db.ForeignKey('clothing_item.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    is_premium = db.Column(db.Boolean, nullable=False, default=False)
    is_suspended = db.Column(db.Boolean, nullable=False, default=False)
    suspension_end_date = db.Column(db.DateTime, nullable=True)
    is_banned = db.Column(db.Boolean, nullable=False, default=False)
    location = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login_at = db.Column(db.DateTime, nullable=True)

    display_name = db.Column(db.String(80), nullable=True)
    profile_image_url = db.Column(db.String(255), nullable=True)

    settings = db.Column(JSON, nullable=True)

    # User preferences for laundry thresholds
    laundry_preferences = db.Column(db.Text)  # JSON string of preferences
    
    # Relationships
    clothing_items = db.relationship('ClothingItem', backref='owner', lazy=True)
    outfits = db.relationship('Outfit', backref='user', lazy=True)
    trips = db.relationship('Trip', backref='traveler', lazy=True, cascade="all, delete-orphan")

    def get_token(self, salt, expires_sec=3600):
        s = Serializer(current_app.config['SECRET_KEY'], salt=salt)
        return s.dumps({'user_id': self.id})

    @staticmethod
    def verify_token(token, salt, max_age=3600):
        s = Serializer(current_app.config['SECRET_KEY'], salt=salt)
        try:
            data = s.loads(token, max_age=max_age)
            user_id = data.get('user_id')
        except Exception:
            return None
        return User.query.get(user_id)
    
    def get_laundry_thresholds(self):
        """
        Returns the user's custom thresholds, falling back to system defaults.
        """
        # System-wide default thresholds
        default_thresholds = {
            't-shirt': 1, 'shirt': 1, 'blouse': 1, 'tank-top': 1,
            'dress': 1, 'underwear': 1, 'socks': 1, 'workout': 1,
            'jeans': 5, 'pants': 3, 'shorts': 3, 'skirt': 3,
            'sweater': 5, 'jacket': 8, 'coat': 10, 'cardigan': 4,
            'shoes': 20, 'accessories': 10
        }
        
        if self.settings and 'laundry_thresholds' in self.settings:
            user_thresholds = default_thresholds.copy()
            user_thresholds.update(self.settings['laundry_thresholds'])
            return user_thresholds
        
        return default_thresholds

class UserActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='activities')

class ClothingItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    style = db.Column(db.String(50))
    color = db.Column(db.String(30))
    season = db.Column(db.String(20))
    fabric = db.Column(db.String(50))
    mood_tags = db.Column(db.Text)
    brand = db.Column(db.String(50))
    condition = db.Column(db.String(20), default='good')
    is_clean = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(255))
    custom_tags = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # NEW: Wear tracking fields
    wear_count = db.Column(db.Integer, default=0)
    wear_count_since_wash = db.Column(db.Integer, default=0)
    last_worn = db.Column(db.DateTime)
    last_washed = db.Column(db.DateTime)
    purchase_date = db.Column(db.DateTime)
    purchase_cost = db.Column(db.Float)
    
    # NEW: Laundry status
    laundry_status = db.Column(db.String(20), default='clean')  # clean, dirty, in_laundry, drying
    needs_washing = db.Column(db.Boolean, default=False)
    wash_urgency = db.Column(db.String(20), default='none')  # none, low, medium, high, urgent
    
    # NEW: Care instructions
    care_instructions = db.Column(db.Text)  # JSON string
    wash_temperature = db.Column(db.String(20))  # cold, warm, hot
    dry_clean_only = db.Column(db.Boolean, default=False)
    
    # NEW: Maintenance tracking
    needs_repair = db.Column(db.Boolean, default=False)
    repair_notes = db.Column(db.Text)
    retirement_candidate = db.Column(db.Boolean, default=False)

    # NEW: Content moderation fields
    status = db.Column(db.String(20), default='approved', nullable=False) # pending, approved, rejected
    reported_count = db.Column(db.Integer, default=0, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'style': self.style,
            'color': self.color,
            'season': self.season,
            'fabric': self.fabric,
            'mood_tags': json.loads(self.mood_tags) if self.mood_tags else [],
            'brand': self.brand,
            'condition': self.condition,
            'is_clean': self.is_clean,
            'image_url': self.image_url,
            'custom_tags': json.loads(self.custom_tags) if self.custom_tags else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            
            # NEW: Wear tracking data
            'wear_count': self.wear_count or 0,
            'wear_count_since_wash': self.wear_count_since_wash or 0,
            'last_worn': self.last_worn.isoformat() if self.last_worn else None,
            'last_washed': self.last_washed.isoformat() if self.last_washed else None,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'purchase_cost': self.purchase_cost,
            
            # NEW: Laundry status
            'laundry_status': self.laundry_status or 'clean',
            'needs_washing': self.needs_washing or False,
            'wash_urgency': self.wash_urgency or 'none',
            
            # NEW: Care instructions
            'care_instructions': json.loads(self.care_instructions) if self.care_instructions else {},
            'wash_temperature': self.wash_temperature,
            'dry_clean_only': self.dry_clean_only or False,
            
            # NEW: Maintenance
            'needs_repair': self.needs_repair or False,
            'repair_notes': self.repair_notes,
            'retirement_candidate': self.retirement_candidate or False,
            
            # NEW: Calculated fields
            'days_since_wash': self.get_days_since_wash(),
            'cost_per_wear': self.get_cost_per_wear(),
            'wash_recommendation': self.get_wash_recommendation(),
            
            # NEW: Moderation data
            'status': self.status,
            'reported_count': self.reported_count,
            'owner': {
                'id': self.owner.id,
                'email': self.owner.email
            } if self.owner else None
        }
    
    def get_days_since_wash(self):
        if not self.last_washed:
            return None
        return (datetime.utcnow() - self.last_washed).days
    
    def get_cost_per_wear(self):
        if not self.purchase_cost or not self.wear_count or self.wear_count == 0:
            return None
        return round(self.purchase_cost / self.wear_count, 2)

    def get_laundry_thresholds(self):
        """
        Returns the user's custom thresholds, falling back to system defaults.
        """
        # System-wide default thresholds
        default_thresholds = {
            't-shirt': 1, 'shirt': 1, 'blouse': 1, 'tank-top': 1,
            'dress': 1, 'underwear': 1, 'socks': 1, 'workout': 1,
            'jeans': 5, 'pants': 3, 'shorts': 3, 'skirt': 3,
            'sweater': 5, 'jacket': 8, 'coat': 10, 'cardigan': 4,
            'shoes': 20, 'accessories': 10
        }
        
        # If the user has saved custom settings, merge them with the defaults.
        # The user's settings will override the defaults.
        if self.settings and 'laundry_thresholds' in self.settings:
            # Create a new dictionary starting with the defaults
            user_thresholds = default_thresholds.copy()
            # Update it with the user's custom values
            user_thresholds.update(self.settings['laundry_thresholds'])
            return user_thresholds
        
        # Otherwise, just return the system defaults
        return default_thresholds
    
    def get_wash_recommendation(self):
        """
        Get intelligent wash recommendation based on item type, wear count, fabric,
        and the owner's custom laundry thresholds.
        """
        
        if not self.owner:
            return 'none'
            
        thresholds = self.owner.get_laundry_thresholds()

        threshold = thresholds.get(self.type.lower(), 3)
      
        if self.fabric:
            fabric_lower = self.fabric.lower()
            if 'cotton' in fabric_lower and 'blend' not in fabric_lower:
                threshold = max(1, threshold - 1) 
            elif 'wool' in fabric_lower:
                threshold = threshold + 2
            elif 'synthetic' in fabric_lower or 'polyester' in fabric_lower:
                threshold = max(1, threshold - 1)
        
        wear_count = self.wear_count_since_wash or 0
        
        if threshold <= 0:
            return 'none'

        wear_percentage = (float(wear_count) / threshold) * 100
        
        if wear_percentage >= 100:
            return 'urgent'
        elif wear_percentage >= 80:
            return 'high'
        elif wear_percentage >= 60:
            return 'medium'
        elif wear_percentage >= 40:
            return 'low'
        else:
            return 'none'

class Outfit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    weather = db.Column(db.String(100))
    mood = db.Column(db.String(50))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    reason_text = db.Column(db.Text)
    
    # NEW: Outfit tracking
    was_actually_worn = db.Column(db.Boolean, default=True)  # Did they actually wear it?
    rating = db.Column(db.Integer)  # 1-5 star rating
    notes = db.Column(db.Text)  # User notes about the outfit
    
    # Many-to-many relationship with clothing items
    clothing_items = db.relationship('ClothingItem', secondary=outfit_items, lazy='subquery',
                                   backref=db.backref('outfits', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'weather': self.weather,
            'mood': self.mood,
            'date': self.date.isoformat(),
            'reason_text': self.reason_text,
            'was_actually_worn': self.was_actually_worn or True,
            'rating': self.rating,
            'notes': self.notes,
            'clothing_items': [item.to_dict() for item in self.clothing_items]
        }

class Trip(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    destination = db.Column(db.String(150), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    trip_type = db.Column(db.String(50), nullable=True) # e.g., 'business', 'vacation', 'beach'
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'destination': self.destination,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'trip_type': self.trip_type,
            'notes': self.notes,
            'duration_days': (self.end_date - self.start_date).days + 1,
            'packing_list': {
                'status': self.packing_list.status
            } if self.packing_list else None
        }

class PackingList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(db.Integer, db.ForeignKey('trip.id'), nullable=False, unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False) # active, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    trip = db.relationship('Trip', backref=db.backref('packing_list', uselist=False, cascade="all, delete-orphan"))
    user = db.relationship('User', backref='packing_lists')
    items = db.relationship('PackingListItem', backref='packing_list', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'trip_id': self.trip_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items]
        }

class PackingListItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    packing_list_id = db.Column(db.Integer, db.ForeignKey('packing_list.id'), nullable=False)
    clothing_item_id = db.Column(db.Integer, db.ForeignKey('clothing_item.id'), nullable=True) # Can be null for non-wardrobe items
    item_name = db.Column(db.String(100), nullable=False) # e.g., "Socks" or "Passport"
    quantity = db.Column(db.Integer, default=1, nullable=False)
    is_packed = db.Column(db.Boolean, default=False, nullable=False)
    
    clothing_item = db.relationship('ClothingItem')

    def to_dict(self):
        return {
            'id': self.id,
            'item_name': self.item_name,
            'quantity': self.quantity,
            'is_packed': self.is_packed,
            'clothing_item_id': self.clothing_item_id,
            'clothing_item': self.clothing_item.to_dict() if self.clothing_item else None
        }

class UserEssentialPreference(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_type = db.Column(db.String(50), nullable=False) # e.g., 'socks', 'underwear'
    quantity = db.Column(db.Integer, default=1, nullable=False)

    user = db.relationship('User', backref='essential_preferences')
    __table_args__ = (db.UniqueConstraint('user_id', 'item_type', name='_user_item_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'item_type': self.item_type,
            'quantity': self.quantity
        }

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    link = db.Column(db.String(255), nullable=True)  # e.g., '/laundry'
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notifications', cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'link': self.link,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }


class AdminAction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    target_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    action_type = db.Column(db.String(50), nullable=False) # e.g., 'ban_user', 'suspend_user', 'delete_item'
    details = db.Column(db.Text, nullable=True) # e.g., reason for ban, duration of suspension
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    admin = db.relationship('User', foreign_keys=[admin_id], backref='admin_actions')
    target_user = db.relationship('User', foreign_keys=[target_user_id], backref='targeted_actions')

    def to_dict(self):
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_email': self.admin.email,
            'target_user_id': self.target_user_id,
            'target_user_email': self.target_user.email if self.target_user else None,
            'action_type': self.action_type,
            'details': self.details,
            'created_at': self.created_at.isoformat()
        }