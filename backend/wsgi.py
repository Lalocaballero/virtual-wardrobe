import os
from app import app

# Initialize database tables on first import (for Railway)
if os.environ.get('RAILWAY_ENVIRONMENT'):
    print("🚂 Railway environment detected - initializing database...")
    with app.app_context():
        try:
            from models import db
            db.create_all()
            print("✅ Database tables initialized in Railway")
        except Exception as e:
            print(f"⚠️  Database initialization warning: {e}")

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)