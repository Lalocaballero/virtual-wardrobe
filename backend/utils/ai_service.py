import openai
import json
from typing import List, Dict, Any
import re
import random
import time
from collections import Counter

class AIOutfitService:
    def __init__(self, api_key: str):
        if api_key:
            openai.api_key = api_key
            self.client_available = True
        else:
            self.client_available = False
            print("⚠️  OpenAI API key not provided - using fallback outfit suggestions")
    
    def generate_outfit_suggestion(self, wardrobe: List[Dict], weather: str, mood: str, season: str = "any", outfit_history: List[Dict] = None) -> Dict[str, Any]:
        """Generate outfit suggestion using OpenAI with enhanced prompting"""
        
        # Filter available (clean) items
        available_items = [item for item in wardrobe if item.get('is_clean', True)]
        
        if not available_items:
            return {
                "selected_items": [],
                "reasoning": "No clean items available in your wardrobe. Time to do some laundry! 🧺",
                "style_notes": "Clean your clothes first, then come back for outfit suggestions.",
                "confidence": 0.0
            }
        
        # If no OpenAI client, use enhanced fallback
        if not self.client_available:
            return self._enhanced_fallback_outfit_suggestion(available_items, weather, mood)
        
        # Create enhanced prompt with randomization
        prompt = self._create_enhanced_outfit_prompt(available_items, weather, mood, season, outfit_history)
        
        try:
            # Add randomization to temperature and other parameters
            temperature = random.uniform(0.7, 1.0)  # Vary temperature for different results
            
            response = openai.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=1500,
                presence_penalty=0.1,  # Encourage variety
                frequency_penalty=0.1   # Avoid repetition
            )
            
            content = response.choices[0].message.content.strip()
            
            # Try to parse JSON response
            try:
                # Extract JSON from response (handle cases where AI adds extra text)
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                    
                    # Validate the response structure
                    if self._validate_ai_response(result, available_items):
                        return result
                    else:
                        print("AI response validation failed, using fallback")
                        return self._enhanced_fallback_outfit_suggestion(available_items, weather, mood)
                else:
                    print("No JSON found in AI response, using fallback")
                    return self._enhanced_fallback_outfit_suggestion(available_items, weather, mood)
                    
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                return self._parse_ai_text_response(content, available_items, weather, mood)
            
        except Exception as e:
            print(f"AI service error: {e}")
            return self._enhanced_fallback_outfit_suggestion(available_items, weather, mood)
    
    def _get_system_prompt(self) -> str:
        """Generates the comprehensive system prompt for the AI model."""
        return """
You are a highly intelligent, data-driven, and adaptive personal fashion stylist. Your name is WeWear AI. Your primary goal is to become a trusted style advisor for the user by learning their unique taste and providing brilliant, personalized outfit suggestions.

**Your Core Task:**
Analyze the user's request, their personal style profile (Style DNA), their outfit history, and their available wardrobe to create a stylish, practical, and appropriate outfit.

**Understanding the Input You Will Receive:**

You will be given a prompt with the following structure:

1.  **OUTFIT REQUEST:** The user's immediate requirements for the outfit.
    *   `Weather`: The current weather conditions. This is a critical factor.
    *   `Mood`: The mood or occasion for the outfit (e.g., 'casual', 'professional', 'date night').
    *   `Season`: The season the user wants an outfit for (e.g., 'Summer', 'Winter'). This is a HARD constraint.

2.  **USER STYLE DNA:** A summary of the user's general preferences, calculated from their wardrobe and past choices.
    *   `dominant_styles`: The styles the user wears most often.
    *   `favorite_colors`: The colors that appear frequently in their wardrobe.
    *   `preferred_brands`: Brands the user seems to favor.
    *   **How to use this:** This is your primary guide to the user's overall taste. Prioritize items that match this profile.

3.  **USER'S OUTFIT HISTORY:** Concrete examples of outfits the user has previously worn and liked.
    *   **How to use this:** This is your most powerful learning tool. Analyze these combinations to understand what the user considers a good outfit. Identify patterns in how they pair items, styles, and colors. Use this as inspiration for new, similar combinations.

4.  **AVAILABLE WARDROBE:** A categorized list of the user's currently available (clean) clothing items with detailed attributes.

**Your Decision-Making Process (Hierarchy of Importance):**

1.  **PRIORITY 1: Season & Weather (Non-negotiable):** The outfit MUST be appropriate for the specified `Season` and `Weather`. A winter coat is not for summer. Sandals are not for snow.
2.  **PRIORITY 2: User's Personal Style (Crucial):** The outfit MUST align with the user's `STYLE DNA` and `OUTFIT HISTORY`. The suggestion should feel like it was made specifically for them. Refer to their dominant styles, colors, and past choices.
3.  **PRIORITY 3: Mood & Occasion:** The `Mood` should refine the selection. A 'professional' outfit should be more formal than a 'casual' one, but still within the user's personal style.
4.  **PRIORITY 4: Variety & Creativity:** While respecting the user's style, introduce some variety. Don't suggest the exact same outfit repeatedly. Use the `Special instruction` to guide your creativity.

**Output Requirements:**
You MUST respond ONLY with a valid JSON object. Do not include any text before or after the JSON. The JSON object must have the exact following structure:
{
    "selected_items": [array of integer item IDs],
    "reasoning": "Detailed explanation of your choices. Explain HOW the outfit fits the user's Style DNA and History, and WHY it is appropriate for the season, weather, and mood.",
    "style_notes": "Actionable styling tips (e.g., 'Tuck the shirt in', 'Roll up the sleeves', 'Consider adding a belt').",
    "color_story": "A brief, evocative description of the color palette.",
    "weather_notes": "Specific notes on how the outfit choice addresses the weather conditions.",
    "confidence": 0.95
}
"""
    
    def _create_enhanced_outfit_prompt(self, wardrobe: List[Dict], weather: str, mood: str, season: str, outfit_history: List[Dict] = None) -> str:
        # Get recently worn items to avoid repetition
        recent_item_ids = []
        if outfit_history:
            for outfit in outfit_history[-5:]:  # Last 5 outfits
                recent_item_ids.extend([item['id'] for item in outfit.get('clothing_items', [])])
        
        # Organize wardrobe by category for better AI understanding
        wardrobe_by_category = {
            'tops': [], 'bottoms': [], 'outerwear': [],
            'shoes': [], 'accessories': [], 'dresses': []
        }
        for item in wardrobe:
            item_type = item['type'].lower()
            if item_type in ['shirt', 't-shirt', 'blouse', 'sweater', 'tank-top']:
                wardrobe_by_category['tops'].append(item)
            elif item_type in ['pants', 'jeans', 'shorts', 'skirt', 'leggings']:
                wardrobe_by_category['bottoms'].append(item)
            elif item_type in ['jacket', 'coat', 'cardigan', 'blazer']:
                wardrobe_by_category['outerwear'].append(item)
            elif item_type in ['shoes', 'sneakers', 'boots', 'sandals', 'heels']:
                wardrobe_by_category['shoes'].append(item)
            elif item_type == 'dress':
                wardrobe_by_category['dresses'].append(item)
            else:
                wardrobe_by_category['accessories'].append(item)

        # Get User's Style DNA
        style_dna = self._get_style_dna(wardrobe, outfit_history)
        style_dna_prompt_section = ""
        if style_dna:
            style_dna_prompt_section = f"USER STYLE DNA (for personalization):\n{json.dumps(style_dna, indent=2)}\n"

        # --- NEW: Format Outfit History for Learning ---
        history_prompt_section = ""
        if outfit_history:
            liked_outfits_examples = []
            for outfit in outfit_history[-5:]: # Take last 5 approved outfits as examples
                example = {
                    "mood": outfit.get("mood"),
                    "weather": outfit.get("weather"),
                    "items": [
                        {
                            "name": item.get("name"),
                            "type": item.get("type"),
                            "style": item.get("style"),
                            "color": item.get("color"),
                        }
                        for item in outfit.get("clothing_items", [])
                    ],
                }
                liked_outfits_examples.append(example)
            
            if liked_outfits_examples:
                history_prompt_section = f"""USER'S OUTFIT HISTORY (Examples of what they like):
{json.dumps(liked_outfits_examples, indent=2)}
"""

        mood_contexts = {
            'casual': ['relaxed and comfortable', 'everyday and effortless', 'laid-back and easy-going'],
            'professional': ['workplace appropriate and polished', 'business attire with confidence', 'professional and sophisticated'],
            'sporty': ['athletic and active', 'performance-oriented and dynamic', 'sporty and energetic'],
            'cozy': ['warm and comfortable', 'soft and homey', 'snug and relaxed'],
            'date': ['romantic and attractive', 'charming and special', 'alluring and confident'],
            'party': ['fun and festive', 'eye-catching and social', 'vibrant and celebratory'],
            'elegant': ['sophisticated and refined', 'graceful and classy', 'timeless and polished'],
            'trendy': ['fashionable and current', 'stylish and modern', 'on-trend and fresh']
        }
        mood_context = random.choice(mood_contexts.get(mood, ['general everyday wear']))

        variety_instruction = random.choice([
            "Try a different color combination than usual.", "Experiment with layering techniques.",
            "Consider unexpected but stylish pairings.", "Focus on texture mixing for visual interest.",
            "Think about proportion balance in the outfit."
        ])
        
        timestamp = int(time.time())
        item_fields_to_include = ['id', 'name', 'color', 'style', 'fabric', 'season', 'brand', 'mood_tags']
        
        prompt = f"""
OUTFIT REQUEST #{timestamp}:
Weather: {weather}
Mood: {mood} ({mood_context})
Season: {season}

{style_dna_prompt_section}
{history_prompt_section}
CONTEXT:
- Recently worn items to avoid (IDs): {recent_item_ids}
- Special instruction: {variety_instruction}

AVAILABLE WARDROBE:
Tops: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['tops']], indent=2)}
Bottoms: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['bottoms']], indent=2)}
Outerwear: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['outerwear']], indent=2)}
Shoes: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['shoes']], indent=2)}
Dresses: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['dresses']], indent=2)}
Accessories: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['accessories']], indent=2)}

REQUIREMENTS:
1. Create a weather-appropriate and SEASONALLY-APPROPRIATE outfit for a '{mood}' mood. The user's requested season is '{season}'.
2. **Personalize the outfit based on the user's STYLE DNA and OUTFIT HISTORY.** This is crucial.
3. AVOID recently worn items when possible (see IDs above).
4. Ensure color coordination and style harmony.
5. Consider layering for weather conditions.
6. Include essential pieces (top + bottom OR dress, plus shoes).
7. Add outerwear/accessories if weather/mood appropriate.
8. {variety_instruction}
9. BE CREATIVE and suggest different combinations each time.

RESPONSE FORMAT (JSON only):
{{
    "selected_items": [array of item IDs as integers],
    "reasoning": "Detailed explanation of outfit choice, how it fits the user's style DNA and history, and why it is appropriate for the season and weather.",
    "style_notes": "Specific styling tips, layering advice, or accessory suggestions",
    "color_story": "Brief description of the color palette and why it works",
    "weather_notes": "How this outfit addresses the weather conditions",
    "confidence": 0.95
}}
"""
        return prompt

    def _get_style_dna(self, wardrobe: List[Dict], outfit_history: List[Dict]) -> Dict[str, Any]:
        """Analyzes wardrobe and outfit history to create a user style profile."""
        
        # Counters for different attributes
        style_counter = Counter()
        color_counter = Counter()
        brand_counter = Counter()
        fabric_counter = Counter()
        
        # Analyze the entire wardrobe as a baseline
        for item in wardrobe:
            if item.get('style'):
                style_counter[item['style']] += 1
            if item.get('color'):
                color_counter[item['color']] += 1
            if item.get('brand'):
                brand_counter[item['brand']] += 1
            if item.get('fabric'):
                fabric_counter[item['fabric']] += 1
                
        # Give more weight to items that have been worn in outfits
        if outfit_history:
            for outfit in outfit_history:
                for item in outfit.get('clothing_items', []):
                    if item.get('style'):
                        style_counter[item['style']] += 2 # Extra weight for worn items
                    if item.get('color'):
                        color_counter[item['color']] += 2
                    if item.get('brand'):
                        brand_counter[item['brand']] += 2
                    if item.get('fabric'):
                        fabric_counter[item['fabric']] += 2

        # Construct the Style DNA profile
        style_dna = {
            "dominant_styles": [style for style, count in style_counter.most_common(3)],
            "favorite_colors": [color for color, count in color_counter.most_common(3)],
            "preferred_brands": [brand for brand, count in brand_counter.most_common(3)],
            "common_fabrics": [fabric for fabric, count in fabric_counter.most_common(3)]
        }
        
        # Filter out empty lists
        style_dna = {key: value for key, value in style_dna.items() if value}
        
        return style_dna

    # Keep all other methods the same, but add randomization to fallback
    def _enhanced_fallback_outfit_suggestion(self, available_items: List[Dict], weather: str, mood: str) -> Dict[str, Any]:
        """Enhanced fallback with basic styling logic and randomization"""
        
        # Categorize items
        tops = [item for item in available_items if item['type'] in ['shirt', 'blouse', 't-shirt', 'sweater']]
        bottoms = [item for item in available_items if item['type'] in ['pants', 'jeans', 'skirt', 'shorts']]
        dresses = [item for item in available_items if item['type'] == 'dress']
        shoes = [item for item in available_items if item['type'] in ['shoes', 'sneakers', 'boots']]
        outerwear = [item for item in available_items if item['type'] in ['jacket', 'coat', 'cardigan']]
        
        # RANDOMIZE selection
        if tops: random.shuffle(tops)
        if bottoms: random.shuffle(bottoms)
        if dresses: random.shuffle(dresses)
        if shoes: random.shuffle(shoes)
        if outerwear: random.shuffle(outerwear)
        
        selected = []
        reasoning_parts = []
        
        # Weather-based logic
        temp_info = self._extract_temperature(weather)
        is_cold = temp_info < 15 if temp_info else 'cold' in weather.lower()
        is_rainy = 'rain' in weather.lower() or 'shower' in weather.lower()
        
        # Choose main pieces (with randomization)
        if dresses and mood in ['date', 'elegant', 'party'] and random.random() > 0.3:
            # Prefer dress for special occasions (but not always)
            dress = dresses[0]  # Already shuffled
            selected.append(dress['id'])
            reasoning_parts.append(f"Selected {dress['name']} as it's perfect for a {mood} mood")
        else:
            # Top + bottom combination
            if tops:
                top = tops[0]  # Already shuffled
                selected.append(top['id'])
                reasoning_parts.append(f"Chose {top['name']} for the top")
            
            if bottoms:
                bottom = bottoms[0]  # Already shuffled
                selected.append(bottom['id'])
                reasoning_parts.append(f"Paired with {bottom['name']} for the bottom")
        
        # Add shoes
        if shoes:
            shoe = shoes[0]  # Already shuffled
            selected.append(shoe['id'])
            reasoning_parts.append(f"Added {shoe['name']} to complete the look")
        
        # Add outerwear for cold weather (sometimes)
        if (is_cold or is_rainy) and outerwear and random.random() > 0.4:
            jacket = outerwear[0]  # Already shuffled
            selected.append(jacket['id'])
            reasoning_parts.append(f"Added {jacket['name']} for warmth/protection")
        
        return {
            "selected_items": selected,
            "reasoning": ". ".join(reasoning_parts) + f". This combination works well for {mood} mood and {weather} weather.",
            "style_notes": self._get_mood_style_tips(mood),
            "weather_notes": f"Appropriate for {weather} conditions",
            "confidence": round(random.uniform(0.6, 0.8), 2)  # Randomize confidence
        }
    
    # Keep all other methods the same...
    def _validate_ai_response(self, response: Dict, available_items: List[Dict]) -> bool:
        """Validate AI response structure and content"""
        required_keys = ['selected_items', 'reasoning', 'style_notes', 'confidence']
        
        # Check required keys
        if not all(key in response for key in required_keys):
            return False
        
        # Check selected_items is a list of valid IDs
        if not isinstance(response['selected_items'], list):
            return False
            
        available_ids = {item['id'] for item in available_items}
        for item_id in response['selected_items']:
            if not isinstance(item_id, int) or item_id not in available_ids:
                return False
        
        # Check reasoning is a non-empty string
        if not isinstance(response['reasoning'], str) or len(response['reasoning'].strip()) < 10:
            return False
        
        # Check confidence is a number between 0 and 1
        if not isinstance(response['confidence'], (int, float)) or not 0 <= response['confidence'] <= 1:
            return False
        
        return True
    
    def _parse_ai_text_response(self, content: str, available_items: List[Dict], weather: str, mood: str) -> Dict[str, Any]:
        """Parse AI response when JSON fails"""
        # Try to extract item names/IDs from text
        selected_items = []
        
        # Look for item IDs in the text
        import re
        id_matches = re.findall(r'\b\d+\b', content)
        available_ids = {item['id'] for item in available_items}
        
        for match in id_matches:
            item_id = int(match)
            if item_id in available_ids:
                selected_items.append(item_id)
        
        # If no valid IDs found, use fallback
        if not selected_items:
            return self._enhanced_fallback_outfit_suggestion(available_items, weather, mood)
        
        return {
            "selected_items": selected_items,
            "reasoning": content[:300] + "..." if len(content) > 300 else content,
            "style_notes": "AI-generated outfit suggestion",
            "confidence": 0.7
        }
    
    def _select_by_mood(self, items: List[Dict], mood: str) -> Dict:
        """Select item based on mood preferences"""
        if not items:
            return None
        
        # Mood preferences
        mood_styles = {
            'professional': ['formal', 'business'],
            'casual': ['casual'],
            'sporty': ['sporty', 'athletic'],
            'elegant': ['elegant', 'formal'],
            'party': ['trendy', 'elegant'],
            'cozy': ['casual']
        }
        
        preferred_styles = mood_styles.get(mood, [])
        
        # Try to find item with preferred style
        for item in items:
            if item.get('style', '').lower() in preferred_styles:
                return item
        
        # Fallback to first item
        return items[0]
    
    def _extract_temperature(self, weather: str) -> int:
        """Extract temperature from weather string"""
        import re
        temp_match = re.search(r'(\d+)°?[CF]?', weather)
        return int(temp_match.group(1)) if temp_match else None
    
    def _get_mood_style_tips(self, mood: str) -> str:
        """Get styling tips based on mood"""
        tips = {
            'casual': "Keep it comfortable and relaxed. Roll up sleeves or add casual accessories.",
            'professional': "Ensure clean lines and polished appearance. Tuck in shirts and choose minimal accessories.",
            'sporty': "Focus on comfort and functionality. Layer appropriately for activity level.",
            'cozy': "Prioritize soft textures and comfort. Don't be afraid to layer for extra warmth.",
            'date': "Balance comfort with attractiveness. Pay attention to fit and choose flattering silhouettes.",
            'party': "Have fun with colors and textures. Accessories can elevate the look.",
            'elegant': "Focus on quality fabrics and classic silhouettes. Less is often more."
        }
        return tips.get(mood, "Choose pieces that make you feel confident and comfortable.")