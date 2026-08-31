import random

from flask import request, jsonify

from app.models.model import Session, Guess
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
    """
    This endpoint is used to create a session, and should be used to start a new game.
    """
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
    """
    This endpoint is used to retrieve information about an existing session, including guesses that have been made.

    1. Retrieves session details in form of JSON dict
    2. Retrieves session id from session details
    3. Retrieves session from database based on session id
    """

    try:
        session_details = request.get_json(silent=True)
        session_id = session_details.get("session_id")
        session = db.session.get(Session, session_id)

        return jsonify(
            {
                "ok": True,
                "session_id": session_id,
                "guesses": [session.guesses],
                "starting_words": 12674,
            }
        )

    except:
        return jsonify({"ok": False, "reason": "session_not_found"})


@api_bp.route("/update_session", methods=["POST"])
def update_session(session_id: str, guess: str):  # session.modified = True
    """
    This endpoint is used to make a guess in an existing session.

    Client provides a guess which is sent via POST to guess database.

    Guess database is then updated to include the guess, which in turn updates session database.

    Returns updated session.
    """

    session = db.session.get_one(Session, session_id)
    db.guess.add(guess)
    db.guess.commit()

    return jsonify(
        {
            "ok": True,
            "session_id": session.id,
            "guesses": [session.guesses],
            "starting_words": 12674,
        }
    )
