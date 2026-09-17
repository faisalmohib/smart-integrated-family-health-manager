from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from database import Base


# =========================================================
# MEDICINE REMINDER
# =========================================================

class MedicineReminder(Base):

    __tablename__ = "medicine_reminders"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    medicine_name = Column(
        String(200),
        nullable=False
    )

    reminder_time = Column(
        String(5),
        nullable=False
    )

    is_active = Column(
        Integer,
        default=1
    )


# =========================================================
# HEALTH PROFILE
# =========================================================

class HealthProfile(Base):

    __tablename__ = "health_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    blood_group = Column(
        String(10),
        nullable=True
    )

    allergies = Column(
        Text,
        nullable=True
    )

    medical_history = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


# =========================================================
# HEALTH RECORD
# =========================================================

class HealthRecord(Base):

    __tablename__ = "health_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    record_type = Column(
        String(50),
        nullable=False
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )


