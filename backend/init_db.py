"""
Database initialization script for Railway deployment
Run this to create tables in PostgreSQL
"""
from app import app, db
from models import User, ClothingItem, Outfit
import os

def init_database():
    """Initialize database tables"""
    print("🚀 Initializing database...")
    
    with app.app_context():
        try:
            # Print current database URL (masked for security)
            db_url = app.config['SQLALCHEMY_DATABASE_URI']
            if 'postgresql' in db_url:
                print("📊 Using PostgreSQL database")
            else:
                print("📊 Using SQLite database")
            
            # Test connection
            db.engine.connect()
            print("✅ Database connection successful!")
            
            # Create all tables
            print("📋 Creating database tables...")
            db.create_all()
            print("✅ All tables created successfully!")
            
            # List created tables
            inspector = db.inspect(db.engine)
            table_names = inspector.get_table_names()
            print(f"📚 Created tables: {table_names}")
            
            # Test table access
            users_count = User.query.count()
            items_count = ClothingItem.query.count()
            outfits_count = Outfit.query.count()
            
            print(f"✅ Database initialized successfully!")
            print(f"   - Users: {users_count}")
            print(f"   - Clothing Items: {items_count}")  
            print(f"   - Outfits: {outfits_count}")
            
            return True
            
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = init_database()
    if success:
        print("🎉 Database ready for use!")
    else:
        print("💥 Database initialization failed!")
        exit(1)