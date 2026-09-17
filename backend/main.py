from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine


# =========================================================
# IMPORT DATABASE MODELS
# =========================================================

# Authentication model
from auth.models import User

# Existing application models
from models import (
    MedicineReminder,
    HealthProfile,
    HealthRecord
)


# =========================================================
# IMPORT ROUTERS
# =========================================================

from api.symptom_checker import (
    router as symptom_checker_router
)

from api.medicine_reminder import (
    router as medicine_reminder_router
)

from api.health_vault import (
    router as health_vault_router
)

from api.chat_history import (
    router as chat_history_router
)

from auth.router import (
    router as auth_router
)

from reminder_scheduler import start_scheduler


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="SIFHM API",
    description="Smart Integrated Family Health Manager",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# ROUTES
# =========================================================

app.include_router(
    symptom_checker_router
)

app.include_router(
    medicine_reminder_router
)

app.include_router(
    health_vault_router
)

app.include_router(
    chat_history_router
)

app.include_router(
    auth_router
)


# =========================================================
# START MEDICINE REMINDER SCHEDULER
# =========================================================

@app.on_event("startup")
def startup_event():

    start_scheduler()


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "SIFHM API is running",
        "service": "Smart Integrated Family Health Manager"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }