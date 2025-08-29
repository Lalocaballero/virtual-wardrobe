from app import create_app

# The factory now returns both objects
app, socketio = create_app()

if __name__ == "__main__":
    # This allows you to run "python wsgi.py" for local testing
    socketio.run(app, debug=True)