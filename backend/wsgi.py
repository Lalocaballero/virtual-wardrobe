import eventlet
eventlet.monkey_patch()

from app import create_app

# The factory returns both objects
app, socketio = create_app()

# This is what Gunicorn needs to access
application = app  # Gunicorn looks for 'application' by default

if __name__ == "__main__":
    # This allows you to run "python wsgi.py" for local testing
    socketio.run(app)