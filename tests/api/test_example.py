from flask.testing import FlaskClient


def test(client: FlaskClient):
    response = client.get("/api/example")
    assert response.status_code == 200
    data = response.get_json()
    assert data == {
        "ok": True,
        "msg": "Hello!",
    }
