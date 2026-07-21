import random

from flask import jsonify, request

from app.models.model import Session
from app import db
from . import api_bp

STARTING_WORDS = [
    "ABCDE",
    "FGHIJ",
    "KLMNO",
    "PQRST",
]  # Constant list containing all available words


@api_bp.route("/example", methods=["GET"])
def example():
    return jsonify(
        {
            "ok": True,
            "msg": "Hello!",
        }
    )


@api_bp.route("/create_session", methods=["POST"])
def create_session():  # check if there is a previous session, otherwise session.new = True
    session = Session(hidden_word=random.choice(STARTING_WORDS), guesses=[])
    db.session.add(session)
    db.session.commit()
    return jsonify(
        {
            "ok": True,
            "session_id": session.id,
            "guesses": [],
            "starting_words": STARTING_WORDS,
        }
    )


@api_bp.route("/get_session", methods=["POST"])
def get_session():
    return jsonify({})


@api_bp.route("/update_session", methods=["POST"])
def update_session():  # session.modified = True
    return jsonify({})
