import requests
import os
from typing import Dict, Optional
from datetime import date, timedelta

class WeatherService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data"
        self.client_available = api_key
        
        if not self.client_available:
            print("⚠️  Weather API key not provided - using mock weather data")

    def get_coordinates_for_location(self, location: str) -> Optional[Dict[str, float]]:
        """Get latitude and longitude for a location string."""
        if not self.client_available:
            return None
        
        try:
            url = f"https://api.openweathermap.org/geo/1.0/direct"
            params = {
                'q': location,
                'limit': 1,
                'appid': self.api_key
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            if data:
                return {"lat": data[0]["lat"], "lon": data[0]["lon"]}
            return None
        except requests.exceptions.RequestException as e:
            print(f"Geocoding request error: {e}")
            return None

    def get_forecast_for_trip(self, destination: str, start_date: date, end_date: date) -> Optional[Dict]:
        """Get a daily weather forecast for a trip's duration."""
        coords = self.get_coordinates_for_location(destination)
        if not coords:
            return None

        if not self.client_available:
            # Return a generic mock forecast for the trip duration
            return self._get_mock_forecast_for_trip(destination, start_date, end_date)

        try:
            # --- ADD THIS LOGGING LINE ---
            print(f"DEBUG: Calling One Call API with key ending in ...{self.api_key[-4:]}")
            # --- END OF ADDITION ---
            url = f"{self.base_url}/3.0/onecall"
            params = {
                'lat': coords['lat'],
                'lon': coords['lon'],
                'exclude': 'current,minutely,hourly,alerts',
                'appid': self.api_key,
                'units': 'metric'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            forecast_data = response.json()

            trip_duration = (end_date - start_date).days + 1
            # The API gives 8 days of forecast, so we take what we need
            daily_forecasts = forecast_data.get('daily', [])[:trip_duration]

            if not daily_forecasts:
                return None

            avg_temp = sum(day['temp']['day'] for day in daily_forecasts) / len(daily_forecasts)
            
            weather_conditions = [day['weather'][0]['main'] for day in daily_forecasts]
            most_common_condition = max(set(weather_conditions), key=weather_conditions.count)

            summary = {
                "destination": destination,
                "trip_duration": trip_duration,
                "average_temp": round(avg_temp),
                "most_common_condition": most_common_condition,
                "forecast_summary_text": f"Expect weather around {round(avg_temp)}°C with conditions like {most_common_condition}.",
                "daily_detail": [{
                    "date": date.fromtimestamp(day['dt']).isoformat(),
                    "temp_max": round(day['temp']['max']),
                    "temp_min": round(day['temp']['min']),
                    "condition": day['weather'][0]['description']
                } for day in daily_forecasts]
            }
            return summary

        except requests.exceptions.RequestException as e:
            print(f"Trip forecast request error: {e}")
            return self._get_mock_forecast_for_trip(destination, start_date, end_date)
    
    def _get_mock_forecast_for_trip(self, destination: str, start_date: date, end_date: date) -> Dict:
        """Provide a mock forecast for a trip, now with an error flag."""
        trip_duration = (end_date - start_date).days + 1
        return {
            "error": "Failed to retrieve real weather data due to an API error.",
            "destination": destination,
            "trip_duration": trip_duration,
            "average_temp": 22,
            "most_common_condition": "Partly Cloudy",
            "forecast_summary_text": "Could not retrieve forecast. Using placeholder data.",
            "daily_detail": [{
                "date": (start_date + timedelta(days=i)).isoformat(),
                "temp_max": 25,
                "temp_min": 18,
                "condition": "partly cloudy"
            } for i in range(trip_duration)]
        }

    def get_current_weather(self, location: str) -> Dict:
        """Get current weather for location with enhanced data"""
        if not self.client_available:
            return self._get_mock_weather(location)
        
        try:
            # Get current weather
            current_url = f"{self.base_url}/2.5/weather"
            params = {
                'q': location,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(current_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Get forecast for additional context
            forecast_data = self._get_forecast(location)
            
            return {
                'temperature': round(data['main']['temp']),
                'feels_like': round(data['main']['feels_like']),
                'condition': data['weather'][0]['description'].title(),
                'main_condition': data['weather'][0]['main'].lower(),
                'humidity': data['main']['humidity'],
                'wind_speed': round(data['wind'].get('speed', 0) * 3.6, 1),  # Convert m/s to km/h
                'pressure': data['main']['pressure'],
                'visibility': data.get('visibility', 10000) / 1000,  # Convert to km
                'uv_index': forecast_data.get('uv_index', 'N/A'),
                'sunrise': data['sys']['sunrise'],
                'sunset': data['sys']['sunset'],
                'location': f"{data['name']}, {data['sys']['country']}",
                'icon': data['weather'][0]['icon'],
                'hourly_forecast': forecast_data.get('hourly', [])
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Weather service request error: {e}")
            return self._get_mock_weather(location)
        except Exception as e:
            print(f"Weather service error: {e}")
            return self._get_mock_weather(location)
    
    def _get_forecast(self, location: str) -> Dict:
        """Get weather forecast for additional context"""
        try:
            forecast_url = f"{self.base_url}/2.5/forecast"
            params = {
                'q': location,
                'appid': self.api_key,
                'units': 'metric',
                'cnt': 8  # Next 24 hours (3-hour intervals)
            }
            
            response = requests.get(forecast_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            hourly = []
            for item in data['list'][:4]:  # Next 12 hours
                hourly.append({
                    'time': item['dt'],
                    'temp': round(item['main']['temp']),
                    'condition': item['weather'][0]['description'].title(),
                    'rain_chance': item.get('pop', 0) * 100
                })
            
            return {
                'hourly': hourly,
                'uv_index': 'Moderate'  # Mock UV index
            }
            
        except Exception as e:
            print(f"Forecast error: {e}")
            return {'hourly': [], 'uv_index': 'N/A'}
    
    def _get_mock_weather(self, location: str) -> Dict:
        """Provide realistic mock weather data"""
        import random
        from datetime import datetime
        
        # Mock weather conditions based on season
        current_month = datetime.now().month
        
        if current_month in [12, 1, 2]:  # Winter
            temp_range = (-5, 10)
            conditions = ['Cloudy', 'Light Snow', 'Overcast', 'Clear']
        elif current_month in [3, 4, 5]:  # Spring
            temp_range = (10, 20)
            conditions = ['Partly Cloudy', 'Light Rain', 'Clear', 'Breezy']
        elif current_month in [6, 7, 8]:  # Summer
            temp_range = (20, 30)
            conditions = ['Sunny', 'Partly Cloudy', 'Hot', 'Clear']
        else:  # Fall
            temp_range = (5, 18)
            conditions = ['Cloudy', 'Light Rain', 'Windy', 'Overcast']
        
        temp = random.randint(*temp_range)
        condition = random.choice(conditions)
        
        return {
            'temperature': temp,
            'feels_like': temp + random.randint(-3, 3),
            'condition': condition,
            'main_condition': condition.lower(),
            'humidity': random.randint(40, 80),
            'wind_speed': random.randint(5, 25),
            'pressure': random.randint(1000, 1030),
            'visibility': random.randint(8, 15),
            'uv_index': 'Moderate',
            'location': location or 'Your Location',
            'icon': '01d',
            'hourly_forecast': []
        }
    
    def get_weather_description(self, weather_data: Dict) -> str:
        """Format comprehensive weather description for AI"""
        temp = weather_data['temperature']
        feels_like = weather_data['feels_like']
        condition = weather_data['condition']
        humidity = weather_data['humidity']
        wind = weather_data['wind_speed']
        
        description = f"{temp}°C ({condition})"
        
        # Add feels like if different
        if abs(temp - feels_like) > 2:
            description += f", feels like {feels_like}°C"
        
        # Add humidity context
        if humidity > 70:
            description += ", humid"
        elif humidity < 30:
            description += ", dry"
        
        # Add wind context
        if wind > 20:
            description += ", windy"
        elif wind > 10:
            description += ", breezy"
        
        return description
    
    def get_outfit_weather_advice(self, weather_data: Dict) -> str:
        """Get specific outfit advice based on weather"""
        temp = weather_data['temperature']
        condition = weather_data['main_condition']
        humidity = weather_data['humidity']
        wind = weather_data['wind_speed']
        
        advice = []
        
        # Temperature advice
        if temp < 0:
            advice.append("Very cold - layer heavily, wear winter coat")
        elif temp < 10:
            advice.append("Cold - sweaters, jackets, long pants recommended")
        elif temp < 20:
            advice.append("Cool - light jacket or cardigan recommended")
        elif temp < 25:
            advice.append("Mild - comfortable for most clothing")
        elif temp < 30:
            advice.append("Warm - light, breathable fabrics recommended")
        else:
            advice.append("Hot - minimal, light-colored, breathable clothing")
        
        # Condition-specific advice
        if 'rain' in condition or 'drizzle' in condition:
            advice.append("Bring umbrella or waterproof jacket")
        elif 'snow' in condition:
            advice.append("Wear waterproof boots and warm layers")
        elif 'wind' in condition or wind > 20:
            advice.append("Avoid loose clothing, secure accessories")
        
        # Humidity advice
        if humidity > 80:
            advice.append("High humidity - choose breathable fabrics")
        
        return ". ".join(advice)