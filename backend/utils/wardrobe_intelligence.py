from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from sqlalchemy import func, distinct, cast, Date
from models import ClothingItem, Outfit, User, UserActivity, db
from collections import defaultdict, Counter
import json
import statistics

class WardrobeIntelligenceService:
    
    @staticmethod
    def get_smart_collections(user_id: int) -> Dict[str, Any]:
        """Generate smart collections based on user's wardrobe and patterns"""
        try:
            items = ClothingItem.query.filter_by(user_id=user_id).all()
            outfits = Outfit.query.filter_by(user_id=user_id).all()
            
            collections = {}
            
            # Work/Professional Collection
            work_items = [
                item.to_dict() for item in items 
                if item.style and 'formal' in item.style.lower() or 'business' in item.style.lower()
                or any(tag in (item.mood_tags or '') for tag in ['professional', 'formal'])
            ]
            if work_items:
                collections['work'] = {
                    'name': '👔 Work & Professional',
                    'items': work_items,
                    'count': len(work_items),
                    'description': 'Your professional wardrobe essentials'
                }
            
            # Casual Weekend Collection
            casual_items = [
                item.to_dict() for item in items 
                if item.style and 'casual' in item.style.lower()
                or any(tag in (item.mood_tags or '') for tag in ['casual', 'cozy'])
            ]
            if casual_items:
                collections['casual'] = {
                    'name': '😌 Casual & Weekend',
                    'items': casual_items,
                    'count': len(casual_items),
                    'description': 'Relaxed and comfortable pieces'
                }
            
            # Date Night/Special Occasions
            special_items = [
                item.to_dict() for item in items 
                if item.style and ('elegant' in item.style.lower() or 'trendy' in item.style.lower())
                or any(tag in (item.mood_tags or '') for tag in ['date', 'party', 'elegant'])
            ]
            if special_items:
                collections['special'] = {
                    'name': '💕 Date Night & Special',
                    'items': special_items,
                    'count': len(special_items),
                    'description': 'For special occasions and nights out'
                }
            
            # Active/Sporty Collection
            active_items = [
                item.to_dict() for item in items 
                if item.style and 'sporty' in item.style.lower()
                or any(tag in (item.mood_tags or '') for tag in ['sporty', 'athletic'])
                or item.type in ['workout', 'athletic', 'sportswear']
            ]
            if active_items:
                collections['active'] = {
                    'name': '🏃‍♂️ Active & Sporty',
                    'items': active_items,
                    'count': len(active_items),
                    'description': 'For workouts and active days'
                }
            
            # Seasonal Collections
            current_season = WardrobeIntelligenceService._get_current_season()
            seasonal_items = [
                item.to_dict() for item in items 
                if item.season == current_season or item.season == 'all'
            ]
            if seasonal_items:
                collections['seasonal'] = {
                    'name': f'🌟 {current_season.title()} Favorites',
                    'items': seasonal_items,
                    'count': len(seasonal_items),
                    'description': f'Perfect for {current_season} weather'
                }
            
            # Most Worn Collection (based on actual data)
            most_worn_items = sorted(
                [item for item in items if (item.wear_count or 0) > 0],
                key=lambda x: x.wear_count or 0,
                reverse=True
            )[:10]
            
            if most_worn_items:
                collections['favorites'] = {
                    'name': '⭐ Your Favorites',
                    'items': [item.to_dict() for item in most_worn_items],
                    'count': len(most_worn_items),
                    'description': 'Your most-worn items'
                }
            
            # Underused Collection (for rotation suggestions)
            underused_items = [
                item for item in items 
                if (item.wear_count or 0) < 2 and item.created_at 
                and (datetime.utcnow() - item.created_at).days > 30
            ]
            
            if underused_items:
                collections['underused'] = {
                    'name': '💤 Ready for Rotation',
                    'items': [item.to_dict() for item in underused_items],
                    'count': len(underused_items),
                    'description': 'Great pieces waiting to be rediscovered'
                }
            
            return collections
            
        except Exception as e:
            print(f"Error generating smart collections: {e}")
            return {}
    
    @staticmethod
    def get_wardrobe_gaps(user_id: int) -> Dict[str, Any]:
        """Analyze wardrobe for missing pieces and imbalances"""
        try:
            items = ClothingItem.query.filter_by(user_id=user_id).all()
            
            # Count by type
            type_counts = Counter(item.type.lower() for item in items)
            
            # Count by style
            style_counts = Counter(
                item.style.lower() for item in items 
                if item.style
            )
            
            # Count by color families
            color_families = defaultdict(int)
            for item in items:
                if item.color:
                    color = item.color.lower()
                    if any(c in color for c in ['black', 'dark', 'charcoal']):
                        color_families['darks'] += 1
                    elif any(c in color for c in ['white', 'cream', 'ivory', 'beige']):
                        color_families['lights'] += 1
                    elif any(c in color for c in ['blue', 'navy']):
                        color_families['blues'] += 1
                    elif any(c in color for c in ['red', 'pink', 'burgundy']):
                        color_families['reds'] += 1
                    else:
                        color_families['colors'] += 1
            
            gaps = []
            recommendations = []
            
            # Basic wardrobe essentials check
            essentials = {
                'tops': ['t-shirt', 'shirt', 'blouse'],
                'bottoms': ['pants', 'jeans'],
                'shoes': ['shoes', 'sneakers'],
                'outerwear': ['jacket', 'coat']
            }
            
            for category, types in essentials.items():
                category_count = sum(type_counts.get(t, 0) for t in types)
                if category_count < 3:
                    gaps.append({
                        'category': category,
                        'severity': 'high' if category_count == 0 else 'medium',
                        'message': f"You need more {category}",
                        'suggestion': f"Consider adding {3 - category_count} more {category} pieces"
                    })
            
            # Style balance check
            if len(style_counts) < 2:
                gaps.append({
                    'category': 'style_variety',
                    'severity': 'medium',
                    'message': "Limited style variety",
                    'suggestion': "Try adding pieces in different styles (casual, formal, trendy)"
                })
            
            # Color balance check
            if len(color_families) < 3:
                gaps.append({
                    'category': 'color_variety',
                    'severity': 'low',
                    'message': "Limited color palette",
                    'suggestion': "Consider adding more color variety to your wardrobe"
                })
            
            # Seasonal readiness
            current_season = WardrobeIntelligenceService._get_current_season()
            seasonal_items = [
                item for item in items 
                if item.season == current_season or item.season == 'all'
            ]
            
            if len(seasonal_items) < len(items) * 0.6:
                gaps.append({
                    'category': 'seasonal',
                    'severity': 'medium',
                    'message': f"Limited {current_season} wardrobe",
                    'suggestion': f"Add more {current_season}-appropriate pieces"
                })
            
            return {
                'gaps': gaps,
                'type_distribution': dict(type_counts),
                'style_distribution': dict(style_counts),
                'color_distribution': dict(color_families),
                'total_items': len(items),
                'recommendations': WardrobeIntelligenceService._generate_shopping_recommendations(gaps, type_counts)
            }
            
        except Exception as e:
            print(f"Error analyzing wardrobe gaps: {e}")
            return {}
    
    @staticmethod
    def get_enhanced_outfit_suggestions(user_id: int, mood: str, weather: str) -> Dict[str, Any]:
        """Generate outfit suggestions based on user's actual wear patterns"""
        try:
            items = ClothingItem.query.filter_by(user_id=user_id, is_clean=True).all()
            recent_outfits = Outfit.query.filter_by(user_id=user_id)\
                                       .filter(Outfit.date >= datetime.utcnow() - timedelta(days=14))\
                                       .all()
            
            # Get recently worn items to avoid
            recently_worn = set()
            for outfit in recent_outfits:
                for item in outfit.clothing_items:
                    recently_worn.add(item.id)
            
            # Prioritize underused items
            underused_items = [
                item for item in items 
                if item.id not in recently_worn and (item.wear_count or 0) < 3
            ]
            
            # Get mood-appropriate items
            mood_appropriate = []
            for item in items:
                if item.mood_tags:
                    tags = json.loads(item.mood_tags) if isinstance(item.mood_tags, str) else item.mood_tags
                    if mood.lower() in [tag.lower() for tag in tags]:
                        mood_appropriate.append(item)
            
            # Combine strategies
            prioritized_items = []
            
            # First priority: underused + mood appropriate
            for item in underused_items:
                if item in mood_appropriate:
                    prioritized_items.append(item)
            
            # Second priority: just mood appropriate
            for item in mood_appropriate:
                if item not in prioritized_items:
                    prioritized_items.append(item)
            
            # Third priority: underused items
            for item in underused_items:
                if item not in prioritized_items:
                    prioritized_items.append(item)
            
            # Fill with other clean items
            for item in items:
                if item not in prioritized_items and item.id not in recently_worn:
                    prioritized_items.append(item)
            
            return {
                'prioritized_items': [item.to_dict() for item in prioritized_items],
                'underused_count': len(underused_items),
                'mood_matches': len(mood_appropriate),
                'recently_worn_avoided': len(recently_worn),
                'strategy_used': 'pattern_based'
            }
            
        except Exception as e:
            print(f"Error generating enhanced suggestions: {e}")
            return {}
    
    @staticmethod
    def _get_current_season() -> str:
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
    
    @staticmethod
    def _generate_shopping_recommendations(gaps: List[Dict], type_counts: Counter) -> List[str]:
        """Generate specific shopping recommendations based on gaps"""
        recommendations = []
        
        for gap in gaps:
            if gap['category'] == 'tops' and gap['severity'] == 'high':
                recommendations.append("🛍️ Priority: Add basic tops (white shirt, neutral t-shirt)")
            elif gap['category'] == 'bottoms' and gap['severity'] == 'high':
                recommendations.append("👖 Priority: Add versatile bottoms (dark jeans, neutral pants)")
            elif gap['category'] == 'shoes':
                recommendations.append("👟 Consider: Add comfortable everyday shoes")
            elif gap['category'] == 'outerwear':
                recommendations.append("🧥 Seasonal: Add weather-appropriate outerwear")
        
        if not recommendations:
            recommendations.append("✨ Your wardrobe has good coverage! Focus on quality over quantity.")
        
        return recommendations

class AnalyticsService:
    
    @staticmethod
    def get_daily_active_users(days=30):
        """
        Calculates the number of unique daily active users for the last N days.
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        daily_counts = db.session.query(
            cast(UserActivity.timestamp, Date).label('activity_date'),
            func.count(distinct(UserActivity.user_id))
        ).filter(
            UserActivity.timestamp >= start_date
        ).group_by(
            cast(UserActivity.timestamp, Date)
        ).order_by(
            'activity_date'
        ).all()
        
        # Format the data for charting
        chart_data = []
        # Create a dictionary for quick lookups
        counts_dict = {date.strftime('%Y-%m-%d'): count for date, count in daily_counts}
        
        # Ensure all days in the range are present, even if they have 0 activity
        for i in range(days):
            date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
            chart_data.append({
                'date': date,
                'active_users': counts_dict.get(date, 0)
            })
            
        return chart_data

    @staticmethod
    def get_mrr():
        """
        Calculates the estimated Monthly Recurring Revenue (MRR).
        Assumes a fixed price per premium user.
        """
        PREMIUM_PRICE = 10.00 # Assumed price in USD
        premium_user_count = User.query.filter_by(is_premium=True).count()
        mrr = premium_user_count * PREMIUM_PRICE
        return {
            'mrr': round(mrr, 2),
            'premium_users': premium_user_count,
            'price_per_user': PREMIUM_PRICE
        }

    @staticmethod
    def get_premium_conversion_rate():
        """
        Calculates the percentage of total users who are premium subscribers.
        """
        total_users = User.query.count()
        if total_users == 0:
            return {'rate': 0, 'total_users': 0, 'premium_users': 0}
            
        premium_users = User.query.filter_by(is_premium=True).count()
        conversion_rate = (premium_users / total_users) * 100 if total_users > 0 else 0
        
        return {
            'rate': round(conversion_rate, 2),
            'total_users': total_users,
            'premium_users': premium_users
        }
    
    @staticmethod
    def get_usage_analytics(user_id: int) -> Dict[str, Any]:
        """Get comprehensive usage analytics for user's wardrobe"""
        try:
            items = ClothingItem.query.filter_by(user_id=user_id).all()
            outfits = Outfit.query.filter_by(user_id=user_id).all()
            
            # Most/Least worn analysis
            items_with_wear = [(item, item.wear_count or 0) for item in items]
            items_with_wear.sort(key=lambda x: x[1], reverse=True)
            
            most_worn = [item.to_dict() for item, count in items_with_wear[:5] if count > 0]
            least_worn = [item.to_dict() for item, count in items_with_wear[-5:] if count == 0]
            
            # Cost per wear analysis
            cost_per_wear_items = []
            for item in items:
                if item.purchase_cost and item.wear_count and item.wear_count > 0:
                    cpw = item.purchase_cost / item.wear_count
                    cost_per_wear_items.append({
                        **item.to_dict(),
                        'cost_per_wear': round(cpw, 2)
                    })
            
            cost_per_wear_items.sort(key=lambda x: x['cost_per_wear'])
            
            # Color analysis
            color_usage = Counter()
            for item in items:
                if item.color and item.wear_count:
                    color_usage[item.color.lower()] += item.wear_count
            
            # Monthly wear patterns
            monthly_patterns = defaultdict(int)
            for outfit in outfits:
                month_key = outfit.date.strftime('%Y-%m')
                monthly_patterns[month_key] += 1
            
            # Mood preferences
            mood_patterns = Counter()
            for outfit in outfits:
                if outfit.mood:
                    mood_patterns[outfit.mood] += 1
            
            # Calculate wardrobe value
            total_cost = sum(item.purchase_cost or 0 for item in items)
            total_wears = sum(item.wear_count or 0 for item in items)
            avg_cost_per_wear = total_cost / total_wears if total_wears > 0 else 0
            
            return {
                'most_worn_items': most_worn,
                'least_worn_items': least_worn,
                'best_value_items': cost_per_wear_items[:5],
                'worst_value_items': cost_per_wear_items[-5:] if len(cost_per_wear_items) > 5 else [],
                'color_preferences': dict(color_usage.most_common(10)),
                'monthly_wear_patterns': dict(monthly_patterns),
                'mood_preferences': dict(mood_patterns),
                'wardrobe_value': {
                    'total_cost': round(total_cost, 2),
                    'total_wears': total_wears,
                    'average_cost_per_wear': round(avg_cost_per_wear, 2),
                    'total_items': len(items),
                    'items_with_cost': len([i for i in items if i.purchase_cost])
                },
                'efficiency_metrics': AnalyticsService._calculate_efficiency_metrics(items, outfits)
            }
            
        except Exception as e:
            print(f"Error generating usage analytics: {e}")
            return {}
    
    @staticmethod
    def _calculate_efficiency_metrics(items: List, outfits: List) -> Dict[str, Any]:
        """Calculate wardrobe efficiency metrics"""
        try:
            total_items = len(items)
            worn_items = len([item for item in items if (item.wear_count or 0) > 0])
            
            utilization_rate = (worn_items / total_items * 100) if total_items > 0 else 0
            
            # Average wears per item
            total_wears = sum(item.wear_count or 0 for item in items)
            avg_wears_per_item = total_wears / total_items if total_items > 0 else 0
            
            # Outfit frequency
            if outfits:
                first_outfit = min(outfit.date for outfit in outfits)
                days_tracked = (datetime.utcnow() - first_outfit).days
                outfits_per_week = len(outfits) / (days_tracked / 7) if days_tracked > 0 else 0
            else:
                outfits_per_week = 0
            
            return {
                'utilization_rate': round(utilization_rate, 1),
                'average_wears_per_item': round(avg_wears_per_item, 1),
                'outfits_per_week': round(outfits_per_week, 1),
                'worn_items': worn_items,
                'unworn_items': total_items - worn_items
            }
            
        except Exception as e:
            print(f"Error calculating efficiency metrics: {e}")
            return {}