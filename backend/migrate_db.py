from app import app
from models import db

def migrate_database():
    with app.app_context():
        print("Updating database schema...")
        
        # Drop and recreate all tables to avoid conflicts
        print("Dropping existing tables...")
        db.drop_all()
        
        print("Creating new tables with updated schema...")
        db.create_all()
        
        print("Database migration completed successfully!")
        print("Note: All existing data has been cleared. You'll need to re-register and add items.")

if __name__ == '__main__':
    migrate_database()