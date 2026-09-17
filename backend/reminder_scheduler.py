
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from plyer import notification

from database import SessionLocal
from models import MedicineReminder


# =========================================================
# CHECK MEDICINE REMINDERS
# =========================================================

def check_medicine_reminders():

    db = SessionLocal()

    try:

        # Current time in HH:MM format
        current_time = datetime.now().strftime("%H:%M")

        print(
            f"Checking medicine reminders... "
            f"Current time: {current_time}"
        )

        # -------------------------------------------------
        # Get active reminders
        # -------------------------------------------------

        reminders = (
            db.query(MedicineReminder)
            .filter(
                MedicineReminder.is_active == 1
            )
            .all()
        )

        # -------------------------------------------------
        # Check each reminder
        # -------------------------------------------------

        for reminder in reminders:

            print(
                f"Reminder: {reminder.medicine_name} "
                f"at {reminder.reminder_time}"
            )

            # -------------------------------------------------
            # Compare stored time with current time
            # -------------------------------------------------

            if reminder.reminder_time == current_time:

                print(
                    f"Medicine reminder triggered: "
                    f"{reminder.medicine_name}"
                )

                # -------------------------------------------------
                # Desktop notification
                # -------------------------------------------------

                notification.notify(

                    title="SIFHM Medicine Reminder",

                    message=(
                        f"Time to take "
                        f"{reminder.medicine_name}."
                    ),

                    timeout=10
                )

    except Exception as error:

        print(
            f"Reminder scheduler error: {error}"
        )

    finally:

        db.close()


# =========================================================
# START SCHEDULER
# =========================================================

def start_scheduler():

    scheduler = BackgroundScheduler()

    scheduler.add_job(
        check_medicine_reminders,
        "interval",
        minutes=1,
        id="medicine_reminder_checker",
        replace_existing=True
    )

    scheduler.start()

    print(
        "Medicine reminder scheduler started."
    )

    return scheduler

