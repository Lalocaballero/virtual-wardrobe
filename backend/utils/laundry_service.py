from datetime import datetime, timedelta
from typing import List, Dict, Any
from models import ClothingItem, User, db  # Removed LaundryLoad import
import json

class LaundryIntelligenceService:
    
    @staticmethod
    def increment_wear_count(item_id: int) -> bool:
        """Increment wear count for an item and update laundry status"""
        try:
            item = ClothingItem.query.get(item_id)
            if not item:
                return False
            
            # Increment counters
            item.wear_count = (item.wear_count or 0) + 1
            item.wear_count_since_wash = (item.wear_count_since_wash or 0) + 1
            item.last_worn = datetime.utcnow()
            
            # Update wash recommendation
            wash_rec = item.get_wash_recommendation()
            item.wash_urgency = wash_rec
            
            # Mark as needing washing if urgent
            if wash_rec in ['high', 'urgent']:
                item.needs_washing = True
            
            # If very dirty, mark as dirty
            if wash_rec == 'urgent':
                item.is_clean = False
            
            db.session.commit()
            return True
            
        except Exception as e:
            print(f"Error incrementing wear count: {e}")
            db.session.rollback()
            return False
    
    @staticmethod
    def mark_items_washed(item_ids: List[int]) -> bool:
        """Mark items as washed and reset counters"""
        try:
            for item_id in item_ids:
                item = ClothingItem.query.get(item_id)
                if item:
                    item.wear_count_since_wash = 0
                    item.last_washed = datetime.utcnow()
                    item.is_clean = True
                    item.needs_washing = False
                    item.wash_urgency = 'none'
                    item.laundry_status = 'clean'
            
            db.session.commit()
            return True
            
        except Exception as e:
            print(f"Error marking items as washed: {e}")
            db.session.rollback()
            return False
    
    @staticmethod
    def get_laundry_alerts(user_id: int) -> Dict[str, Any]:
        """Get laundry alerts and recommendations for a user"""
        try:
            # Get all user's items
            items = ClothingItem.query.filter_by(user_id=user_id).all()
            
            # Categorize by urgency
            urgent_items = []
            high_priority = []
            medium_priority = []
            overdue_items = []
            
            for item in items:
                if item.laundry_status == 'clean' and item.is_clean:
                    urgency = item.get_wash_recommendation()
                    
                    if urgency == 'urgent':
                        urgent_items.append(item.to_dict())
                    elif urgency == 'high':
                        high_priority.append(item.to_dict())
                    elif urgency == 'medium':
                        medium_priority.append(item.to_dict())
                
                # Check for overdue items (not worn in 30+ days)
                if item.last_worn and (datetime.utcnow() - item.last_worn).days > 30:
                    overdue_items.append(item.to_dict())
            
            # Calculate laundry load suggestions
            laundry_suggestions = LaundryIntelligenceService._suggest_laundry_loads(
                urgent_items + high_priority
            )
            
            return {
                'urgent_items': urgent_items,
                'high_priority': high_priority,
                'medium_priority': medium_priority,
                'overdue_items': overdue_items,
                'total_items_needing_wash': len(urgent_items) + len(high_priority),
                'laundry_suggestions': laundry_suggestions,
                'clean_items_available': len([item for item in items if item.is_clean]),
                'total_items': len(items)
            }
            
        except Exception as e:
            print(f"Error getting laundry alerts: {e}")
            return {}
    
    @staticmethod
    def _suggest_laundry_loads(items_needing_wash: List[Dict]) -> List[Dict]:
        """Suggest optimal laundry loads based on colors and fabric types"""
        if not items_needing_wash:
            return []
        
        # Group by color categories
        whites = []
        darks = []
        colors = []
        delicates = []
        
        for item in items_needing_wash:
            color = item.get('color', '').lower()
            fabric = item.get('fabric', '').lower()
            
            # Check for delicates first
            if ('silk' in fabric or 'wool' in fabric or 'lace' in fabric or 
                item.get('dry_clean_only', False)):
                delicates.append(item)
            # Then categorize by color
            elif any(white_color in color for white_color in ['white', 'cream', 'ivory', 'beige']):
                whites.append(item)
            elif any(dark_color in color for dark_color in ['black', 'navy', 'dark', 'charcoal']):
                darks.append(item)
            else:
                colors.append(item)
        
        # Create load suggestions
        suggestions = []
        
        if whites:
            suggestions.append({
                'load_type': 'Whites',
                'items': whites,
                'count': len(whites),
                'temperature': 'hot',
                'priority': 'high' if any(item.get('wash_urgency') == 'urgent' for item in whites) else 'medium'
            })
        
        if darks:
            suggestions.append({
                'load_type': 'Darks',
                'items': darks,
                'count': len(darks),
                'temperature': 'cold',
                'priority': 'high' if any(item.get('wash_urgency') == 'urgent' for item in darks) else 'medium'
            })
        
        if colors:
            suggestions.append({
                'load_type': 'Colors',
                'items': colors,
                'count': len(colors),
                'temperature': 'warm',
                'priority': 'high' if any(item.get('wash_urgency') == 'urgent' for item in colors) else 'medium'
            })
        
        if delicates:
            suggestions.append({
                'load_type': 'Delicates',
                'items': delicates,
                'count': len(delicates),
                'temperature': 'cold',
                'priority': 'medium',
                'special_care': True
            })
        
        return suggestions
    
    @staticmethod
    def get_wardrobe_health_score(user_id: int) -> Dict[str, Any]:
        """Calculate overall wardrobe health metrics"""
        try:
            items = ClothingItem.query.filter_by(user_id=user_id).all()
            
            if not items:
                return {
                    'score': 100, 
                    'message': 'No items in wardrobe yet - add some clothes to get started!',
                    'clean_items': 0,
                    'total_items': 0,
                    'items_needing_wash': 0,
                    'overdue_items': 0,
                    'clean_percentage': 100,
                    'recommendations': ['Add some clothing items to your wardrobe to start tracking!']
                }
            
            total_items = len(items)
            clean_items = len([item for item in items if item.is_clean])
            items_needing_wash = len([item for item in items if item.needs_washing])
            overdue_items = len([item for item in items if item.last_worn and 
                               (datetime.utcnow() - item.last_worn).days > 30])
            
            # Calculate score (0-100)
            clean_ratio = clean_items / total_items
            wash_ratio = items_needing_wash / total_items
            overdue_ratio = overdue_items / total_items
            
            # Score calculation
            score = (clean_ratio * 50) + ((1 - wash_ratio) * 30) + ((1 - overdue_ratio) * 20)
            score = min(100, max(0, score))
            
            # Determine message
            if score >= 90:
                message = "Excellent! Your wardrobe is well-maintained."
            elif score >= 75:
                message = "Good! Just a few items need attention."
            elif score >= 60:
                message = "Fair. Consider doing laundry soon."
            elif score >= 40:
                message = "Poor. Several items need washing."
            else:
                message = "Critical! Time for a laundry day!"
            
            return {
                'score': round(score),
                'message': message,
                'clean_items': clean_items,
                'total_items': total_items,
                'items_needing_wash': items_needing_wash,
                'overdue_items': overdue_items,
                'clean_percentage': round((clean_items / total_items) * 100),
                'recommendations': LaundryIntelligenceService._get_health_recommendations(
                    clean_ratio, wash_ratio, overdue_ratio
                )
            }
            
        except Exception as e:
            print(f"Error calculating wardrobe health: {e}")
            return {'score': 0, 'message': 'Error calculating score'}
    
    @staticmethod
    def _get_health_recommendations(clean_ratio: float, wash_ratio: float, overdue_ratio: float) -> List[str]:
        """Get personalized recommendations based on wardrobe health"""
        recommendations = []
        
        if clean_ratio < 0.7:
            recommendations.append("🧺 Start a laundry load to increase your clean clothes options")
        
        if wash_ratio > 0.3:
            recommendations.append("⚠️ Many items need washing - consider batch processing")
        
        if overdue_ratio > 0.2:
            recommendations.append("👔 You have unused items - try mixing up your style!")
        
        if clean_ratio > 0.9:
            recommendations.append("✨ Great job maintaining your wardrobe!")
        
        if not recommendations:
            recommendations.append("🎯 Your wardrobe management is on track!")
        
        return recommendations