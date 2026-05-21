from flask import Response
from . import pages_bp


@pages_bp.route("/example", methods=["GET"])
def example():
    return Response("Hello!")
