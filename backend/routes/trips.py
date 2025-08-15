from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from models import db, Trip, ClothingItem
from datetime import datetime

trips_bp = Blueprint('trips', __name__)

@trips_bp.route('/api/trips', methods=['POST'])
@login_required
def create_trip():
    data = request.get_json()
    
    destination = data.get('destination')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')
    trip_type = data.get('trip_type')
    notes = data.get('notes')

    if not all([destination, start_date_str, end_date_str]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    if start_date > end_date:
        return jsonify({'error': 'Start date must be before end date'}), 400

    new_trip = Trip(
        destination=destination,
        start_date=start_date,
        end_date=end_date,
        trip_type=trip_type,
        notes=notes,
        user_id=current_user.id
    )
    
    db.session.add(new_trip)
    db.session.commit()
    
    return jsonify(new_trip.to_dict()), 201

@trips_bp.route('/api/trips', methods=['GET'])
@login_required
def get_trips():
    trips = Trip.query.filter_by(user_id=current_user.id).order_by(Trip.start_date.desc()).all()
    return jsonify([trip.to_dict() for trip in trips])

@trips_bp.route('/api/trips/<int:trip_id>', methods=['DELETE'])
@login_required
def delete_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    
    if trip.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    db.session.delete(trip)
    db.session.commit()
    
    return jsonify({'message': 'Trip deleted successfully'}), 200

@trips_bp.route('/api/trips/<int:trip_id>/packing-list', methods=['GET'])
@login_required
def get_packing_list(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    
    if trip.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    # 1. Get weather forecast
    weather_forecast = current_app.weather_service.get_forecast_for_trip(
        destination=trip.destination,
        start_date=trip.start_date,
        end_date=trip.end_date
    )

    if not weather_forecast:
        return jsonify({'error': 'Could not retrieve weather forecast for the destination.'}), 500

    # 2. Get user's available wardrobe
    available_items = ClothingItem.query.filter_by(user_id=current_user.id, is_clean=True).all()
    wardrobe_data = [item.to_dict() for item in available_items]

    # 3. Call AI service to generate packing list
    packing_list_data = current_app.ai_service.generate_packing_list(
        wardrobe=wardrobe_data,
        trip_details=trip.to_dict(),
        weather_forecast=weather_forecast
    )

    if 'error' in packing_list_data:
        return jsonify({'error': packing_list_data['error']}), 500

    return jsonify(packing_list_data)
