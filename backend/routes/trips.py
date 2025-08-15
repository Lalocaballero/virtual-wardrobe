from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from models import db, Trip, ClothingItem, PackingList, PackingListItem, UserEssentialPreference
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

    # Check if a packing list already exists
    existing_list = PackingList.query.filter_by(trip_id=trip_id).first()
    if existing_list:
        # Make sure to serialize it correctly, including items
        return jsonify(existing_list.to_dict())

    # If not, generate a new one
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

    # 4. Create and save the new packing list to the database
    try:
        new_packing_list = PackingList(trip_id=trip.id, user_id=current_user.id)
        db.session.add(new_packing_list)
        
        # Add items from AI generation
        # The AI returns a dict where keys are categories and values are lists of item names
        generated_items = packing_list_data.get('packing_list', {})
        for category, items in generated_items.items():
            for item_detail in items: # item_detail can be a dict or a string
                item_name = item_detail['name'] if isinstance(item_detail, dict) else item_detail
                
                clothing_item = next((item for item in available_items if item.name == item_name), None)
                
                list_item = PackingListItem(
                    item_name=item_name,
                    quantity=1, # Default quantity for AI suggestions
                    clothing_item_id=clothing_item.id if clothing_item else None
                )
                new_packing_list.items.append(list_item)

        # 5. Add essentials (e.g., socks, underwear) based on trip duration
        essentials = {
            'Socks': 'socks',
            'Underwear': 'underwear'
        }
        trip_duration = (trip.end_date - trip.start_date).days + 1
        
        for item_name, item_type in essentials.items():
            preference = UserEssentialPreference.query.filter_by(user_id=current_user.id, item_type=item_type).first()
            
            # Default to 1 per day if no preference is set
            quantity = preference.quantity if preference else trip_duration
            
            if quantity > 0:
                list_item = PackingListItem(
                    item_name=item_name,
                    quantity=quantity
                )
                new_packing_list.items.append(list_item)
        
        db.session.commit()
        return jsonify(new_packing_list.to_dict())

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating packing list: {e}")
        return jsonify({'error': 'Failed to create and save packing list.'}), 500

@trips_bp.route('/api/packing-list-items/<int:item_id>/toggle', methods=['POST'])
@login_required
def toggle_packed_item(item_id):
    item = PackingListItem.query.get_or_404(item_id)
    # Authorization check: ensure the item belongs to the current user
    if item.packing_list.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    item.is_packed = not item.is_packed
    db.session.commit()
    return jsonify(item.to_dict())

@trips_bp.route('/api/trips/<int:trip_id>/complete', methods=['POST'])
@login_required
def complete_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    if trip.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    packing_list = trip.packing_list
    if not packing_list:
        return jsonify({'error': 'Packing list not found for this trip'}), 404

    # 1. Mark the packing list as completed
    packing_list.status = 'completed'
    
    # 2. Get the IDs of all packed clothing items
    packed_clothing_item_ids = [
        item.clothing_item_id 
        for item in packing_list.items 
        if item.is_packed and item.clothing_item_id is not None
    ]
    
    # 3. Mark the items as dirty using the laundry service
    if packed_clothing_item_ids:
        success = current_app.laundry_service.mark_items_as_dirty(packed_clothing_item_ids)
        if not success:
            # Even if laundry fails, we should probably still complete the trip
            current_app.logger.error(f"Failed to mark items as dirty for trip {trip_id}")

    db.session.commit()
    
    return jsonify({'message': 'Trip marked as completed and packed items added to laundry.'})
