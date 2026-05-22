# Nordle API Documentation

Nordle uses a RPC (Remote Procedure Call) API to manage game state between the client and the server. 

## Sessions

Each game of Nordle is considered a session. Sessions:
 - Have a unique ID which can be used to manipulate them
 - Store all the information about a game including the hidden word and what guesses have been made.

Until a session is complete (the player has won or lost the game) the hidden word is kept exclusively on the server side. This prevents cheating.

## Conventions

All endpoints expect requests to be:
 - `POST`ed.
 - Be of the `application/json` mimetype.
 - Have a payload made up of valid JSON.

All responses from endpoints will:
 - Give an HTTP 200 code, even if the operation failed.
 - Be of the `application/json` mimetype.
 - Have a payload made up of valid JSON which: 
   - Will contain a boolean `ok`, which may be used to determine if the operation was successful.
   - May (or may not) contain a string `reason`, which is defined per-endpoint. Clients may use this for error handling.
   - May (or may not) contain a string `msg`, which will contain a human readable message with more information on the status of the request. Useful for debugging.

## API Endpoints

 - [`create_session`](./create_session.md): Create a new game session.
 - [`get_session`](./get_session.md): Obtain information about an existing game session.
 - [`update_session`](./update_session.md): Update an existing game session, in particular, to make a guess.