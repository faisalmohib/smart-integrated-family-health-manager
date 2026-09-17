from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from database import Base


# =========================================================
# USER MODEL
# =========================================================

class User(Base):

    __tablename__ = "users"

    # -----------------------------------------------------
    # ID
    # -----------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    name = Column(
        String(100),
        nullable=False
    )

    # -----------------------------------------------------
    # EMAIL
    # -----------------------------------------------------

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    # -----------------------------------------------------
    # PASSWORD HASH
    # -----------------------------------------------------

    password_hash = Column(
        String(255),
        nullable=False
    )

    # -----------------------------------------------------
    # CREATED DATE
    # -----------------------------------------------------

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )