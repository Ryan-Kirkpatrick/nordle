from flask import render_template
from . import pages_bp


@pages_bp.route("/", methods=["GET"])
def game():
    return render_template("game.html")
