from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db

from auth.models import User
from auth.schemas import (
    SignupRequest,
    LoginRequest
)

from auth.security import (
    hash_password,
    verify_password,
    create_access_token
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# =========================================================
# SIGN UP
# =========================================================

@router.post("/signup")
def signup(
    request: SignupRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Check existing email
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == request.email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email is already registered."
        )

    # -----------------------------------------------------
    # Validate password length
    # bcrypt supports maximum 72 bytes
    # -----------------------------------------------------

    password_bytes = request.password.encode("utf-8")

    if len(password_bytes) > 72:

        raise HTTPException(
            status_code=400,
            detail="Password must be 72 bytes or fewer."
        )

    # -----------------------------------------------------
    # Hash password
    # -----------------------------------------------------

    try:

        password_hash = hash_password(
            request.password
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    # -----------------------------------------------------
    # Create user
    # -----------------------------------------------------

    user = User(
        name=request.name,
        email=request.email,
        password_hash=password_hash
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


# =========================================================
# SIGN IN
# =========================================================

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find user
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == request.email
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # -----------------------------------------------------
    # Verify password
    # -----------------------------------------------------

    try:

        password_valid = verify_password(
            request.password,
            user.password_hash
        )

    except Exception:

        password_valid = False

    if not password_valid:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # -----------------------------------------------------
    # Create JWT token
    # -----------------------------------------------------

    access_token = create_access_token(
        user.id
    )

    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }