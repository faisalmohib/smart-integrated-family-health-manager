
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import MedicineReminder


router = APIRouter(
    prefix="/api/medicines",
    tags=["Medicine Reminder"]
)


# =========================================================
# REQUEST MODEL
# =========================================================

class MedicineRequest(BaseModel):

    medicine_name: str = Field(
        ...,
        min_length=1,
        max_length=200
    )

    reminder_time: str = Field(
        ...,
        description="Time in 24-hour format HH:MM"
    )


# =========================================================
# CREATE MEDICINE REMINDER
# =========================================================

@router.post("/reminders")
def create_reminder(
    request: MedicineRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Validate time
    # -----------------------------------------------------

    try:

        hour, minute = map(
            int,
            request.reminder_time.split(":")
        )

        if hour < 0 or hour > 23:
            raise ValueError

        if minute < 0 or minute > 59:
            raise ValueError

        # IMPORTANT:
        # Store as STRING because database column is String(5)
        reminder_time = f"{hour:02d}:{minute:02d}"

    except (ValueError, TypeError):

        raise HTTPException(
            status_code=400,
            detail="Invalid time format. Use HH:MM, for example 17:23."
        )

    # -----------------------------------------------------
    # Create reminder
    # -----------------------------------------------------

    reminder = MedicineReminder(
        medicine_name=request.medicine_name.strip(),
        reminder_time=reminder_time,
        is_active=1
    )

    try:

        db.add(reminder)
        db.commit()
        db.refresh(reminder)

    except Exception as error:

        db.rollback()

        print(f"Medicine reminder error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Unable to create medicine reminder."
        )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Medicine reminder created successfully.",
        "reminder": {
            "id": reminder.id,
            "medicine_name": reminder.medicine_name,
            "time": reminder.reminder_time,
            "is_active": bool(reminder.is_active)
        }
    }


# =========================================================
# GET ALL MEDICINE REMINDERS
# =========================================================

@router.get("/reminders")
def get_reminders(
    db: Session = Depends(get_db)
):

    reminders = (
        db.query(MedicineReminder)
        .order_by(MedicineReminder.reminder_time)
        .all()
    )

    return {
        "success": True,
        "reminders": [
            {
                "id": reminder.id,
                "medicine_name": reminder.medicine_name,
                "time": reminder.reminder_time,
                "is_active": bool(reminder.is_active)
            }
            for reminder in reminders
        ]
    }


# =========================================================
# DELETE MEDICINE REMINDER
# =========================================================

@router.delete("/reminders/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db)
):

    reminder = (
        db.query(MedicineReminder)
        .filter(
            MedicineReminder.id == reminder_id
        )
        .first()
    )

    if not reminder:

        raise HTTPException(
            status_code=404,
            detail="Reminder not found."
        )

    try:

        db.delete(reminder)
        db.commit()

    except Exception as error:

        db.rollback()

        print(f"Delete reminder error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Unable to delete reminder."
        )

    return {
        "success": True,
        "message": "Reminder deleted successfully."
    }

