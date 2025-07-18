from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

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
    location = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # User preferences for laundry thresholds
    laundry_preferences = db.Column(db.Text)  # JSON string of preferences
    
    # Relationships
    clothing_items = db.relationship('ClothingItem', backref='owner', lazy=True)
    outfits = db.relationship('Outfit', backref='user', lazy=True)

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
            'wash_recommendation': self.get_wash_recommendation()
        }
    
    def get_days_since_wash(self):
        if not self.last_washed:
            return None
        return (datetime.utcnow() - self.last_washed).days
    
    def get_cost_per_wear(self):
        if not self.purchase_cost or not self.wear_count or self.wear_count == 0:
            return None
        return round(self.purchase_cost / self.wear_count, 2)
    
    def get_wash_recommendation(self):
        """Get intelligent wash recommendation based on item type and wear count"""
        # Default thresholds by clothing type
        thresholds = {
            't-shirt': 2,
            'shirt': 2,
            'blouse': 2,
            'tank-top': 2,
            'dress': 2,
            'underwear': 1,
            'socks': 1,
            'workout': 1,
            'jeans': 5,
            'pants': 3,
            'shorts': 3,
            'skirt': 3,
            'sweater': 4,
            'jacket': 8,
            'coat': 10,
            'cardigan': 4,
            'shoes': 20,  # Different meaning - more about cleaning
            'accessories': 10
        }
        
        # Get threshold for this item type
        threshold = thresholds.get(self.type.lower(), 3)
        
        # Adjust based on fabric (if available)
        if self.fabric:
            fabric_lower = self.fabric.lower()
            if 'cotton' in fabric_lower and 'blend' not in fabric_lower:
                threshold = max(1, threshold - 1)  # Pure cotton needs more frequent washing
            elif 'wool' in fabric_lower:
                threshold = threshold + 2  # Wool can go longer
            elif 'synthetic' in fabric_lower or 'polyester' in fabric_lower:
                threshold = max(1, threshold - 1)  # Synthetic holds odors
        
        wear_count = self.wear_count_since_wash or 0
        
        # Calculate urgency
        if wear_count >= threshold:
            return 'urgent'
        elif wear_count >= threshold * 0.8:
            return 'high'
        elif wear_count >= threshold * 0.6:
            return 'medium'
        elif wear_count >= threshold * 0.4:
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