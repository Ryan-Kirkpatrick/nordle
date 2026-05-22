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

On success the endpoint will provide a unique session ID that may be used with other endpoints.

```json
{
    "ok": true,
    "session_id": "c0a95416-a39e-4adb-a7fc-b05f90e61ec4"
}
```

**Response Body:**
| Field | Type | Description |
|-------|------|-------------|
| `ok` | Boolean | Always `true` on success. |
| `session_id` | String | Session UUID that may be used to retrieve information on and modify the game. |

### Failure


No reason is supplied for failure. This operation is intended to always succeed.

`ok` will always be `false` on failure.

```json
{
    "ok": false
}
```
