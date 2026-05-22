/**
 * Nordle game client. Anti-Wordle: you're trying NOT to guess the hidden
 * word. The server owns the real state (dictionary, hidden word, scoring);
 * this file only handles rendering and input. All game-state changes
 * round-trip through the API in docs/api/.
 *
 * Top-level functions are stateless. main() owns the two pieces of mutable
 * state (sessionId, activeRow) and threads them through event handlers.
 */

// =============================================================================
// Types
// =============================================================================

// Shapes the server sends back. docs/api/ is the source of truth.

/** @typedef {"G" | "Y" | "B"} TileResult */

/**
 * @typedef {Object} Guess
 * @property {string} word
 * @property {TileResult[]} result
 * @property {number} words_remaining
 */

/**
 * @typedef {Object} GameState
 * @property {boolean} ok
 * @property {string} [session_id]
 * @property {Guess[]} guesses
 * @property {number} [starting_words]
 * @property {string} [hidden_word]
 * @property {string} [reason]
 */

/**
 * @typedef {Object} TileSpec
 * @property {string} className
 * @property {string} [text]
 */

/** @typedef {Record<string, TileResult>} LetterStates */

// =============================================================================
// Constants
// =============================================================================

const TOTAL_ROWS = 6;
const WORD_LENGTH = 5;
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

// Maps failure reasons to user-facing messages. Most reasons come from the
// server (see docs/api/); `network_error` is synthesized by `post()` when
// fetch itself fails.
const FAILURE_MESSAGES = {
    invalid_word: "Not a valid word.",
    game_complete: "This game is already over.",
    session_not_found: "Session not found — start a new game.",
    network_error: "Couldn't reach the server. Try again.",
};

// =============================================================================
// DOM references
// =============================================================================

// Looked up once at startup so every function shares one handle to each
// element instead of re-querying the document on every call.

const guessesEl = document.getElementById("guesses");
const statsEl = document.getElementById("stats");
const messageEl = document.getElementById("message");
const keyboardEl = document.getElementById("keyboard");
const guessForm = /** @type {HTMLFormElement} */ (document.getElementById("guess-form"));
const guessInput = /** @type {HTMLInputElement} */ (document.getElementById("guess-input"));
const submitBtn = /** @type {HTMLButtonElement} */ (guessForm.querySelector("button"));

// =============================================================================
// API
// =============================================================================

/**
 * POST JSON to /api/<endpoint> and return the parsed response. Every
 * endpoint takes JSON and returns JSON, so one helper covers them all.
 * See docs/api/ for the contracts.
 *
 * @param {string} endpoint
 * @param {object} body
 * @returns {Promise<any>}
 */
async function post(endpoint, body) {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return await response.json();
    } catch {
        // Network failure or malformed response. Surfaced through the same
        // {ok: false, reason} channel as server-side failures so callers
        // don't need a separate code path.
        return { ok: false, reason: "network_error" };
    }
}

// =============================================================================
// Pure helpers
// =============================================================================

/** @returns {TileSpec[]} */
function emptyTiles() {
    return Array.from({ length: WORD_LENGTH }, () => ({ className: "tile tile-empty" }));
}

/**
 * Best-known result per letter across all guesses (G > Y > B). Drives the
 * keyboard coloring: a letter shown green once stays green even if a later
 * guess places it in a wrong position.
 * @param {Guess[]} guesses
 * @returns {LetterStates}
 */
function computeLetterStates(guesses) {
    // Higher number wins when the same letter appears with different results.
    const LETTER_PRIORITY = { G: 3, Y: 2, B: 1 };

    /** @type {LetterStates} */
    const states = {};
    for (const guess of guesses) {
        for (let i = 0; i < guess.word.length; i++) {
            const letter = guess.word[i];
            const result = guess.result[i];
            if ((LETTER_PRIORITY[result] ?? 0) > (LETTER_PRIORITY[states[letter]] ?? 0)) {
                states[letter] = result;
            }
        }
    }
    return states;
}

// =============================================================================
// Rendering
// =============================================================================

// Functions that build or mutate DOM. They modify the shared document tree
// but don't read or write any other state.

/** @param {TileSpec[]} tiles */
function createRow(tiles) {
    const row = document.createElement("div");
    row.className = "guess-row";
    for (const { className, text } of tiles) {
        const tile = document.createElement("div");
        tile.className = className;
        if (text) tile.textContent = text;
        row.appendChild(tile);
    }
    return row;
}

/**
 * Render the grid: completed guesses, then an active input row (unless the
 * game is over), then enough empty rows to fill out 6 total. Returns the
 * active row so the caller can keep typing into it.
 * @param {{guesses: Guess[], hidden_word?: string}} state
 * @returns {HTMLElement | null}
 */
function renderGrid(state) {
    // Clear and rebuild from scratch. At 6 rows this is plenty fast — no need
    // for any incremental diffing.
    guessesEl.innerHTML = "";

    for (const guess of state.guesses) {
        const tiles = guess.word.split("").map((letter, i) => ({
            className: `tile tile-${guess.result[i]}`,
            text: letter,
        }));
        guessesEl.appendChild(createRow(tiles));
    }

    const complete = !!state.hidden_word;
    const activeRow = complete ? null : createRow(emptyTiles());
    if (activeRow) guessesEl.appendChild(activeRow);

    const filledRows = state.guesses.length + (complete ? 0 : 1);
    for (let r = filledRows; r < TOTAL_ROWS; r++) {
        guessesEl.appendChild(createRow(emptyTiles()));
    }

    return activeRow;
}

/**
 * Overwrite the active row's tiles with the letters typed so far. No-op
 * when there is no active row (game complete or before startup).
 * @param {HTMLElement | null} row
 * @param {string} currentGuess
 */
function updateActiveRow(row, currentGuess) {
    if (!row) return;
    row.querySelectorAll(".tile").forEach((tile, i) => {
        tile.textContent = currentGuess[i] ?? "";
    });
}

/** @param {GameState} state */
function renderStats(state) {
    const lastGuess = state.guesses.at(-1);
    const wordsRemaining = lastGuess ? lastGuess.words_remaining : state.starting_words;
    const numberEl = document.createElement("span");
    numberEl.textContent = String(wordsRemaining);
    statsEl.replaceChildren(numberEl, ` of ${state.starting_words} words remaining`);
}

/** Build the on-screen keyboard once at startup; later updates only set classes. */
function buildKeyboard() {
    for (const row of KEYBOARD_ROWS) {
        const rowEl = document.createElement("div");
        rowEl.className = "keyboard-row";
        for (const letter of row) {
            const key = document.createElement("div");
            key.className = "key";
            key.textContent = letter.toUpperCase();
            key.dataset.letter = letter;
            // Dispatch input so the input handler stays the single source of
            // truth for "guess changed" — setting .value programmatically
            // does not fire the input event on its own.
            key.addEventListener("click", () => {
                if (!guessInput.disabled && guessInput.value.length < WORD_LENGTH) {
                    guessInput.value += letter;
                    guessInput.dispatchEvent(new Event("input"));
                }
            });
            rowEl.appendChild(key);
        }
        keyboardEl.appendChild(rowEl);
    }
}

/** @param {LetterStates} letterStates */
function updateKeyboard(letterStates) {
    keyboardEl.querySelectorAll(".key").forEach((key) => {
        const state = letterStates[/** @type {HTMLElement} */ (key).dataset.letter];
        key.className = `key${state ? ` tile-${state}` : ""}`;
    });
}

// =============================================================================
// UI controls
// =============================================================================

/**
 * Disable or enable the input and the submit button together.
 * @param {boolean} enabled
 */
function setFormEnabled(enabled) {
    guessInput.disabled = !enabled;
    submitBtn.disabled = !enabled;
}

/**
 * @param {string} text
 * @param {"" | "win" | "loss" | "error"} [type]
 */
function setMessage(text, type = "") {
    messageEl.textContent = text;
    messageEl.className = type;
}

/**
 * Anti-Wordle scoring: you win by exhausting the word pool without ever
 * matching the hidden word, so a winning final guess is NOT all green.
 * An all-green final guess means you accidentally guessed it — a loss.
 * @param {GameState} state
 */
function showEndGameMessage(state) {
    const lastGuess = state.guesses.at(-1);
    const won = lastGuess.result.some(r => r !== "G");
    setMessage(
        won ? `You win! The word was "${state.hidden_word}".`
            : `You lose! You guessed "${state.hidden_word}".`,
        won ? "win" : "loss"
    );
}

// =============================================================================
// Game actions
// =============================================================================

// Higher-level operations composed from the rendering and UI helpers above.
// Each one returns whatever state the caller needs to keep tracking.

/**
 * Reset the UI to a fresh, pre-game state. Does not touch session state.
 * @returns {HTMLElement | null} the active row of the empty grid
 */
function startGame() {
    guessInput.value = "";
    statsEl.innerHTML = "";
    setMessage("");
    const activeRow = renderGrid({ guesses: [] });
    updateKeyboard({});
    guessInput.focus();
    return activeRow;
}

/**
 * Render a complete server-returned game state.
 * @param {GameState} state
 * @returns {HTMLElement | null}
 */
function renderState(state) {
    const activeRow = renderGrid(state);
    renderStats(state);
    updateKeyboard(computeLetterStates(state.guesses));

    if (state.hidden_word) {
        showEndGameMessage(state);
    } else {
        setFormEnabled(true);
        guessInput.focus();
    }
    return activeRow;
}

/**
 * Submit the current input as a guess. Creates a session on the fly if one
 * doesn't exist yet. Returns the updated sessionId and activeRow for the
 * caller to track — keeping mutable state out of the module scope.
 * @param {string | null} sessionId
 * @param {HTMLElement | null} activeRow
 * @returns {Promise<{sessionId: string | null, activeRow: HTMLElement | null}>}
 */
async function submitGuess(sessionId, activeRow) {
    const guess = guessInput.value.trim().toLowerCase();
    if (guess.length !== WORD_LENGTH) {
        setMessage(`Guess must be ${WORD_LENGTH} letters.`, "error");
        return { sessionId, activeRow };
    }

    setMessage("");
    setFormEnabled(false);

    // Lazy session creation: the player can type a guess before the server
    // knows anything about them. On their first submit we create the session,
    // then immediately use it to send the guess.
    if (!sessionId) {
        const created = await post("create_session", {});
        if (!created.ok) {
            setMessage(FAILURE_MESSAGES[created.reason] ?? "Failed to start a new game.", "error");
            setFormEnabled(true);
            return { sessionId: null, activeRow };
        }
        sessionId = created.session_id;
    }

    guessInput.value = "";
    updateActiveRow(activeRow, "");

    const state = await post("update_session", { session_id: sessionId, guess });

    if (!state.ok) {
        setFormEnabled(true);
        setMessage(FAILURE_MESSAGES[state.reason] ?? "Something went wrong.", "error");
        return { sessionId, activeRow };
    }

    // renderState rebuilds the grid and returns the new active row (or null
    // if the game just ended). That value bubbles back up to main().
    return { sessionId, activeRow: renderState(state) };
}

// =============================================================================
// Entry point
// =============================================================================

/**
 * Owns the only mutable state in the module — `sessionId` and `activeRow` —
 * and wires up event handlers. Keeping that state here means top-level
 * functions stay stateless; state is passed in and returned, never reached
 * for from across the module.
 */
function main() {
    let sessionId = null;

    buildKeyboard();
    let activeRow = startGame();

    guessForm.addEventListener("submit", async (event) => {
        // Stop the form from triggering a full page reload — we handle the
        // submit ourselves.
        event.preventDefault();
        const result = await submitGuess(sessionId, activeRow);
        sessionId = result.sessionId;
        activeRow = result.activeRow;
    });

    guessInput.addEventListener("input", (e) => {
        const value = /** @type {HTMLInputElement} */ (e.target).value.toLowerCase();
        updateActiveRow(activeRow, value);
    });

    document.getElementById("new-game-btn").addEventListener("click", () => {
        sessionId = null;
        activeRow = startGame();
    });

    // Typing anywhere on the page goes into the guess input. If the input is
    // already focused we skip — its native handling does the same thing and
    // we don't want to double-process the key.
    document.addEventListener("keydown", (e) => {
        if (document.activeElement === guessInput) return;
        if (guessInput.disabled) return;
        // Don't swallow browser/OS shortcuts (CTRL+R, CMD+L, etc.) — those
        // should keep doing their normal thing, not type into the game.
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        if (e.key === "Enter") {
            // Skip when a button is focused so Enter clicks it natively
            // (the Guess button submits the form, New Game starts a new game).
            if (document.activeElement instanceof HTMLButtonElement) return;
            guessForm.requestSubmit();
            return;
        } else if (e.key === "Backspace" || e.key === "Delete") {
            guessInput.value = guessInput.value.slice(0, -1);
        } else if (/^[a-zA-Z]$/.test(e.key) && guessInput.value.length < WORD_LENGTH) {
            guessInput.value += e.key.toLowerCase();
        } else {
            // Tab, arrow keys, function keys, etc. — leave alone.
            return;
        }
        // Pull focus onto the input so the next keystroke goes through native
        // input handling — and Enter submits the form instead of clicking
        // whichever button happened to be focused before.
        guessInput.focus();
        updateActiveRow(activeRow, guessInput.value.toLowerCase());
    });
}

main();
