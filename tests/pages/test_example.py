from flask.testing import FlaskClient

def test(client: FlaskClient):
    response = client.get("/example")

    assert response.status_code == 200
    text = response.data.decode("utf-8")
    assert "Hello!" == text