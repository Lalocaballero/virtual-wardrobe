from gevent import monkey
# This MUST be the first line and must use gevent's function
monkey.patch_all()

from app import create_app

# The factory returns both objects
app, socketio = create_app()

if __name__ == "__main__":
    # This allows you to run "python wsgi.py" for local testing
    socketio.run(app)