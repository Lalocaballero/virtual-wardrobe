import os
from app import create_app, db
from models import Brand

# Initial list of brands for the WeWear database seed
INITIAL_BRANDS = [
    # Fast Fashion & High Street
    "Zara", "H&M", "Uniqlo", "ASOS", "Topshop", "Mango", "Bershka", 
    "Stradivarius", "Pull&Bear", "Forever 21", "GAP", "Old Navy", "Primark",
    
    # Mid-Range & Contemporary
    "COS", "& Other Stories", "Aritzia", "J.Crew", "Madewell", "Everlane", 
    "AllSaints", "Reiss", "Ted Baker", "Sandro", "Maje", "Ganni", "Acne Studios",
    "Club Monaco", "Banana Republic",

    # Sportswear & Athleisure
    "Nike", "Adidas", "Puma", "Reebok", "New Balance", "Under Armour", 
    "Lululemon", "Gymshark", "Fila", "Champion", "The North Face", "Patagonia", 
    "Columbia", "Arc'teryx",

    # Denim & Casualwear
    "Levi's", "Wrangler", "Lee", "Diesel", "G-Star RAW", "Nudie Jeans",
    "Calvin Klein", "Tommy Hilfiger", "Ralph Lauren", "Lacoste", "Carhartt",

    # Footwear
    "Converse", "Vans", "Dr. Martens", "Birkenstock", "UGG", "Timberland",
    "Clarks", "New Rock", "Steve Madden", "Aldo",

    # Luxury & High Fashion
    "Gucci", "Prada", "Louis Vuitton", "Chanel", "Dior", "Saint Laurent", 
    "Balenciaga", "Fendi", "Versace", "Givenchy", "Valentino", "Burberry",
    "Bottega Veneta", "Off-White", "Alexander McQueen", "Loewe", "Celine",
    
    # Lingerie & Basics
    "Victoria's Secret", "Savage X Fenty", "Skims",
    
    # Accessories
    "Ray-Ban", "Oakley", "Michael Kors", "Kate Spade", "Coach"
]

def seed_brands():
    """
    Populates the brands table with the initial list of approved brands.
    Checks for existence before adding to prevent duplicates.
    """
    app = create_app()
    with app.app_context():
        print("Starting to seed brands...")
        
        existing_brands = {brand.name.lower() for brand in Brand.query.all()}
        brands_added = 0

        for brand_name in INITIAL_BRANDS:
            if brand_name.lower() not in existing_brands:
                new_brand = Brand(name=brand_name, is_approved=True)
                db.session.add(new_brand)
                existing_brands.add(brand_name.lower())
                brands_added += 1
        
        if brands_added > 0:
            db.session.commit()
            print(f"Successfully seeded {brands_added} new brands.")
        else:
            print("No new brands to seed. Database is already up to date.")

if __name__ == '__main__':
    seed_brands()
