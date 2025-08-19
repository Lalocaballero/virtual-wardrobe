from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from models import db, User, Trip, Outfit, Notification

def outfit_reminder_job(app):
    """
    Runs daily to send a notification to users who haven't planned an outfit.
    """
    with app.app_context():
        users = User.query.filter_by(is_banned=False, is_suspended=False).all()
        for user in users:
            # Check if user wants this notification
            if not user.get_notification_settings().get('outfit_reminders', True):
                continue

            # Check if an outfit was created today
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            outfit_today = Outfit.query.filter(
                Outfit.user_id == user.id,
                Outfit.date >= today_start
            ).first()

            if not outfit_today:
                # Check if a notification already exists
                existing_notification = Notification.query.filter(
                    Notification.user_id == user.id,
                    Notification.message.like('%plan your outfit%'),
                    Notification.created_at >= today_start
                ).first()

                if not existing_notification:
                    notification = Notification(
                        user_id=user.id,
                        message="Don't forget to plan your outfit for today!",
                        link="/dashboard/outfit"
                    )
                    db.session.add(notification)
        db.session.commit()

def trip_reminder_job(app):
    """
    Runs daily to send a notification to users about upcoming trips.
    """
    with app.app_context():
        # Find trips starting in 3 days
        reminder_date = datetime.utcnow().date() + timedelta(days=3)
        upcoming_trips = Trip.query.filter(Trip.start_date == reminder_date).all()

        for trip in upcoming_trips:
            user = trip.traveler
            # Check if user wants this notification
            if not user.get_notification_settings().get('trip_reminders', True):
                continue
            
            # Check if a notification for this trip already exists
            existing_notification = Notification.query.filter(
                Notification.user_id == user.id,
                Notification.message.like(f'%Your trip to {trip.destination}%')
            ).first()

            if not existing_notification:
                notification = Notification(
                    user_id=user.id,
                    message=f"Your trip to {trip.destination} is in 3 days! Time to start packing.",
                    link="/dashboard/packing"
                )
                db.session.add(notification)
        db.session.commit()

def init_scheduler(app):
    """Initializes and starts the scheduler."""
    scheduler = BackgroundScheduler(daemon=True)
    # Schedule jobs to run once a day at a specific time (e.g., 8 AM UTC)
    scheduler.add_job(func=outfit_reminder_job, args=[app], trigger='cron', hour=8)
    scheduler.add_job(func=trip_reminder_job, args=[app], trigger='cron', hour=9)
    scheduler.start()
    print("Scheduler started...")
