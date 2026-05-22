from flask.testing import FlaskClient


def test(client: FlaskClient):
    response = client.get("/")
    assert response.status_code == 200
