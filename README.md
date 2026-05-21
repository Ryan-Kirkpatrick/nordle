# Nordle

Nordle (**N**ot W**ordle**) is a learning project designed to teach the basics of web development using Flask.

The idea of the project is taken from [dontwordle.com](https://dontwordle.com/), although we don't bother with undos.

# Rules of Nordle

Nordle is just like Wordle, except that we are trying to NOT guess the word.

Much like Wordle, you have 6 attempts to NOT guess the word. Of course, it would be too easy if you were allowed to make any 6 guesses, so all of your guesses must use the hints from previous guesses:

 - 🟩 Once you place a letter correctly, then future guesses must contain that same letter in the same position.
 - 🟨 Once you place a correct letter in an incorrect location, then future guesses must contain that letter in a different location.
 - ⬜ Once letters have been guessed and eliminated, then you can no longer use them.

If you enter the word (the one you are trying not to guess) then you lose! If you use up all 6 guesses without guessing the word then you win! 

# Setting up a Developer Environment

## Linux/ WSL

Setup virtual environment and install dependencies:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Windows
Lol.

# Formatting

This project strictly uses PEP8 style formatting. Formatting may be corrected at any time using
```bash
black .
```

or, if you do not want to make changes:
```bash
black --check .
```
