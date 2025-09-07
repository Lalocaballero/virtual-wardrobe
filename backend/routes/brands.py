from flask import Blueprint, request, jsonify
from models import db, Brand
from sqlalchemy import func

brands_bp = Blueprint('brands_bp', __name__)

@brands_bp.route('/api/brands', methods=['GET'])
def search_brands():
    """
    Searches for approved brands by name (case-insensitive).
    Accepts a 'q' query parameter.
    """
    query = request.args.get('q', '', type=str)
    
    if not query:
        return jsonify([])

    # Query for approved brands that match the search term
    brands = Brand.query.filter(
        Brand.is_approved == True,
        Brand.name.ilike(f'%{query}%')
    ).limit(10).all()
    
    brand_names = [brand.name for brand in brands]
    
    return jsonify(brand_names)

@brands_bp.route('/api/brands', methods=['POST'])
def submit_brand():
    """
    Submits a new brand for moderation.
    If the brand already exists (case-insensitive), it does nothing.
    """
    data = request.get_json()
    brand_name = data.get('name')

    if not brand_name or not brand_name.strip():
        return jsonify({'error': 'Brand name is required'}), 400

    sanitized_name = brand_name.strip()

    # Check if the brand already exists (case-insensitive check)
    existing_brand = Brand.query.filter(func.lower(Brand.name) == func.lower(sanitized_name)).first()

    if existing_brand:
        # Brand already exists, return success but indicate no action was taken.
        return jsonify({
            'message': 'Brand already exists.',
            'brand': existing_brand.to_dict()
        }), 200

    # If it doesn't exist, create it with is_approved=False
    new_brand = Brand(name=sanitized_name, is_approved=False)
    db.session.add(new_brand)
    db.session.commit()

    return jsonify({
        'message': 'Brand submitted for review.',
        'brand': new_brand.to_dict()
    }), 201
