# utils/scheduler_jobs.py
from datetime import datetime, timedelta
from models import db, User, Trip, Outfit, Notification

def outfit_reminder_job(app):
    """
    Runs daily to send a notification to users who haven't planned an outfit.
    """
    with app.app_context():
        users = User.query.filter_by(is_banned=False, is_suspended=False).all()
        for user in users:
            if not user.get_notification_settings().get('outfit_reminders', True):
                continue
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            outfit_today = Outfit.query.filter(Outfit.user_id == user.id, Outfit.date >= today_start).first()
            if not outfit_today:
                existing_notification = Notification.query.filter(Notification.user_id == user.id, Notification.message.like('%plan your outfit%'), Notification.created_at >= today_start).first()
                if not existing_notification:
                    notification = Notification(user_id=user.id, message="Don't forget to plan your outfit for today!", link="/dashboard/outfit")
                    db.session.add(notification)
        db.session.commit()

def trip_reminder_job(app):
    """
    Runs daily to send a notification to users about upcoming trips.
    """
    with app.app_context():
        reminder_date = datetime.utcnow().date() + timedelta(days=3)
        upcoming_trips = Trip.query.filter(Trip.start_date == reminder_date).all()
        for trip in upcoming_trips:
            user = trip.traveler
            if not user.get_notification_settings().get('trip_reminders', True):
                continue
            existing_notification = Notification.query.filter(Notification.user_id == user.id, Notification.message.like(f'%Your trip to {trip.destination}%')).first()
            if not existing_notification:
                notification = Notification(user_id=user.id, message=f"Your trip to {trip.destination} is in 3 days! Time to start packing.", link="/dashboard/packing")
                db.session.add(notification)
        db.session.commit()

def run_daily_jobs(app):
    """Runs all scheduled jobs."""
    with app.app_context():
        outfit_reminder_job(app)
        trip_reminder_job(app)
    return "All daily jobs completed."
