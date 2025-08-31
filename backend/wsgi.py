from app import create_app

app = create_app()
application = app  # Gunicorn looks for 'application' by default

if __name__ == "__main__":
    app.run()