# `update_session`

```
/api/update_session
```

The `update_session` endpoint is used to make a guess in an existing session.

## Request

```http
POST /api/update_session HTTP/1.1
Content-Type: application/json

{
    "session_id": "c0a95416-a39e-4adb-a7fc-b05f90e61ec4",
    "guess": "crane"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | String | The UUID of the session to update. |
| `guess` | String | The word being guessed. |

## Response

On success, the full updated game state is returned. The response is identical in shape to [`get_session`](./get_session.md) — refer to that page for the complete field descriptions and examples.

### Failure

`ok` will always be `false` on failure.

```json
{
    "ok": false,
    "reason": "invalid_word"
}
```

| `reason` | Meaning |
|----------|---------|
| `session_not_found` | No session exists with the provided `session_id`. |
| `game_complete` | The game is already over and no more guesses can be made. |
| `invalid_word` | The guess is not a valid word. |
