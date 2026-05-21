from flask import Blueprint

pages_bp = Blueprint("pages", __name__, url_prefix="/")

# Import each route
from . import example