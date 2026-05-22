# `create_session`

```
/api/create_session
```

The `create_session` endpoint is used to create a session, and should be used to start a new game.

## Request

This endpoint does not take any parameters, the payload will be ignored. It is acceptable to have an empty payload.

```http
POST /api/create_session HTTP/1.1
Content-Type: application/json

{}
```

## Response

### Success

On success, the full initial game state is returned. The response is identical in shape to [`get_session`](./get_session.md) — refer to that page for the complete field descriptions and examples.

### Failure


No reason is supplied for failure. This operation is intended to always succeed.

`ok` will always be `false` on failure.

```json
{
    "ok": false
}
```
