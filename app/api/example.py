from flask import jsonify
from . import api_bp


@api_bp.route("/example", methods=["GET"])
def example():
    return jsonify(
        {
            "ok": True,
            "msg": "Hello!",
        }
    )
