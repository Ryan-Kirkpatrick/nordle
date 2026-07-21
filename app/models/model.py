from typing import List

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app import db


class Guess(db.Model):
    __tablename__ = "guesses"

    id: Mapped[int] = mapped_column(primary_key=True)
    guessed_word: Mapped[str] = mapped_column()
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"))

    session: Mapped["Session"] = relationship(back_populates="guesses")


class Session(db.Model):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    hidden_word: Mapped[str] = mapped_column()
    guesses: Mapped[List["Guess"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by=Guess.id
    )
