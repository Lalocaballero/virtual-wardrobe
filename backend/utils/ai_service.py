from openai import OpenAI
import json
from typing import List, Dict, Any
import re
import random
import time
from collections import Counter
from datetime import datetime
class AIOutfitService:

    # A simplified color wheel for fashion.
    COLOR_WHEEL = [
        'red', 'red-orange', 'orange', 'yellow-orange', 'yellow', 
        'yellow-green', 'green', 'blue-green', 'blue', 'blue-violet', 
        'violet', 'red-violet'
    ]
    
    # Map common clothing colors to the wheel
    COLOR_MAP = {
        'pink': 'red', 'rose': 'red-violet', 'burgundy': 'red', 'maroon': 'red',
        'coral': 'red-orange', 'peach': 'orange', 'tan': 'yellow-orange', 'beige': 'yellow-orange',
        'mustard': 'yellow', 'gold': 'yellow', 'lime': 'yellow-green', 'olive': 'yellow-green',
        'teal': 'blue-green', 'turquoise': 'blue-green', 'aqua': 'blue-green', 'mint': 'green',
        'navy': 'blue', 'sky blue': 'blue', 'royal blue': 'blue', 'indigo': 'blue-violet',
        'purple': 'violet', 'lavender': 'violet', 'magenta': 'red-violet',
        # Neutrals are handled separately but can have undertones
        'brown': 'orange', 'cream': 'yellow', 'ivory': 'yellow',
    }

    def _get_color_relationships(self, color: str) -> Dict[str, List[str]]:
        """Finds analogous and complementary colors on the wheel."""
        color = color.lower()
        
        # Normalize color name
        base_color = self.COLOR_MAP.get(color, color)
        
        if base_color not in self.COLOR_WHEEL:
            return {"analogous": [], "complementary": []}
            
        idx = self.COLOR_WHEEL.index(base_color)
        num_colors = len(self.COLOR_WHEEL)
        
        # Analogous: one color on each side
        analogous_colors = [
            self.COLOR_WHEEL[(idx - 1 + num_colors) % num_colors],
            self.COLOR_WHEEL[(idx + 1) % num_colors]
        ]
        
        # Complementary: the color directly opposite
        complementary_color = self.COLOR_WHEEL[(idx + num_colors // 2) % num_colors]
        
        return {
            "analogous": analogous_colors,
            "complementary": [complementary_color]
        }

    def _get_preferred_color_scheme(self, favorite_colors: List[str]) -> str:
        """Analyzes favorite colors to determine a preferred scheme."""
        if not favorite_colors or len(favorite_colors) < 2:
            return "random" # Not enough data, so be random

        # Normalize all favorite colors to their base color on the wheel
        base_favorites = [self.COLOR_MAP.get(c.lower(), c.lower()) for c in favorite_colors]
        base_favorites = [c for c in base_favorites if c in self.COLOR_WHEEL]
        
        if len(base_favorites) < 2:
            return "random"

        # --- Monochromatic Check ---
        # If all favorite colors map to the same base color (e.g., navy, sky blue -> blue)
        if len(set(base_favorites)) == 1:
            return "monochromatic"

        # --- Complementary Check ---
        # Check if any two of the user's favorite colors are complementary
        first_color = base_favorites[0]
        relationships = self._get_color_relationships(first_color)
        complementary_color = relationships['complementary'][0]
        
        if complementary_color in base_favorites[1:]:
            return "complementary"
            
        # --- Analogous Check ---
        # Check if the user's colors are next to each other on the wheel
        analogous_colors = relationships['analogous']
        if any(color in base_favorites[1:] for color in analogous_colors):
            return "analogous"

        # If no strong signal is found, default to random to provide variety
        return "random"


    def __init__(self, api_key: str):
        if api_key:
            self.client = OpenAI(api_key=api_key)
            self.client_available = True
        else:
            self.client = None
            self.client_available = False
            print("⚠️  OpenAI API key not provided - using fallback outfit suggestions")
    
    def generate_outfit_suggestion(self, wardrobe: List[Dict], weather: str, mood: str, season: str = "any", outfit_history: List[Dict] = None, exclude_ids: List[int] = None) -> Dict[str, Any]:
        """Generate outfit suggestion using OpenAI with enhanced prompting"""
        
        # Exclude items from the previous suggestion if provided
        if exclude_ids:
            wardrobe = [item for item in wardrobe if item.get('id') not in exclude_ids]

        # Filter available (clean) items
        clean_items = [item for item in wardrobe if item.get('is_clean', True)]
        
        # Pre-filter by season for more reliable results.
        # This is a hard constraint that is better handled in code than by the AI.
        if season != 'any':
            season_filtered_items = [
                item for item in clean_items 
                if item.get('season', 'all').lower() == season.lower() or item.get('season', 'all').lower() == 'all'
            ]
            # Only use the seasonal filter if it returns items, otherwise use all clean items.
            if season_filtered_items:
                available_items = season_filtered_items
            else:
                available_items = clean_items # Fallback
        else:
            available_items = clean_items
            
        # Stricter style/mood pre-filtering to prevent style mixing.
        style_filtered_items = [
            item for item in available_items
            if not item.get('style') or item.get('style', '').lower() == mood.lower()
        ]
        if style_filtered_items:
            available_items = style_filtered_items
        # If no items match the style, we proceed with the seasonally-appropriate items.
        # The AI will have to do its best to match the mood.

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
        
        # --- NEW: Shuffle wardrobe to increase prompt randomness ---
        random.shuffle(available_items)

        # Create enhanced prompt with randomization
        prompt = self._create_enhanced_outfit_prompt(available_items, weather, mood, season, outfit_history)
        
        try:
            # Increase temperature for more creative, less deterministic suggestions.
            temperature = 0.7
            
            response = self.client.chat.completions.create(
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

    def generate_packing_list(self, wardrobe: List[Dict], trip_details: Dict, weather_forecast: Dict, personalization_profile: str = None) -> Dict[str, Any]:
        """Generate a packing list for a trip using OpenAI."""
        if not self.client_available:
            return {"error": "AI service not available"}

        clean_items = [item for item in wardrobe if item.get('is_clean', True)]
        if not clean_items:
            return {
                "packing_list": {},
                "reasoning": "Your wardrobe is empty or all items are dirty. Can't create a packing list."
            }

        prompt = self._create_packing_list_prompt(clean_items, trip_details, weather_forecast, personalization_profile)

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": self._get_packing_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=2000,
            )
            
            content = response.choices[0].message.content.strip()
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                return result
            else:
                return {"error": "Failed to parse AI response."}

        except Exception as e:
            print(f"AI packing list service error: {e}")
            return {"error": "Failed to generate packing list from AI."}

    def _get_packing_system_prompt(self) -> str:
        """Generates the system prompt for the packing list feature."""
        return """
You are a smart packing assistant. Your goal is to create a versatile and minimal packing list for a user's trip based on their available wardrobe, the trip details, and the weather forecast.

**Your Task:**
Analyze the user's request and available clothing to generate a packing list organized by category. The list should be efficient, avoiding over-packing, and should suggest versatile items that can be worn multiple times.

**CRITICAL RULE: Seasonal Appropriateness**
You MUST pay close attention to the `trip_season` and `trip_type` provided in the prompt. Cross-reference this with each clothing item's `season` attribute.
- DO NOT pack 'winter' items for a 'summer' or 'beach' trip.
- DO NOT pack 'summer' items (like shorts) for a 'winter' trip unless the notes specifically ask for it.
- Use common sense. A trip to "Aspen" in "Winter" needs warm clothes. A trip to "Cancun" for a "Beach" vacation needs swimwear and light clothing. This is your most important instruction.

**NEW CRITICAL RULE: Itinerary-Aware Packing**
If the user provides a structured itinerary in the 'Notes' section (e.g., "Day 1: Hiking, Day 2: Fancy Dinner"), your process MUST be as follows:
1.  **Identify Special Activities:** First, parse the notes to identify all distinct activities (e.g., "Hiking", "Fancy Dinner"). Populate the `special_activities` array with these.
2.  **Select Core Items for Activities:** Before doing anything else, select the essential clothing items required for these activities. For "Hiking," you must select hiking boots and sporty clothes. For "Fancy Dinner," you must select a formal outfit. These items are non-negotiable and MUST be included in the final `packing_list`.
3.  **Build Remainder of List:** After securing the items for special activities, build the rest of the packing list with versatile, mix-and-match items suitable for the trip's general purpose and weather.
4.  **Generate Special Outfits:** Finally, create a specific outfit suggestion for each special activity you identified. These suggestions should be included in the `special_outfits` object.

**NEW: Personalization**
You will be provided with a `personalization_profile`. This is a summary of the user's past feedback. Use this as a strong guide to tailor the packing list to their specific preferences. For example, if the profile says the user often finds lists to be missing casual wear, be sure to include more casual options. If it says they rarely use formal wear, pack it only if an activity explicitly requires it. Let the user's feedback guide your choices.

**Output Requirements:**
You MUST respond ONLY with a valid JSON object. Do not include any text before or after the JSON. The JSON object must have the exact following structure:
{
  "reasoning": "A brief justification for your choices, explaining how the list is optimized for the trip's weather, duration, purpose, and any special activities.",
  "packing_list": {
    "Tops": [ { "id": <item_id>, "name": "<item_name>" }, ... ],
    "Bottoms": [ { "id": <item_id>, "name": "<item_name>" }, ... ],
    "Outerwear": [ { "id": <item_id>, "name": "<item_name>" }, ... ],
    "Dresses": [ { "id": <item_id>, "name": "<item_name>" }, ... ],
    "Shoes": [ { "id": <item_id>, "name": "<item_name>" }, ... ],
    "Accessories": [ { "id": <item_id>, "name": "<item_name>" }, ... ],
    "Essentials": [ "Socks", "Underwear", "Pajamas" ]
  },
  "special_activities": ["Hiking", "Fancy Dinner", ...],
  "special_outfits": {
    "Hiking": {
      "selected_items": [<item_id>, <item_id>, ...],
      "reasoning": "A practical and comfortable outfit for your hike."
    },
    "Fancy Dinner": {
      "selected_items": [<item_id>, <item_id>, ...],
      "reasoning": "An elegant and appropriate outfit for your dinner."
    }
  }
}
"""

    def _create_packing_list_prompt(self, wardrobe: List[Dict], trip_details: Dict, weather_forecast: Dict, personalization_profile: str) -> str:
        """Creates the user prompt for the packing list feature."""
        
        personalization_section = f"""
**User Personalization Profile (from past trip feedback):**
{personalization_profile}
""" if personalization_profile else ""

        wardrobe_by_category = {
            'Tops': [], 'Bottoms': [], 'Outerwear': [],
            'Shoes': [], 'Accessories': [], 'Dresses': []
        }
        for item in wardrobe:
            item_type = item['type'].lower()
            item_info = {
                "id": item['id'], 
                "name": item['name'], 
                "style": item.get('style'), 
                "fabric": item.get('fabric'),
                "season": item.get('season', 'all') # Add season to the item info
            }
            if item_type in ['shirt', 't-shirt', 'blouse', 'sweater', 'tank-top']:
                wardrobe_by_category['Tops'].append(item_info)
            elif item_type in ['pants', 'jeans', 'shorts', 'skirt']:
                wardrobe_by_category['Bottoms'].append(item_info)
            elif item_type in ['jacket', 'coat', 'cardigan']:
                wardrobe_by_category['Outerwear'].append(item_info)
            elif item_type in ['shoes', 'sneakers', 'boots']:
                wardrobe_by_category['Shoes'].append(item_info)
            elif item_type == 'dress':
                wardrobe_by_category['Dresses'].append(item_info)
            else:
                wardrobe_by_category['Accessories'].append(item_info)

        # Determine trip season from dates
        start_date_str = trip_details.get('start_date')
        start_month = datetime.strptime(start_date_str, '%Y-%m-%d').month
        trip_season = 'winter' if start_month in [12, 1, 2] else 'spring' if start_month in [3, 4, 5] else 'summer' if start_month in [6, 7, 8] else 'fall'

        prompt = f"""
Generate a packing list based on the following information:

**Trip Details:**
- Destination: {trip_details.get('destination')}
- Duration: {trip_details.get('duration_days')} days
- Purpose/Type: {trip_details.get('trip_type', 'not specified')}
- Trip Season: {trip_season}
- Notes: {trip_details.get('notes', 'none')}

**Weather Forecast:**
{weather_forecast.get('forecast_summary_text')}
Daily details: {json.dumps(weather_forecast.get('daily_detail', []), indent=2)}
{personalization_section}
**Available Wardrobe (with seasons):**
Tops: {json.dumps(wardrobe_by_category['Tops'], indent=2)}
Bottoms: {json.dumps(wardrobe_by_category['Bottoms'], indent=2)}
Outerwear: {json.dumps(wardrobe_by_category['Outerwear'], indent=2)}
Dresses: {json.dumps(wardrobe_by_category['Dresses'], indent=2)}
Shoes: {json.dumps(wardrobe_by_category['Shoes'], indent=2)}
Accessories: {json.dumps(wardrobe_by_category['Accessories'], indent=2)}

**Requirements:**
1. **Follow the CRITICAL RULEs in the system prompt above all else.**
2. First, identify special activities from the notes and select core items for them.
3. Then, build the rest of a minimal and versatile packing list, ensuring the number of items is appropriate for the trip duration.
4. Prioritize items that can be mixed and matched.
5. Ensure the entire list is appropriate for the weather AND the trip's purpose and season.
6. Include a list of essentials like socks, underwear, and pajamas.
7. Finally, define the `special_outfits` for the activities you identified.
8. Respond ONLY with a valid JSON object in the specified format. Your reasoning should mention why the list is seasonally appropriate and suitable for the itinerary.
"""
        return prompt

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
2.  **PRIORITY 2: User's Personal Style (Crucial):** The outfit MUST align with the user's `STYLE DNA` and `OUTFIT HISTORY`. This is the most important creative constraint. Your main goal is to reflect the user's taste, not to be overly experimental. The suggestion should feel like it was made specifically for them.
3.  **PRIORITY 3: Mood & Occasion:** The `Mood` should refine the selection. A 'professional' outfit should be more formal than a 'casual' one, but still within the user's personal style.
4.  **PRIORITY 4: Color Harmony:** You must use your knowledge of color theory to create a visually pleasing outfit. See the 'Color Theory' section below for your rules.
5.  **PRIORITY 5: Variety & Creativity:** While respecting the user's style, introduce some variety. Don't suggest the exact same outfit repeatedly. Use the `Special instruction` to guide your creativity.

**Expert Knowledge: Color Theory**
You will use one of the following color theories to build the outfit's color palette. The user's prompt will indicate a `preferred_color_scheme` based on their history. If the preference is 'random', you should choose a scheme that works well with the available clothes.

*   **Monochromatic:** Uses variations of a single color (e.g., different shades of blue). This creates a sophisticated, cohesive look.
*   **Analogous:** Uses colors that are adjacent on the color wheel (e.g., blue, blue-green, green). This creates a harmonious and subtle palette.
*   **Complementary:** Uses colors directly opposite on the color wheel (e.g., blue and orange). This creates a bold, high-contrast look.
*   **Split-Complementary:** A color and the two colors adjacent to its complement (e.g., blue with yellow-orange and red-orange). A strong contrast that's softer than complementary.
*   **Triadic:** Three colors equally spaced on the wheel (e.g., red, yellow, blue). Vibrant and rewarding, but challenging.
*   **Neutral-Based:** Uses neutrals (black, white, grey, beige, navy) as the foundation, with one or two accent colors for interest.

**Output Requirements:**
You MUST respond ONLY with a valid JSON object. Do not include any text before or after the JSON. The JSON object must have the exact following structure:
{
    "selected_items": [array of integer item IDs],
    "reasoning": "Detailed explanation of your choices. Explain HOW the outfit fits the user's Style DNA and History, and WHY it is appropriate for the season, weather, and mood. **You must also explain the color theory you used (e.g., 'I chose a complementary color scheme...').**",
    "style_notes": "Actionable styling tips (e.g., 'Tuck the shirt in', 'Roll up the sleeves', 'Consider adding a belt').",
    "color_story": "A brief, evocative description of the color palette you created.",
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

        # Get User's Style DNA, now with mood context
        style_dna = self._get_style_dna(wardrobe, outfit_history, mood)
        style_dna_prompt_section = ""
        if style_dna:
            style_dna_prompt_section = f"USER'S {mood.upper()} STYLE DNA (for personalization):\n{json.dumps(style_dna, indent=2)}\n"

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
- User's preferred color scheme: {style_dna.get('preferred_color_scheme', 'random')}
- Recently worn items to avoid (IDs): {recent_item_ids}
- Special instruction: {variety_instruction}

OUTFIT RULES (You MUST follow these):
- **Composition:** An outfit MUST have a logical structure.
    - Choose **exactly one** item from the 'dresses' category, OR choose **exactly one** item from 'tops' AND **exactly one** item from 'bottoms'. You cannot select a dress and a top/bottom in the same outfit.
    - Choose **exactly one** item from 'shoes'.
    - You MAY choose **zero or one** item from 'outerwear', depending on the weather.
    - You MAY choose **one or more** items from 'accessories' to complete the look.
- **Weather-Appropriate Layers:** You MUST add weather-appropriate layers. If the weather is 'cold', 'cool', or 'rainy', you MUST include an 'outerwear' item. If the weather is 'sunny', you should consider adding an 'accessory' like sunglasses.
- **Seasonal Accuracy:** DO NOT suggest items that are clearly for the wrong season (e.g., a winter coat in summer). This is a hard rule.
- **The 3-Color Rule (60/30/10 Principle):** Create a harmonious look by using a maximum of three colors.
    -   **Dominant Color (60%):** Assign this to the largest items, like a coat, dress, or pants.
    -   **Secondary Color (30%):** Use this for a major piece like a shirt or top.
    -   **Accent Color (10%):** Use this for small accessories like a belt, scarf, or jewelry to add a pop of color.
    -   (Neutrals like black, white, grey, and beige can be used freely and don't strictly count towards this limit).

AVAILABLE WARDROBE:
Tops: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['tops']], indent=2)}
Bottoms: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['bottoms']], indent=2)}
Outerwear: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['outerwear']], indent=2)}
Shoes: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['shoes']], indent=2)}
Dresses: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['dresses']], indent=2)}
Accessories: {json.dumps([{k: v for k, v in item.items() if k in item_fields_to_include} for item in wardrobe_by_category['accessories']], indent=2)}

REQUIREMENTS:
1. **Create a COMPLETE and LAYERED outfit.** Your goal is to create a full look, not just pick a few items.
2. The outfit must be weather-appropriate and SEASONALLY-APPROPRIATE for a '{mood}' mood in '{season}'.
3. **Personalize the outfit** based on the user's STYLE DNA and OUTFIT HISTORY. This is crucial.
4. **Adhere strictly to the requested mood/style.** For a '{mood}' request, the outfit's overall aesthetic must be '{mood}'.
5. **Include appropriate outerwear and accessories** as dictated by the weather and mood. A complete outfit often has more than 3 pieces.
6. AVOID recently worn items when possible (see IDs above).
7. Ensure color coordination and style harmony according to the 60/30/10 rule.
8. {variety_instruction}
9. BE CREATIVE (but within the user's style) and suggest different combinations each time.

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

    def _get_style_dna(self, wardrobe: List[Dict], outfit_history: List[Dict], mood: str) -> Dict[str, Any]:
        """Analyzes wardrobe and outfit history to create a user style profile, now with mood context."""
        
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
                
        # Give more weight to items from past outfits that match the current mood
        if outfit_history:
            for outfit in outfit_history:
                # Only learn from past outfits with a similar mood
                if outfit.get('mood', '').lower() == mood.lower():
                    for item in outfit.get('clothing_items', []):
                        if item.get('style'):
                            style_counter[item['style']] += 2 # Extra weight for worn items in a relevant context
                        if item.get('color'):
                            color_counter[item['color']] += 2
                        if item.get('brand'):
                            brand_counter[item['brand']] += 2
                        if item.get('fabric'):
                            fabric_counter[item['fabric']] += 2

        # Construct the Style DNA profile
        favorite_colors = [color for color, count in color_counter.most_common(3)]
        style_dna = {
            "dominant_styles": [style for style, count in style_counter.most_common(3)],
            "favorite_colors": favorite_colors,
            "preferred_brands": [brand for brand, count in brand_counter.most_common(3)],
            "common_fabrics": [fabric for fabric, count in fabric_counter.most_common(3)],
            "preferred_color_scheme": self._get_preferred_color_scheme(favorite_colors)
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