import bcrypt
from datetime import datetime, timedelta

from jose import jwt


# =========================================================
# JWT CONFIGURATION
# =========================================================

SECRET_KEY = "sifhm-secret-key-change-this-later"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# PASSWORD HASHING
# =========================================================

def hash_password(password: str) -> str:

    password_bytes = password.encode("utf-8")

    # bcrypt supports maximum 72 bytes
    if len(password_bytes) > 72:

        raise ValueError(
            "Password must be 72 bytes or fewer."
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


# =========================================================
# PASSWORD VERIFICATION
# =========================================================

def verify_password(
    password: str,
    password_hash: str
) -> bool:

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        return False

    return bcrypt.checkpw(
        password_bytes,
        password_hash.encode("utf-8")
    )


# =========================================================
# CREATE JWT TOKEN
# =========================================================

def create_access_token(
    user_id: int
) -> str:

    expire = (
        datetime.utcnow()
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )