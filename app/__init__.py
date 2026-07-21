from flask import Flask
from app.extensions import db
from app.pages import pages_bp
from app.api import api_bp
from config import Config
from app import models


def create_app():
    # Create app
    app = Flask(__name__)

    # Configure
    app.config.from_object(Config)

    # Add extensions
    db.init_app(app)

    # Add blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(pages_bp)

    # Create database tables
    with app.app_context():
        db.create_all()

    return app
