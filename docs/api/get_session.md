# `get_session`

```
/api/get_session
```

The `get_session` endpoint is used to retrieve information about an existing session, including guesses that have been made.

## Request

```http
POST /api/get_session HTTP/1.1
Content-Type: application/json

{
    "session_id": "c0a95416-a39e-4adb-a7fc-b05f90e61ec4"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | String | The UUID of the session to retrieve. |

## Response

### Success - Fresh Game

Example response from a fresh game, with no guesses.

```json
{
    "ok": true,
    "session_id": "c0a95416-a39e-4adb-a7fc-b05f90e61ec4",
    "guesses": [],
    "starting_words": 12674
}
```

**Response Body:**
| Field | Type | Description |
|-------|------|-------------|
| `ok` | Boolean | Always `true` on success. |
| `session_id` | String | The UUID of the session. |
| `guesses` | Array | The guesses made so far. On a fresh game, this will be empty. |
| `starting_words` | Integer | How many words are in the pool. |

### Success - Game In Progress

Example response from a game in progress with two guesses made. The hidden word is "crumb", although this information is only known to the server.

```json
{
    "ok": true,
    "session_id": "c0a95416-a39e-4adb-a7fc-b05f90e61ec4",
    "guesses": [
        {
            "word": "zebra",
            "result": ["B","B","Y","Y","B"],
            "words_remaining": 103
        },
        {
            "word": "brink",
            "result": ["Y","G","B","B","B"],
            "words_remaining": 7
        }
    ],
    "starting_words": 12674
}
```

**Response Body:**
| Field | Type | Description |
|-------|------|-------------|
| `ok` | Boolean | Always `true` on success. |
| `session_id` | String | The UUID of the session. |
| `guesses` | Array | See later note. |
| `starting_words` | Integer | How many words are in the pool. |


### Success - Completed Game

Example response from a completed game where the player lost by guessing the hidden word "crumb". When a game is complete, `hidden_word` is included in the response. A player wins by exhausting all possible words without guessing the hidden word — a winning game's final guess will have `words_remaining` greater than `0` and will never show all `"G"` results.

```json
{
    "ok": true,
    "session_id": "c0a95416-a39e-4adb-a7fc-b05f90e61ec4",
    "guesses": [
        {
            "word": "zebra",
            "result": ["B","B","Y","Y","B"],
            "words_remaining": 103
        },
        {
            "word": "brink",
            "result": ["Y","G","B","B","B"],
            "words_remaining": 7
        },
        {
            "word": "crumb",
            "result": ["G","G","G","G","G"],
            "words_remaining": 0
        }
    ],
    "starting_words": 12674,
    "hidden_word": "crumb"
}
```

**Response Body:**
| Field | Type | Description |
|-------|------|-------------|
| `ok` | Boolean | Always `true` on success. |
| `session_id` | String | The UUID of the session. |
| `guesses` | Array | See later note. |
| `starting_words` | Integer | How many words are in the pool. |
| `hidden_word` | String | The word the player was trying to avoid guessing. Only present when the game is complete. |


### `guesses` field

Each entry in the `guesses` array represents one guess made by the player, in order.

```json
{
    "word": "zebra",
    "result": ["B", "B", "Y", "Y", "B"],
    "words_remaining": 103
}
```

| Field | Type | Description |
|-------|------|-------------|
| `word` | String | The word that was guessed. |
| `result` | Array | The result for each letter in `word`, in order. Each entry will be `"G"`, `"Y"`, or `"B"`. |
| `words_remaining` | Integer | How many words remain possible after this guess. Reaches `0` when the player has guessed the hidden word (a loss), or when only one word remained and it was eliminated (a win). |

**`result` values:**

| Value | Color | Meaning |
|-------|--------|---------|
| `"G"` | Green | This letter is in the hidden word at this exact position. |
| `"Y"` | Yellow | This letter is in the hidden word, but not at this position. |
| `"B"` | Black | This letter does not appear in the hidden word. |


### Failure

`ok` will always be `false` on failure.

```json
{
    "ok": false,
    "reason": "session_not_found"
}
```

| `reason` | Meaning |
|----------|---------|
| `session_not_found` | No session exists with the provided `session_id`. |
| `invalid_request` | The request was malformed or missing required arguments. |
